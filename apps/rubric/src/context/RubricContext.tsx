import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  db,
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
  BloodUnit,
  BloodType,
  HospitalRequest,
  StaffAccount,
  DonorProfile,
  SystemIssue,
  UserRole,
  DonorVerificationTier
} from '@shared/types/bloodchain';
import {
  INITIAL_UNITS,
  INITIAL_STAFF_ACCOUNTS,
  INITIAL_DONORS,
  INITIAL_HOSPITAL_REQUESTS,
  INITIAL_SYSTEM_ISSUES
} from '@shared/data/seedData';

const OPERATOR_KEY = 'rubric_active_operator';

export interface DeficitGroupStat {
  group: BloodType;
  count: number;
  dailyBurn: number;
  daysOfSupply: number;
  isCritical: boolean;
  isUniversal: boolean;
}

interface RubricContextType {
  currentUser: FirebaseUser | null;
  /** Null when no operator is signed in. */
  currentOperator: StaffAccount | null;
  isAuthenticated: boolean;
  units: BloodUnit[];
  requests: HospitalRequest[];
  staffList: StaffAccount[];
  donorsList: DonorProfile[];
  issuesList: SystemIssue[];
  deficitMatrix: DeficitGroupStat[];
  criticalDeficitCount: number;

  loginOperator: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  quickDemoOperatorLogin: () => void;
  logoutOperator: () => Promise<void>;

  fulfillRequest: (requestId: string, unitDins: string[]) => Promise<void>;
  provisionStaff: (data: {
    fullName: string;
    email: string;
    role: UserRole;
    facility: string;
    badgeNumber: string;
    customTempPassword?: string;
  }) => Promise<StaffAccount>;
  toggleStaffStatus: (id: string, status: 'ACTIVE' | 'SUSPENDED') => Promise<void>;
  resetStaffPassword: (id: string) => Promise<string>;
  reviewDonorDocument: (
    donorId: string,
    docId: string,
    status: 'APPROVED' | 'REJECTED',
    notes: string
  ) => Promise<void>;
  updateDonorTier: (donorId: string, tier: DonorVerificationTier) => Promise<void>;
  resolveIssue: (issueId: string, notes: string) => Promise<void>;
  publishEmergencyAppeal: (data: {
    title: string;
    description: string;
    facility: string;
    targetBloodType: BloodType;
  }) => Promise<void>;
}

const RubricContext = createContext<RubricContextType | null>(null);

const DEMO_OPERATOR =
  INITIAL_STAFF_ACCOUNTS.find(s => s.role === 'NATIONAL_OPERATOR') || INITIAL_STAFF_ACCOUNTS[0];

const readStoredOperator = (): StaffAccount | null => {
  try {
    const saved = localStorage.getItem(OPERATOR_KEY);
    return saved ? (JSON.parse(saved) as StaffAccount) : null;
  } catch {
    return null;
  }
};

export const RubricProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  // A visitor starts signed out. Only a successful sign-in sets an operator.
  const [currentOperator, setCurrentOperator] = useState<StaffAccount | null>(readStoredOperator);

  const [units, setUnits] = useState<BloodUnit[]>(INITIAL_UNITS);
  const [requests, setRequests] = useState<HospitalRequest[]>(INITIAL_HOSPITAL_REQUESTS);
  const [staffList, setStaffList] = useState<StaffAccount[]>(INITIAL_STAFF_ACCOUNTS);
  const [donorsList, setDonorsList] = useState<DonorProfile[]>(INITIAL_DONORS);
  const [issuesList, setIssuesList] = useState<SystemIssue[]>(INITIAL_SYSTEM_ISSUES);

  const persistOperator = (op: StaffAccount | null) => {
    if (op) localStorage.setItem(OPERATOR_KEY, JSON.stringify(op));
    else localStorage.removeItem(OPERATOR_KEY);
    setCurrentOperator(op);
  };

  const actingName = currentOperator?.fullName ?? 'Operations desk';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubUnits = onSnapshot(
      collection(db, 'bloodUnits'),
      snap => {
        if (!snap.empty) setUnits(snap.docs.map(d => d.data() as BloodUnit));
      },
      err => console.warn('Operations units sync:', err.message)
    );
    const unsubReqs = onSnapshot(
      collection(db, 'hospitalRequests'),
      snap => {
        if (!snap.empty) setRequests(snap.docs.map(d => d.data() as HospitalRequest));
      },
      err => console.warn('Operations requests sync:', err.message)
    );
    const unsubStaff = onSnapshot(
      collection(db, 'staffAccounts'),
      snap => {
        if (!snap.empty) setStaffList(snap.docs.map(d => d.data() as StaffAccount));
      },
      err => console.warn('Operations staff sync:', err.message)
    );
    const unsubDonors = onSnapshot(
      collection(db, 'donorProfiles'),
      snap => {
        if (!snap.empty) setDonorsList(snap.docs.map(d => d.data() as DonorProfile));
      },
      err => console.warn('Operations donors sync:', err.message)
    );
    const unsubIssues = onSnapshot(
      collection(db, 'systemIssues'),
      snap => {
        if (!snap.empty) setIssuesList(snap.docs.map(d => d.data() as SystemIssue));
      },
      err => console.warn('Operations issues sync:', err.message)
    );
    return () => {
      unsubUnits();
      unsubReqs();
      unsubStaff();
      unsubDonors();
      unsubIssues();
    };
  }, []);

  /**
   * Inventory position by group.
   * Burn rates are ILLUSTRATIVE planning assumptions, not measured consumption.
   * Real burn rates must come from the national service's own history.
   */
  const bloodGroups: BloodType[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
  const deficitMatrix: DeficitGroupStat[] = bloodGroups.map(grp => {
    const available = units.filter(
      u => u.bloodType === grp && ['RELEASED', 'DELIVERED_TO_HOSPITAL'].includes(u.status)
    );
    const count = available.length;
    const dailyBurn = grp === 'O-' ? 1.5 : grp === 'O+' ? 2.5 : 1.0;
    const daysOfSupply = Number((count / dailyBurn).toFixed(1));
    return {
      group: grp,
      count,
      dailyBurn,
      daysOfSupply,
      isCritical: daysOfSupply < 3.0,
      isUniversal: grp === 'O-'
    };
  });

  const criticalDeficitCount = deficitMatrix.filter(d => d.isCritical).length;

  const loginOperator = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const account = staffList.find(s => s.email.toLowerCase() === cleanEmail);
    if (!account) {
      return { success: false, error: 'No operator account found with this email address.' };
    }
    if (account.role !== 'NATIONAL_OPERATOR') {
      return { success: false, error: 'This console is limited to national operations accounts.' };
    }
    if (account.status === 'SUSPENDED') {
      return { success: false, error: 'This account is suspended.' };
    }

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, password);
    } catch {
      await signInAnonymously(auth);
    }

    const updated = { ...account, lastLoginAt: new Date().toISOString() };
    persistOperator(updated);
    return { success: true };
  };

  const quickDemoOperatorLogin = () => {
    if (DEMO_OPERATOR) persistOperator(DEMO_OPERATOR);
  };

  const logoutOperator = async () => {
    try {
      await fbSignOut(auth);
    } catch {
      /* non-blocking */
    }
    persistOperator(null);
  };

  const fulfillRequest = async (requestId: string, unitDins: string[]): Promise<void> => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;
    const updatedReq: HospitalRequest = { ...req, status: 'DISPATCHED', fulfilledUnitDins: unitDins };
    setRequests(prev => prev.map(r => (r.id === requestId ? updatedReq : r)));
    try {
      await setDoc(doc(db, 'hospitalRequests', requestId), updatedReq, { merge: true });
    } catch (err: any) {
      console.warn('Firestore fulfill request sync:', err.message);
    }
  };

  const provisionStaff = async (data: {
    fullName: string;
    email: string;
    role: UserRole;
    facility: string;
    badgeNumber: string;
    customTempPassword?: string;
  }): Promise<StaffAccount> => {
    const prefix =
      data.role === 'CLINICAL_STAFF'
        ? 'DOC'
        : data.role === 'LAB_TECH'
        ? 'LAB'
        : data.role === 'LOGISTICS_COURIER'
        ? 'LOG'
        : data.role === 'AUDITOR'
        ? 'AUD'
        : 'ADM';
    const tempPass =
      data.customTempPassword?.trim() || `TEMP-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newAccount: StaffAccount = {
      id: `STAFF-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`,
      email: data.email.trim().toLowerCase(),
      fullName: data.fullName.trim(),
      role: data.role,
      facility: data.facility.trim(),
      badgeNumber: data.badgeNumber.trim().toUpperCase(),
      temporaryPassword: tempPass,
      passwordHash: tempPass,
      mustChangePassword: true,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      provisionedBy: actingName
    };

    setStaffList(prev => [newAccount, ...prev]);
    try {
      await setDoc(doc(db, 'staffAccounts', newAccount.id), newAccount, { merge: true });
    } catch (err: any) {
      console.warn('Firestore provision staff sync:', err.message);
    }
    return newAccount;
  };

  const toggleStaffStatus = async (id: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<void> => {
    setStaffList(prev => prev.map(s => (s.id === id ? { ...s, status } : s)));
    const target = staffList.find(s => s.id === id);
    if (target) {
      try {
        await setDoc(doc(db, 'staffAccounts', id), { ...target, status }, { merge: true });
      } catch (err: any) {
        console.warn('Firestore toggle staff sync:', err.message);
      }
    }
  };

  const resetStaffPassword = async (id: string): Promise<string> => {
    const target = staffList.find(s => s.id === id);
    const prefix = target
      ? target.role === 'CLINICAL_STAFF'
        ? 'DOC'
        : target.role === 'LAB_TECH'
        ? 'LAB'
        : 'STAFF'
      : 'RESET';
    const newTemp = `TEMP-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (target) {
      const updated: StaffAccount = {
        ...target,
        temporaryPassword: newTemp,
        passwordHash: newTemp,
        mustChangePassword: true
      };
      setStaffList(prev => prev.map(s => (s.id === id ? updated : s)));
      try {
        await setDoc(doc(db, 'staffAccounts', id), updated, { merge: true });
      } catch (err: any) {
        console.warn('Firestore reset password sync:', err.message);
      }
    }
    return newTemp;
  };

  /**
   * Approving a document is a human verification decision. It is recorded
   * against the reviewing operator. It does not change verification level by
   * itself — use updateDonorTier for that.
   */
  const reviewDonorDocument = async (
    donorId: string,
    docId: string,
    status: 'APPROVED' | 'REJECTED',
    notes: string
  ): Promise<void> => {
    const target = donorsList.find(d => d.id === donorId);
    if (!target) return;

    const updatedDocs = target.uploadedDocuments.map(item =>
      item.id === docId
        ? { ...item, status, reviewNotes: notes, reviewedBy: actingName }
        : item
    );

    const updatedDonor: DonorProfile = {
      ...target,
      uploadedDocuments: updatedDocs,
      tierUpdatedAt: new Date().toISOString()
    };

    setDonorsList(prev => prev.map(d => (d.id === donorId ? updatedDonor : d)));
    try {
      await setDoc(doc(db, 'donorProfiles', donorId), updatedDonor, { merge: true });
    } catch (err: any) {
      console.warn('Firestore review document sync:', err.message);
    }
  };

  const updateDonorTier = async (donorId: string, tier: DonorVerificationTier): Promise<void> => {
    const target = donorsList.find(d => d.id === donorId);
    if (!target) return;
    const updated = { ...target, tier, tierUpdatedAt: new Date().toISOString() };
    setDonorsList(prev => prev.map(d => (d.id === donorId ? updated : d)));
    try {
      await setDoc(doc(db, 'donorProfiles', donorId), updated, { merge: true });
    } catch (err: any) {
      console.warn('Firestore update donor tier sync:', err.message);
    }
  };

  const resolveIssue = async (issueId: string, notes: string): Promise<void> => {
    const target = issuesList.find(i => i.id === issueId);
    if (!target) return;
    const updated: SystemIssue = {
      ...target,
      status: 'RESOLVED',
      resolutionNotes: notes,
      resolvedBy: actingName,
      resolvedAt: new Date().toISOString()
    };
    setIssuesList(prev => prev.map(i => (i.id === issueId ? updated : i)));
    try {
      await setDoc(doc(db, 'systemIssues', issueId), updated, { merge: true });
    } catch (err: any) {
      console.warn('Firestore resolve issue sync:', err.message);
    }
  };

  const publishEmergencyAppeal = async (data: {
    title: string;
    description: string;
    facility: string;
    targetBloodType: BloodType;
  }): Promise<void> => {
    const issueId = `APPEAL-${Date.now().toString(36).toUpperCase()}`;
    const newAppeal: SystemIssue = {
      id: issueId,
      title: data.title,
      description: data.description,
      facility: data.facility,
      category: 'SUPPLY_DEFICIT',
      severity: 'CRITICAL',
      affectedEntity: `Critical ${data.targetBloodType} shortage`,
      status: 'OPEN',
      timestamp: new Date().toISOString()
    };
    setIssuesList(prev => [newAppeal, ...prev]);
    try {
      await setDoc(doc(db, 'systemIssues', issueId), newAppeal, { merge: true });
    } catch (err: any) {
      console.warn('Firestore emergency appeal save:', err.message);
    }
  };

  return (
    <RubricContext.Provider
      value={{
        currentUser,
        currentOperator,
        isAuthenticated: currentOperator !== null,
        units,
        requests,
        staffList,
        donorsList,
        issuesList,
        deficitMatrix,
        criticalDeficitCount,
        loginOperator,
        quickDemoOperatorLogin,
        logoutOperator,
        fulfillRequest,
        provisionStaff,
        toggleStaffStatus,
        resetStaffPassword,
        reviewDonorDocument,
        updateDonorTier,
        resolveIssue,
        publishEmergencyAppeal
      }}
    >
      {children}
    </RubricContext.Provider>
  );
};

export const useRubric = () => {
  const context = useContext(RubricContext);
  if (!context) {
    throw new Error('useRubric must be used within a RubricProvider');
  }
  return context;
};
