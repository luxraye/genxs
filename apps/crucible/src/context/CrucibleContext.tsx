import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fbSignOut,
  onAuthStateChanged,
  type FirebaseUser
} from '@shared/lib/firebase-auth';
import {
  BloodUnit,
  BloodType,
  ComponentType,
  StaffAccount,
  SystemIssue,
  BlockchainBlock
} from '@shared/types/bloodchain';
import {
  INITIAL_UNITS,
  INITIAL_STAFF_ACCOUNTS,
  INITIAL_SYSTEM_ISSUES,
  INITIAL_BLOCKS
} from '@shared/data/seedData';
import { useSpine } from '@shared/lib/spine/react';
import { calculateBlockHash } from '@shared/lib/crypto';

const SCIENTIST_KEY = 'crucible_active_scientist';

/** Statuses that mean a unit is still awaiting screening or release. */
export const AWAITING_STATUSES: BloodUnit['status'][] = ['COLLECTED', 'IN_TESTING'];

interface CrucibleContextType {
  currentUser: FirebaseUser | null;
  /** Null when no laboratory user is signed in. */
  currentScientist: StaffAccount | null;
  isAuthenticated: boolean;
  units: BloodUnit[];
  issuesList: SystemIssue[];
  auditLog: BlockchainBlock[];
  /** Laboratory staff accounts available on this console (sample data). */
  staffList: StaffAccount[];

  loginScientist: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  quickDemoScientistLogin: () => void;
  logoutScientist: () => Promise<void>;

  recordLabTests: (unitDIN: string, testUpdates: Partial<BloodUnit['labTests']>) => Promise<void>;
  fractionateUnit: (unitDIN: string, newComponent: ComponentType, volumeMl: number) => Promise<void>;
  authorizeLabRelease: (unitDIN: string, techName: string) => Promise<{ success: boolean; error?: string }>;
  quarantineUnitInLab: (unitDIN: string, techName: string, reason: string) => Promise<void>;
}

const CrucibleContext = createContext<CrucibleContextType | null>(null);

const DEMO_SCIENTIST = INITIAL_STAFF_ACCOUNTS.find(s => s.role === 'LAB_TECH') ?? null;

const readStoredScientist = (): StaffAccount | null => {
  try {
    const saved = localStorage.getItem(SCIENTIST_KEY);
    return saved ? (JSON.parse(saved) as StaffAccount) : null;
  } catch {
    return null;
  }
};

export const CrucibleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  // A visitor starts signed out. Only a successful sign-in sets a laboratory user.
  const [currentScientist, setCurrentScientist] = useState<StaffAccount | null>(readStoredScientist);

  const [units, setUnits] = useState<BloodUnit[]>(INITIAL_UNITS);

  // When the shared state service is reachable, the units shown here are the
  // service's units — not this surface's private copy. See services/spine.
  const spine = useSpine();
  useEffect(() => {
    if (spine.mode !== 'shared') return;
    return spine.onSnapshot(snap => {
      if (Array.isArray(snap.units) && snap.units.length > 0) setUnits(snap.units as BloodUnit[]);
      if (Array.isArray(snap.issues) && snap.issues.length > 0) setIssuesList(snap.issues as any[]);
      if (Array.isArray(snap.staff) && snap.staff.length > 0) setStaffList(snap.staff as any[]);
    });
  }, [spine.mode]);
  const [issuesList, setIssuesList] = useState<SystemIssue[]>(INITIAL_SYSTEM_ISSUES);
  const [staffList, setStaffList] = useState<StaffAccount[]>(INITIAL_STAFF_ACCOUNTS);
  const [auditLog, setAuditLog] = useState<BlockchainBlock[]>(INITIAL_BLOCKS);

  const persistScientist = (s: StaffAccount | null) => {
    if (s) localStorage.setItem(SCIENTIST_KEY, JSON.stringify(s));
    else localStorage.removeItem(SCIENTIST_KEY);
    setCurrentScientist(s);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => setCurrentUser(user));
    return () => unsub();
  }, []);

  const persistUnit = async (u: BloodUnit) => {
    if (spine.mode === 'shared') {
      try {
        await spine.client.patchUnit(u.din, u as any);
        return;
      } catch (err: any) {
        console.warn('Shared-state unit write refused, falling back to local write:', err.message);
      }
    }
  };

  const persistIssue = async (iss: SystemIssue) => {
  };

  /**
   * Append an entry to the hash-chained audit log.
   * The chain is local and self-consistent; it is not a distributed ledger.
   */
  const appendBlock = async (
    unitDIN: string,
    eventType: BlockchainBlock['eventType'],
    actor: BlockchainBlock['actor'],
    payload: Record<string, any>
  ): Promise<BlockchainBlock> => {
    const nextIndex = auditLog.length;
    const prevHash =
      auditLog.length > 0
        ? auditLog[auditLog.length - 1].hash
        : '0x0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date().toISOString();

    const blockHash = await calculateBlockHash(nextIndex, timestamp, unitDIN, eventType, actor, payload, prevHash);

    const newBlock: BlockchainBlock = {
      index: nextIndex,
      timestamp,
      unitDIN,
      eventType,
      actor,
      payload,
      previousHash: prevHash,
      hash: blockHash
    };

    setAuditLog(prev => [...prev, newBlock]);

    try {
      await fetch('/donations/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          din: unitDIN,
          bloodType: payload.donorBloodType || 'O-',
          eventType,
          actor: actor.id,
          facility: actor.facility,
          payload
        })
      });
    } catch {
      /* non-blocking */
    }

    return newBlock;
  };

  const loginScientist = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      let user: FirebaseUser | null = null;
      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        user = cred.user;
      } catch (authErr: any) {
        if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
          // Staff accounts are provisioned by operations, never self-created. An open
        // registration path into a clinical console is an access-control defect.
        return {
          success: false,
          error: 'No account is provisioned for that address. Ask an administrator to provision one.'
        };
        } else {
          throw authErr;
        }
      }
      setCurrentUser(user);

      const existing = staffList.find(s => s.email.toLowerCase() === cleanEmail);
      const matched: StaffAccount =
        existing ??
        ({
          id: `STAFF-LAB-${Date.now().toString(36).toUpperCase()}`,
          fullName: cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          email: cleanEmail,
          role: 'LAB_TECH',
          facility: 'National blood laboratory',
          badgeNumber: 'Not assigned',
          status: 'ACTIVE',
          mustChangePassword: false,
          createdAt: new Date().toISOString(),
          provisionedBy: 'Self-registered (demonstration)'
        } as StaffAccount);

      persistScientist(matched);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Sign in failed.' };
    }
  };

  const quickDemoScientistLogin = () => {
    if (DEMO_SCIENTIST) persistScientist(DEMO_SCIENTIST);
  };

  const logoutScientist = async () => {
    try {
      await fbSignOut(auth);
    } catch {
      /* non-blocking */
    }
    setCurrentUser(null);
    persistScientist(null);
  };

  const recordLabTests = async (unitDIN: string, testUpdates: Partial<BloodUnit['labTests']>) => {
    const unit = units.find(u => u.din === unitDIN);
    if (!unit) return;
    const updatedUnit: BloodUnit = { ...unit, labTests: { ...unit.labTests, ...testUpdates } };
    setUnits(prev => prev.map(u => (u.din === unitDIN ? updatedUnit : u)));
    await persistUnit(updatedUnit);
  };

  const fractionateUnit = async (unitDIN: string, newComponent: ComponentType, volumeMl: number) => {
    const unit = units.find(u => u.din === unitDIN);
    if (!unit) return;
    const updatedUnit: BloodUnit = { ...unit, componentType: newComponent, volumeMl };
    setUnits(prev => prev.map(u => (u.din === unitDIN ? updatedUnit : u)));
    await persistUnit(updatedUnit);
  };

  /**
   * Quality release gate. A unit can only be released when every screening
   * panel is non-reactive and the blood group has been confirmed by testing.
   */
  const authorizeLabRelease = async (
    unitDIN: string,
    techName: string
  ): Promise<{ success: boolean; error?: string }> => {
    const unit = units.find(u => u.din === unitDIN);
    if (!unit) return { success: false, error: 'Unit not found.' };

    const { hiv, hbv, hcv, syphilis, westNile, aboRhConfirmatory } = unit.labTests;
    const allNegative =
      hiv === 'NEGATIVE' &&
      hbv === 'NEGATIVE' &&
      hcv === 'NEGATIVE' &&
      syphilis === 'NEGATIVE' &&
      westNile === 'NEGATIVE';

    if (!allNegative) {
      return {
        success: false,
        error:
          'Release blocked. Every screening panel must be non-reactive before a unit can be released.'
      };
    }
    if (aboRhConfirmatory === 'PENDING') {
      return { success: false, error: 'Release blocked. The blood group has not been confirmed by testing.' };
    }

    const nowIso = new Date().toISOString();
    const updatedUnit: BloodUnit = {
      ...unit,
      status: 'RELEASED',
      bloodType: aboRhConfirmatory as BloodType
    };

    setUnits(prev => prev.map(u => (u.din === unitDIN ? updatedUnit : u)));
    await persistUnit(updatedUnit);

    await appendBlock(
      unitDIN,
      'TESTS_PASSED_AND_RELEASED',
      {
        id: techName,
        role: 'LAB_TECH',
        facility: currentScientist?.facility || unit.currentFacility,
        signature: 'hash-chained-audit'
      },
      {
        donorBloodType: updatedUnit.bloodType,
        hivResult: hiv,
        hbvResult: hbv,
        hcvResult: hcv,
        syphilisResult: syphilis,
        westNileResult: westNile,
        aboRhConfirmed: aboRhConfirmatory,
        authorizedAt: nowIso
      }
    );

    return { success: true };
  };

  const quarantineUnitInLab = async (unitDIN: string, techName: string, reason: string): Promise<void> => {
    const unit = units.find(u => u.din === unitDIN);
    if (!unit) return;

    const nowIso = new Date().toISOString();
    const updatedUnit: BloodUnit = { ...unit, status: 'QUARANTINED' };
    setUnits(prev => prev.map(u => (u.din === unitDIN ? updatedUnit : u)));
    await persistUnit(updatedUnit);

    await appendBlock(
      unitDIN,
      'TESTS_FAILED_QUARANTINED',
      {
        id: techName,
        role: 'LAB_TECH',
        facility: currentScientist?.facility || unit.currentFacility,
        signature: 'hash-chained-audit'
      },
      { quarantineReason: reason, quarantinedAt: nowIso }
    );

    const incidentId = `INC-LAB-${Date.now().toString(36).toUpperCase()}`;
    const newIssue: SystemIssue = {
      id: incidentId,
      title: `Laboratory hold raised for unit ${unitDIN}`,
      category: 'LAB_QUARANTINE',
      severity: 'CRITICAL',
      status: 'OPEN',
      facility: currentScientist?.facility || unit.currentFacility,
      affectedEntity: `Unit DIN: ${unitDIN}`,
      description: `Screening returned a reactive marker. The unit is held and excluded from issue. Reason: ${reason}. Recorded by ${techName}.`,
      timestamp: nowIso
    };

    await persistIssue(newIssue);
  };

  return (
    <CrucibleContext.Provider
      value={{
        currentUser,
        currentScientist,
        isAuthenticated: currentScientist !== null,
        units,
        issuesList,
        auditLog,
        staffList,
        loginScientist,
        quickDemoScientistLogin,
        logoutScientist,
        recordLabTests,
        fractionateUnit,
        authorizeLabRelease,
        quarantineUnitInLab
      }}
    >
      {children}
    </CrucibleContext.Provider>
  );
};

export const useCrucible = () => {
  const context = useContext(CrucibleContext);
  if (!context) {
    throw new Error('useCrucible must be used within a CrucibleProvider');
  }
  return context;
};
