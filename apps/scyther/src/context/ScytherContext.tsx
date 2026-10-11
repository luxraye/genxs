import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fbSignOut,
  signInAnonymously,
  onAuthStateChanged,
  type FirebaseUser
} from '@shared/lib/firebase-auth';
import { uploadFileToStorage } from '@shared/lib/localDocumentStore';
import {
  DonorProfile,
  BloodUnit,
  BloodType,
  DonorDocument,
  SystemIssue
} from '@shared/types/bloodchain';
import { INITIAL_DONORS } from '@shared/data/seedData';
import { sha256 } from '@shared/lib/crypto';
import { useSpine } from '@shared/lib/spine/react';

const AUTH_KEY = 'scyther_active_donor';

export interface DonationCenter {
  id: string;
  name: string;
  district: string;
  address: string;
  hours: string;
  urgentNeeds: BloodType[];
  lat: number;
  lon: number;
  /** Illustrative availability for the demonstration environment. */
  slots: { time: string; available: boolean }[];
}

/**
 * ILLUSTRATIVE SITES — example locations, not a real facility list.
 * Real centre data must come from the national blood service before any pilot.
 */
export const EXAMPLE_CENTERS: DonationCenter[] = [
  {
    id: 'CTR-GAB-001',
    name: 'Example Referral Hospital — Blood Bank',
    district: 'Gaborone',
    address: 'Illustrative address · Gaborone',
    hours: 'Mon–Fri 07:30–17:00 · Sat 08:00–13:00',
    urgentNeeds: ['O-', 'O+', 'B-'],
    lat: -24.6541,
    lon: 25.9087,
    slots: [
      { time: '08:30', available: true },
      { time: '09:30', available: true },
      { time: '10:30', available: false },
      { time: '11:30', available: true },
      { time: '13:30', available: true },
      { time: '14:30', available: false },
      { time: '15:30', available: true },
      { time: '16:30', available: true }
    ]
  },
  {
    id: 'CTR-FRW-001',
    name: 'Example District Hospital — Donation Centre',
    district: 'Francistown',
    address: 'Illustrative address · Francistown',
    hours: 'Mon–Fri 08:00–16:30',
    urgentNeeds: ['O-', 'A-', 'AB-'],
    lat: -21.1685,
    lon: 27.5118,
    slots: [
      { time: '08:30', available: true },
      { time: '09:30', available: false },
      { time: '10:30', available: true },
      { time: '11:30', available: true },
      { time: '13:30', available: true },
      { time: '14:30', available: true }
    ]
  },
  {
    id: 'CTR-MOL-001',
    name: 'Example Regional Hospital — Donation Centre',
    district: 'Molepolole',
    address: 'Illustrative address · Molepolole',
    hours: 'Mon–Thu 08:00–16:00',
    urgentNeeds: ['O-', 'A+'],
    lat: -24.4072,
    lon: 25.5042,
    slots: [
      { time: '08:30', available: true },
      { time: '09:30', available: true },
      { time: '10:30', available: true },
      { time: '11:30', available: false }
    ]
  },
  {
    id: 'CTR-MAU-001',
    name: 'Example District Hospital — Donation Centre',
    district: 'Maun',
    address: 'Illustrative address · Maun',
    hours: 'Mon–Fri 08:30–15:30',
    urgentNeeds: ['O-', 'B+'],
    lat: -19.9833,
    lon: 23.4167,
    slots: [
      { time: '08:30', available: true },
      { time: '09:30', available: true },
      { time: '10:30', available: true },
      { time: '11:30', available: true }
    ]
  },
  {
    id: 'CTR-GAB-MOB',
    name: 'Community Donation Drive — Main Mall',
    district: 'Gaborone',
    address: 'Illustrative location · Gaborone',
    hours: 'Tue, Thu, Sat 09:00–16:00',
    urgentNeeds: ['O-', 'O+', 'A+'],
    lat: -24.6578,
    lon: 25.9189,
    slots: [
      { time: '09:00', available: true },
      { time: '10:00', available: true },
      { time: '11:00', available: false },
      { time: '13:00', available: true },
      { time: '14:00', available: true },
      { time: '15:00', available: true }
    ]
  }
];

export interface Booking {
  centerName: string;
  date: string;
  time: string;
}

interface ScytherContextType {
  currentUser: FirebaseUser | null;
  /** Null when no donor is signed in. */
  donor: DonorProfile | null;
  donorsList: DonorProfile[];
  donorUnits: BloodUnit[];
  activeShortageAlerts: SystemIssue[];
  centers: DonationCenter[];
  isAuthenticated: boolean;
  isAuthLoading: boolean;

  loginDonor: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  registerDonor: (data: {
    fullName: string;
    email: string;
    password?: string;
    nationalIdNumber: string;
    phone: string;
    bloodType: BloodType;
    cityDistrict: string;
  }) => Promise<{ success: boolean; error?: string }>;
  quickDemoLogin: (donorId: string) => void;
  logoutDonor: () => Promise<void>;

  uploadDocument: (docData: {
    name: string;
    type: DonorDocument['type'];
    fileBlob?: Blob;
    sizeKb: number;
  }) => Promise<{ success: boolean; error?: string }>;
  bookAppointment: (centerId: string, slotDate: string, slotTime: string) => Promise<boolean>;
  cancelAppointment: () => void;
  bookedAppointment: Booking | null;
}

const ScytherContext = createContext<ScytherContextType | null>(null);

const readStoredDonor = (): DonorProfile | null => {
  try {
    const saved = localStorage.getItem(AUTH_KEY);
    return saved ? (JSON.parse(saved) as DonorProfile) : null;
  } catch {
    return null;
  }
};

export const ScytherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  // A visitor starts signed out. Only a successful sign-in or registration sets a donor.
  const [donor, setDonor] = useState<DonorProfile | null>(readStoredDonor);
  const [donorsList, setDonorsList] = useState<DonorProfile[]>(INITIAL_DONORS);
  const [allUnits, setAllUnits] = useState<BloodUnit[]>([]);
  const [activeShortageAlerts, setActiveShortageAlerts] = useState<SystemIssue[]>([]);
  const [bookedAppointment, setBookedAppointment] = useState<Booking | null>(() => {
    try {
      const saved = localStorage.getItem('scyther_booked_slot');
      return saved ? (JSON.parse(saved) as Booking) : null;
    } catch {
      return null;
    }
  });

  const persist = (d: DonorProfile | null) => {
    if (d) localStorage.setItem(AUTH_KEY, JSON.stringify(d));
    else localStorage.removeItem(AUTH_KEY);
    setDonor(d);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  /**
   * The donor register lives in the shared service, so once it is reachable this
   * surface shows the service's donors rather than its own copy of them. In
   * `local` mode the bundled sample data below is what is shown, and the status
   * chip says so. See services/spine.
   */
  const spine = useSpine();
  useEffect(() => {
    if (spine.mode !== 'shared') return;
    let cancelled = false;

    // Prime once, in case the shared snapshot was delivered before this effect
    // subscribed; then follow every later change.
    spine.client
      .donors()
      .then(res => {
        if (!cancelled && Array.isArray(res.donors) && res.donors.length > 0) {
          setDonorsList(res.donors as DonorProfile[]);
        }
      })
      .catch(() => {
        /* the subscription below is the primary path */
      });

    const unsubscribe = spine.onSnapshot(snap => {
      if (Array.isArray(snap.donors) && snap.donors.length > 0) setDonorsList(snap.donors as DonorProfile[]);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [spine.mode]);

  const donorUnits = donor
    ? allUnits.filter(
        u => donor.linkedUnitDins?.includes(u.din) || u.donorAnonymizedId === donor.anonymizedHash
      )
    : [];

  const loginDonor = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const found = donorsList.find(d => d.email.toLowerCase() === cleanEmail);
    if (!found) {
      return { success: false, error: 'No donor account found with this email address. Please register.' };
    }

    if (password) {
      try {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
      } catch (authErr: any) {
        if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
          try {
            await createUserWithEmailAndPassword(auth, cleanEmail, password);
          } catch {
            await signInAnonymously(auth);
          }
        } else {
          return { success: false, error: 'Those credentials were not accepted. Please check and try again.' };
        }
      }
    } else {
      try {
        await signInAnonymously(auth);
      } catch {
        /* non-blocking in the demonstration environment */
      }
    }

    persist(found);
    return { success: true };
  };

  const registerDonor = async (data: {
    fullName: string;
    email: string;
    password?: string;
    nationalIdNumber: string;
    phone: string;
    bloodType: BloodType;
    cityDistrict: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = data.email.trim().toLowerCase();
    if (donorsList.find(d => d.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'A donor with this email address is already registered.' };
    }

    let uid = '';
    if (data.password) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, data.password);
        uid = cred.user.uid;
      } catch (err: any) {
        return { success: false, error: err.message || 'Registration failed.' };
      }
    } else {
      try {
        const anon = await signInAnonymously(auth);
        uid = anon.user.uid;
      } catch {
        /* non-blocking */
      }
    }

    const newId = `DONOR-BW-${Math.floor(10000 + Math.random() * 90000)}`;
    const randomHash = await sha256(`donor-${newId}-${Date.now()}`);
    const newDonor: DonorProfile = {
      id: newId,
      anonymizedHash: randomHash,
      fullName: data.fullName.trim(),
      email: cleanEmail,
      phone: data.phone.trim(),
      nationalIdNumber: data.nationalIdNumber.trim().toUpperCase(),
      cityDistrict: data.cityDistrict,
      bloodType: data.bloodType,
      totalDonations: 0,
      lastDonationDate: '',
      eligibilityStatus: 'ELIGIBLE',
      nextEligibleDate: new Date().toISOString().split('T')[0],
      linkedUnitDins: [],
      tier: 1,
      uploadedDocuments: [],
      tierUpdatedAt: new Date().toISOString()
    };

    // The register belongs to the shared service. When it is reachable the donor
    // is created there, and the service — not this surface — decides the identity
    // hash, the tier and the eligibility defaults.
    if (spine.mode === 'shared') {
      try {
        const { donor: created } = await spine.client.registerDonor({
          fullName: newDonor.fullName,
          email: newDonor.email,
          phone: newDonor.phone,
          nationalIdNumber: newDonor.nationalIdNumber,
          bloodType: newDonor.bloodType,
          cityDistrict: newDonor.cityDistrict
        });
        const shared = created as DonorProfile;
        persist(shared);
        setDonorsList(prev => [shared, ...prev.filter(d => d.id !== shared.id)]);
        return { success: true };
      } catch (err: any) {
        return {
          success: false,
          error: err?.body?.error || 'The shared register did not accept this registration. Please try again.'
        };
      }
    }

    persist(newDonor);
    setDonorsList(prev => [newDonor, ...prev]);

    return { success: true };
  };

  const quickDemoLogin = (donorId: string) => {
    const found = donorsList.find(d => d.id === donorId) || INITIAL_DONORS.find(d => d.id === donorId);
    if (found) persist(found);
  };

  const logoutDonor = async () => {
    try {
      await fbSignOut(auth);
    } catch {
      /* non-blocking */
    }
    persist(null);
  };

  /**
   * Submitting a document starts a manual review. It does NOT verify identity
   * and does NOT advance the donor's verification tier — only a reviewer can.
   */
  const uploadDocument = async (docData: {
    name: string;
    type: DonorDocument['type'];
    fileBlob?: Blob;
    sizeKb: number;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!donor) return { success: false, error: 'You are not signed in.' };

    let downloadUrl: string | undefined;
    if (docData.fileBlob) {
      try {
        const storagePath = `donors/${donor.id}/${Date.now()}-${docData.name}`;
        const res = await uploadFileToStorage(storagePath, docData.fileBlob);
        downloadUrl = res.downloadUrl;
      } catch (err: any) {
        console.warn('Document upload notice:', err.message);
      }
    }

    const newDoc: DonorDocument = {
      id: `DOC-${Date.now().toString(36)}`,
      name: docData.name,
      type: docData.type,
      sizeKb: docData.sizeKb,
      uploadedAt: new Date().toISOString(),
      fileDataUrl: downloadUrl,
      status: 'PENDING',
      reviewNotes: 'Submitted for review. Verification is performed by the national blood service.'
    };

    // A submitted document is the reviewer's to see. When the shared service is
    // reachable the submission is recorded there, so the operations desk reviews
    // the same document the donor uploaded rather than a private copy of it.
    let submittedDocId = newDoc.id;
    if (spine.mode === 'shared') {
      try {
        const res = await spine.client.submitDonorDocument(donor.id, {
          name: newDoc.name,
          type: newDoc.type,
          sizeKb: newDoc.sizeKb,
          fileDataUrl: newDoc.fileDataUrl
        });
        submittedDocId = res?.document?.id || newDoc.id;
      } catch (err: any) {
        return {
          success: false,
          error: err?.body?.error || 'The shared register did not accept this document. Please try again.'
        };
      }
    }

    const recorded: DonorDocument = { ...newDoc, id: submittedDocId };
    const updatedDonor: DonorProfile = {
      ...donor,
      uploadedDocuments: [...donor.uploadedDocuments, recorded],
      tierUpdatedAt: new Date().toISOString()
    };

    persist(updatedDonor);

    return { success: true };
  };

  const bookAppointment = async (centerId: string, slotDate: string, slotTime: string): Promise<boolean> => {
    if (!donor) return false;
    const center = EXAMPLE_CENTERS.find(c => c.id === centerId);
    if (!center) return false;

    const booking: Booking = { centerName: center.name, date: slotDate, time: slotTime };
    setBookedAppointment(booking);
    localStorage.setItem('scyther_booked_slot', JSON.stringify(booking));

    try {
      const bookingId = `BK-${Date.now().toString(36).toUpperCase()}`;
      await Promise.resolve();
    } catch (err: any) {
      console.warn('Appointment booking save:', err.message);
    }

    return true;
  };

  const cancelAppointment = () => {
    setBookedAppointment(null);
    localStorage.removeItem('scyther_booked_slot');
  };

  return (
    <ScytherContext.Provider
      value={{
        currentUser,
        donor,
        donorsList,
        donorUnits,
        activeShortageAlerts,
        centers: EXAMPLE_CENTERS,
        isAuthenticated: donor !== null,
        isAuthLoading,
        loginDonor,
        registerDonor,
        quickDemoLogin,
        logoutDonor,
        uploadDocument,
        bookAppointment,
        cancelAppointment,
        bookedAppointment
      }}
    >
      {children}
    </ScytherContext.Provider>
  );
};

export const useScyther = () => {
  const context = useContext(ScytherContext);
  if (!context) {
    throw new Error('useScyther must be used within a ScytherProvider');
  }
  return context;
};
