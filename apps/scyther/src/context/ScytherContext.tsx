import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  db,
  uploadFileToStorage,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fbSignOut,
  signInAnonymously,
  onAuthStateChanged,
  doc,
  setDoc,
  collection,
  onSnapshot,
  type FirebaseUser
} from '@shared/lib/firebase';
import {
  DonorProfile,
  BloodUnit,
  BloodType,
  DonorDocument,
  DonorVerificationTier,
  SystemIssue
} from '@shared/types/bloodchain';
import { INITIAL_DONOR, INITIAL_DONORS } from '@shared/data/seedData';
import { sha256 } from '@shared/lib/crypto';

export interface DonationCenter {
  id: string;
  name: string;
  district: string;
  address: string;
  hours: string;
  urgentNeeds: BloodType[];
  lat: number;
  lng: number;
  /** Illustrative availability for the demonstration environment. */
  slots: { time: string; available: boolean }[];
}

/**
 * ILLUSTRATIVE SITES — these are example locations, not a real facility list.
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
    lng: 25.9087,
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
    lng: 27.5118,
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
    lng: 25.5042,
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
    lng: 23.4167,
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
    lng: 25.9189,
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
  donor: DonorProfile;
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

export const ScytherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [donor, setDonor] = useState<DonorProfile>(() => {
    const saved = localStorage.getItem('scyther_active_donor');
    return saved ? JSON.parse(saved) : INITIAL_DONOR;
  });
  const [donorsList, setDonorsList] = useState<DonorProfile[]>(INITIAL_DONORS);
  const [allUnits, setAllUnits] = useState<BloodUnit[]>([]);
  const [activeShortageAlerts, setActiveShortageAlerts] = useState<SystemIssue[]>([]);
  const [bookedAppointment, setBookedAppointment] = useState<Booking | null>(() => {
    const saved = localStorage.getItem('scyther_booked_slot');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'donorProfiles'),
      snapshot => {
        if (!snapshot.empty) {
          setDonorsList(snapshot.docs.map(d => d.data() as DonorProfile));
        }
      },
      err => console.warn('Scyther donorProfiles sync:', err.message)
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!donor.id) return;
    const unsub = onSnapshot(
      doc(db, 'donorProfiles', donor.id),
      snapshot => {
        if (snapshot.exists()) {
          const updated = snapshot.data() as DonorProfile;
          setDonor(updated);
          localStorage.setItem('scyther_active_donor', JSON.stringify(updated));
        }
      },
      err => console.warn('Scyther donor profile sync:', err.message)
    );
    return () => unsub();
  }, [donor.id]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'bloodUnits'),
      snapshot => {
        if (!snapshot.empty) {
          setAllUnits(snapshot.docs.map(d => d.data() as BloodUnit));
        }
      },
      err => console.warn('Scyther bloodUnits sync:', err.message)
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'systemIssues'),
      snapshot => {
        if (!snapshot.empty) {
          const issues = snapshot.docs.map(d => d.data() as SystemIssue);
          setActiveShortageAlerts(issues.filter(i => i.category === 'SUPPLY_DEFICIT' && i.status === 'OPEN'));
        }
      },
      err => console.warn('Scyther shortages sync:', err.message)
    );
    return () => unsub();
  }, []);

  const donorUnits = allUnits.filter(
    u => donor.linkedUnitDins?.includes(u.din) || u.donorAnonymizedId === donor.anonymizedHash
  );

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

    setDonor(found);
    localStorage.setItem('scyther_active_donor', JSON.stringify(found));
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

    setDonor(newDonor);
    setDonorsList(prev => [newDonor, ...prev]);
    localStorage.setItem('scyther_active_donor', JSON.stringify(newDonor));

    try {
      await setDoc(doc(db, 'donorProfiles', newId), newDonor, { merge: true });
      if (uid) {
        await setDoc(
          doc(db, 'users', uid),
          {
            uid,
            email: cleanEmail,
            displayName: data.fullName,
            role: 'DONOR',
            donorId: newId,
            lastSeen: new Date().toISOString()
          },
          { merge: true }
        );
      }
    } catch (err: any) {
      console.warn('Firestore donor registration save:', err.message);
    }

    return { success: true };
  };

  const quickDemoLogin = (donorId: string) => {
    const found = donorsList.find(d => d.id === donorId) || INITIAL_DONORS.find(d => d.id === donorId);
    if (found) {
      setDonor(found);
      localStorage.setItem('scyther_active_donor', JSON.stringify(found));
    }
  };

  const logoutDonor = async () => {
    try {
      await fbSignOut(auth);
    } catch {
      /* non-blocking */
    }
    localStorage.removeItem('scyther_active_donor');
    setDonor(INITIAL_DONOR);
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

    const updatedDonor: DonorProfile = {
      ...donor,
      uploadedDocuments: [...donor.uploadedDocuments, newDoc],
      tierUpdatedAt: new Date().toISOString()
    };

    setDonor(updatedDonor);
    localStorage.setItem('scyther_active_donor', JSON.stringify(updatedDonor));

    try {
      await setDoc(doc(db, 'donorProfiles', donor.id), updatedDonor, { merge: true });
      const issueId = `ISSUE-${Date.now().toString(36).toUpperCase()}`;
      await setDoc(
        doc(db, 'systemIssues', issueId),
        {
          id: issueId,
          title: `Donor document review: ${donor.fullName}`,
          category: 'DONOR_APPEAL',
          severity: 'MEDIUM',
          facility: 'National Donor Registry Desk',
          affectedEntity: `Donor ID: ${donor.id}`,
          description: `Submitted "${docData.name}" for review.`,
          status: 'OPEN',
          timestamp: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (err: any) {
      console.warn('Firestore document update:', err.message);
    }

    return { success: true };
  };

  const bookAppointment = async (centerId: string, slotDate: string, slotTime: string): Promise<boolean> => {
    const center = EXAMPLE_CENTERS.find(c => c.id === centerId);
    if (!center) return false;

    const booking: Booking = { centerName: center.name, date: slotDate, time: slotTime };
    setBookedAppointment(booking);
    localStorage.setItem('scyther_booked_slot', JSON.stringify(booking));

    try {
      const bookingId = `BK-${Date.now().toString(36).toUpperCase()}`;
      await setDoc(
        doc(db, 'appointments', bookingId),
        {
          id: bookingId,
          donorId: donor.id,
          donorName: donor.fullName,
          bloodType: donor.bloodType,
          centerId,
          centerName: center.name,
          slotDate,
          slotTime,
          status: 'CONFIRMED',
          bookedAt: new Date().toISOString()
        },
        { merge: true }
      );
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
        isAuthenticated: !!donor.id,
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
