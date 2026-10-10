import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fbSignOut,
  onAuthStateChanged,
  doc,
  setDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  type FirebaseUser
} from '@shared/lib/firebase';
import {
  BloodUnit,
  BloodType,
  ComponentType,
  HospitalRequest,
  StaffAccount,
  SystemIssue,
  BlockchainBlock
} from '@shared/types/bloodchain';
import {
  INITIAL_UNITS,
  INITIAL_STAFF_ACCOUNTS,
  INITIAL_HOSPITAL_REQUESTS,
  INITIAL_SYSTEM_ISSUES,
  INITIAL_BLOCKS
} from '@shared/data/seedData';
import { useSpine } from '@shared/lib/spine/react';
import { isRbcCompatible } from '@shared/lib/bloodCompatibility';
import { sha256, calculateBlockHash } from '@shared/lib/crypto';

const CLINICIAN_KEY = 'aegis_active_clinician';

/** Units a ward can act on: delivered, released, or already crossmatched. */
export const WARD_UNIT_STATUSES: BloodUnit['status'][] = [
  'DELIVERED_TO_HOSPITAL',
  'RELEASED',
  'BEDSIDE_CROSSMATCHED'
];

/** Units that are infusing or completed — shown on the monitor. */
export const MONITOR_UNIT_STATUSES: BloodUnit['status'][] = ['BEDSIDE_CROSSMATCHED', 'TRANSFUSED'];

export type ClinicianRole = 'DOCTOR' | 'NURSE';

/** Generic demonstration identities — no real or invented staff names. */
const DEMO_IDENTITIES: Record<ClinicianRole, { fullName: string; license: string }> = {
  DOCTOR: { fullName: 'Demonstration clinician (attending physician)', license: 'DEMO-MD' },
  NURSE: { fullName: 'Demonstration clinician (registered nurse)', license: 'DEMO-RN' }
};

interface AegisContextType {
  currentUser: FirebaseUser | null;
  /** Null when no hospital clinician is signed in. */
  currentClinician: StaffAccount | null;
  isAuthenticated: boolean;
  units: BloodUnit[];
  requests: HospitalRequest[];
  issuesList: SystemIssue[];
  blockchain: BlockchainBlock[];
  /** Clinical staff accounts available on this console (sample data). */
  staffList: StaffAccount[];

  loginClinician: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  quickDemoClinicianLogin: (role?: ClinicianRole) => void;
  logoutClinician: () => Promise<void>;

  verifyBedsideCrossmatch: (
    unitDIN: string,
    patientId: string,
    patientBloodType: BloodType,
    clinician1: string,
    clinician2: string
  ) => Promise<{ success: boolean; error?: string }>;

  completeTransfusion: (
    unitDIN: string,
    clinicianName: string,
    vitalsSummary: string
  ) => Promise<void>;

  reportAdverseReaction: (
    unitDIN: string,
    type: 'TRALI' | 'TACO' | 'FEBRILE' | 'ACUTE_HEMOLYTIC',
    severity: 'MILD' | 'SEVERE' | 'LIFE_THREATENING',
    notes: string,
    clinicianName: string
  ) => Promise<void>;

  createHospitalRequest: (
    hospitalName: string,
    department: string,
    urgency: 'EMERGENCY_CODE_CRIMSON' | 'URGENT' | 'ROUTINE',
    bloodType: BloodType,
    componentType: ComponentType,
    unitsNeeded: number
  ) => Promise<HospitalRequest>;
}

const AegisContext = createContext<AegisContextType | null>(null);

const readStoredClinician = (): StaffAccount | null => {
  try {
    const saved = localStorage.getItem(CLINICIAN_KEY);
    return saved ? (JSON.parse(saved) as StaffAccount) : null;
  } catch {
    return null;
  }
};

export const AegisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  // A visitor starts signed out. Only a successful sign-in sets a clinician.
  const [currentClinician, setCurrentClinician] = useState<StaffAccount | null>(readStoredClinician);

  const [units, setUnits] = useState<BloodUnit[]>(INITIAL_UNITS);

  // When the shared state service is reachable, the units shown here are the
  // service's units — not this surface's private copy. See services/spine.
  const spine = useSpine();
  useEffect(() => {
    if (spine.mode !== 'shared') return;
    return spine.onSnapshot(snap => {
      if (Array.isArray(snap.units) && snap.units.length > 0) setUnits(snap.units as BloodUnit[]);
      if (Array.isArray(snap.requests) && snap.requests.length > 0) setRequests(snap.requests as any[]);
      if (Array.isArray(snap.issues) && snap.issues.length > 0) setIssuesList(snap.issues as any[]);
      if (Array.isArray(snap.staff) && snap.staff.length > 0) setStaffList(snap.staff as any[]);
    });
  }, [spine.mode]);
  const [requests, setRequests] = useState<HospitalRequest[]>(INITIAL_HOSPITAL_REQUESTS);
  const [issuesList, setIssuesList] = useState<SystemIssue[]>(INITIAL_SYSTEM_ISSUES);
  const [staffList, setStaffList] = useState<StaffAccount[]>(INITIAL_STAFF_ACCOUNTS);
  const [blockchain, setBlockchain] = useState<BlockchainBlock[]>(INITIAL_BLOCKS);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => setCurrentUser(user));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubUnits = onSnapshot(
      collection(db, 'bloodUnits'),
      snap => {
        if (!snap.empty) setUnits(snap.docs.map(d => d.data() as BloodUnit));
      },
      err => console.warn('Ward units sync:', err.message)
    );
    const unsubReqs = onSnapshot(
      collection(db, 'hospitalRequests'),
      snap => {
        if (!snap.empty) setRequests(snap.docs.map(d => d.data() as HospitalRequest));
      },
      err => console.warn('Ward requests sync:', err.message)
    );
    const unsubIssues = onSnapshot(
      collection(db, 'systemIssues'),
      snap => {
        if (!snap.empty) setIssuesList(snap.docs.map(d => d.data() as SystemIssue));
      },
      err => console.warn('Ward issues sync:', err.message)
    );
    const qBlocks = query(collection(db, 'blockchainBlocks'), orderBy('index', 'asc'));
    const unsubBlocks = onSnapshot(
      qBlocks,
      snap => {
        if (!snap.empty) setBlockchain(snap.docs.map(d => d.data() as BlockchainBlock));
      },
      err => console.warn('Ward audit log sync:', err.message)
    );
    return () => {
      unsubUnits();
      unsubReqs();
      unsubIssues();
      unsubBlocks();
    };
  }, []);

  const persistClinician = (c: StaffAccount | null) => {
    if (c) localStorage.setItem(CLINICIAN_KEY, JSON.stringify(c));
    else localStorage.removeItem(CLINICIAN_KEY);
    setCurrentClinician(c);
  };

  const persistUnit = async (u: BloodUnit) => {
    if (spine.mode === 'shared') {
      try {
        await spine.client.patchUnit(u.din, u as any);
        return;
      } catch (err: any) {
        console.warn('Shared-state unit write refused, falling back to local write:', err.message);
      }
    }
    try {
      await setDoc(doc(db, 'bloodUnits', u.din), u, { merge: true });
    } catch (err: any) {
      console.warn('Persist unit:', err.message);
    }
  };

  const persistRequest = async (r: HospitalRequest) => {
    try {
      await setDoc(doc(db, 'hospitalRequests', r.id), r, { merge: true });
    } catch (err: any) {
      console.warn('Persist request:', err.message);
    }
  };

  const persistIssue = async (iss: SystemIssue) => {
    try {
      await setDoc(doc(db, 'systemIssues', iss.id), iss, { merge: true });
    } catch (err: any) {
      console.warn('Persist issue:', err.message);
    }
  };

  /**
   * Append an entry to the local, hash-chained audit log.
   * The chain is self-consistent for demonstration purposes; it is not a
   * distributed ledger and there is no external network involved.
   */
  const appendBlock = async (
    unitDIN: string,
    eventType: BlockchainBlock['eventType'],
    actor: BlockchainBlock['actor'],
    payload: Record<string, any>
  ): Promise<BlockchainBlock> => {
    const nextIndex = blockchain.length;
    const prevHash =
      blockchain.length > 0
        ? blockchain[blockchain.length - 1].hash
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

    setBlockchain(prev => [...prev, newBlock]);
    try {
      await setDoc(doc(db, 'blockchainBlocks', `block-${newBlock.index}`), newBlock);
    } catch (err: any) {
      console.warn('Audit log write:', err.message);
    }

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

  const loginClinician = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
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
          id: `STF-${Date.now().toString(36).toUpperCase()}`,
          fullName: cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          email: cleanEmail,
          role: 'CLINICAL_STAFF',
          facility: 'Example Referral Hospital',
          badgeNumber: 'Not assigned',
          status: 'ACTIVE',
          mustChangePassword: false,
          createdAt: new Date().toISOString(),
          provisionedBy: 'Self-registered (demonstration)'
        } as StaffAccount);

      persistClinician(matched);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Sign in failed.' };
    }
  };

  const quickDemoClinicianLogin = (role: ClinicianRole = 'DOCTOR') => {
    const id = DEMO_IDENTITIES[role];
    const demoAccount: StaffAccount = {
      id: `DEMO-${role}`,
      fullName: id.fullName,
      passwordHash: 'DEMO-ACCOUNT',
      email: role === 'DOCTOR' ? 'physician@example-hospital.example' : 'nurse@example-hospital.example',
      role: 'CLINICAL_STAFF',
      facility: 'Example Referral Hospital',
      badgeNumber: id.license,
      status: 'ACTIVE',
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
      provisionedBy: 'Demonstration account'
    };
    persistClinician(demoAccount);
  };

  const logoutClinician = async () => {
    try {
      await fbSignOut(auth);
    } catch {
      /* non-blocking */
    }
    setCurrentUser(null);
    persistClinician(null);
  };

  /**
   * Bedside crossmatch. Runs the ABO/Rh compatibility rule for red cells and,
   * on failure, records an incident and blocks the infusion. On success it
   * records the two witnessing clinicians against the unit.
   */
  const verifyBedsideCrossmatch = async (
    unitDIN: string,
    patientId: string,
    patientBloodType: BloodType,
    clinician1: string,
    clinician2: string
  ): Promise<{ success: boolean; error?: string }> => {
    const unit = units.find(u => u.din === unitDIN);
    if (!unit) return { success: false, error: `Blood unit ${unitDIN} was not found in the registry.` };

    if (!WARD_UNIT_STATUSES.includes(unit.status)) {
      return {
        success: false,
        error: `This unit's status is "${unit.status}". Only a unit released to the ward can be crossmatched at the bedside.`
      };
    }

    if (!clinician1.trim() || !clinician2.trim()) {
      return { success: false, error: 'Two clinician witnesses must be recorded before verification.' };
    }
    if (clinician1.trim().toLowerCase() === clinician2.trim().toLowerCase()) {
      return { success: false, error: 'The two witnesses must be different people.' };
    }

    const isCompatible = isRbcCompatible(unit.bloodType, patientBloodType);
    if (!isCompatible) {
      const incidentId = `INC-${Date.now().toString(36).toUpperCase()}`;
      const mismatchIssue: SystemIssue = {
        id: incidentId,
        title: `Bedside mismatch blocked: donor ${unit.bloodType} to patient ${patientBloodType}`,
        category: 'BEDSIDE_MISMATCH',
        severity: 'CRITICAL',
        status: 'OPEN',
        facility: currentClinician?.facility || 'Example Referral Hospital',
        affectedEntity: `Unit DIN: ${unitDIN} | Patient ref: ${patientId}`,
        description: `Bedside verification blocked an incompatible red-cell transfusion. Donor ${unit.bloodType} was scanned against recipient ${patientBloodType}. Witnessed by ${clinician1} and ${clinician2}.`,
        timestamp: new Date().toISOString()
      };
      await persistIssue(mismatchIssue);

      return {
        success: false,
        error: `Incompatible: donor red cells ${unit.bloodType} are not compatible with patient ${patientBloodType}. Transfusion blocked and an incident was logged.`
      };
    }

    const patientHash = await sha256(`PATIENT-${patientId}`);
    const dualSig = await sha256(`CROSSMATCH-${clinician1}-${clinician2}-${unitDIN}-${patientId}`);

    const updatedUnit: BloodUnit = {
      ...unit,
      status: 'BEDSIDE_CROSSMATCHED',
      patientHash: `PT-${patientHash.slice(0, 10).toUpperCase()}`,
      patientAssignedBloodType: patientBloodType
    };

    setUnits(prev => prev.map(u => (u.din === unitDIN ? updatedUnit : u)));
    await persistUnit(updatedUnit);

    await appendBlock(
      unitDIN,
      'BEDSIDE_DUAL_VERIFIED',
      {
        id: `${clinician1} & ${clinician2}`,
        role: 'CLINICAL_STAFF',
        facility: currentClinician?.facility || unit.currentFacility,
        signature: `0x${dualSig.slice(0, 48)}`
      },
      {
        recipientHash: `PT-${patientHash.slice(0, 10).toUpperCase()}`,
        recipientBloodType: patientBloodType,
        donorBloodType: unit.bloodType,
        crossmatchVerificationResult: 'COMPATIBLE_VERIFIED',
        witness1: clinician1,
        witness2: clinician2
      }
    );

    return { success: true };
  };

  const completeTransfusion = async (
    unitDIN: string,
    clinicianName: string,
    vitalsSummary: string
  ): Promise<void> => {
    const nowIso = new Date().toISOString();
    const unit = units.find(u => u.din === unitDIN);
    if (!unit) return;

    const updatedUnit: BloodUnit = { ...unit, status: 'TRANSFUSED', transfusedAt: nowIso };
    setUnits(prev => prev.map(u => (u.din === unitDIN ? updatedUnit : u)));
    await persistUnit(updatedUnit);

    const sig = await sha256(`TRANSFUSED-${unitDIN}-${clinicianName}-${nowIso}`);
    await appendBlock(
      unitDIN,
      'TRANSFUSION_COMPLETED',
      {
        id: clinicianName,
        role: 'CLINICAL_STAFF',
        facility: currentClinician?.facility || 'Hospital clinical ward',
        signature: `0x${sig.slice(0, 48)}`
      },
      {
        postTransfusionVitals: vitalsSummary,
        transfusionEndedAt: nowIso,
        finalCustodyStatus: 'TRANSFUSION_COMPLETED'
      }
    );

    try {
      await fetch('/api/clinical/transfusions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitBarcode: unitDIN,
          patientIdentifier: unit.patientHash || 'PT-ANON',
          donorBloodType: unit.bloodType,
          completedAt: nowIso,
          hasReaction: false,
          clinicianId: clinicianName
        })
      });
    } catch {
      /* non-blocking */
    }
  };

  const reportAdverseReaction = async (
    unitDIN: string,
    type: 'TRALI' | 'TACO' | 'FEBRILE' | 'ACUTE_HEMOLYTIC',
    severity: 'MILD' | 'SEVERE' | 'LIFE_THREATENING',
    notes: string,
    clinicianName: string
  ): Promise<void> => {
    const nowIso = new Date().toISOString();
    const unit = units.find(u => u.din === unitDIN);
    if (!unit) return;

    const updatedUnit: BloodUnit = {
      ...unit,
      reactionReported: { type, severity, timestamp: nowIso, reportedBy: clinicianName, notes }
    };
    setUnits(prev => prev.map(u => (u.din === unitDIN ? updatedUnit : u)));
    await persistUnit(updatedUnit);

    const sig = await sha256(`HEMOVIGILANCE-${unitDIN}-${type}-${nowIso}`);
    await appendBlock(
      unitDIN,
      'ADVERSE_REACTION_FLAGGED',
      {
        id: clinicianName,
        role: 'CLINICAL_STAFF',
        facility: currentClinician?.facility || 'Hospital clinical ward',
        signature: `0x${sig.slice(0, 48)}`
      },
      {
        adverseReactionType: type,
        severityLevel: severity,
        clinicalNotes: notes,
        linkedComponentsFlagged: true
      }
    );

    const incidentId = `INC-HEMO-${Date.now().toString(36).toUpperCase()}`;
    const newIssue: SystemIssue = {
      id: incidentId,
      title: `Adverse reaction reported: ${type.replace(/_/g, ' ')}`,
      category: 'BEDSIDE_MISMATCH',
      severity: severity === 'LIFE_THREATENING' ? 'CRITICAL' : 'HIGH',
      status: 'OPEN',
      facility: currentClinician?.facility || 'Example Referral Hospital',
      affectedEntity: `Unit DIN: ${unitDIN}`,
      description: `Reported by ${clinicianName}. Severity: ${severity}. Notes: ${notes}. Linked donor components flagged for review.`,
      timestamp: nowIso
    };
    await persistIssue(newIssue);

    try {
      await fetch('/api/clinical/transfusions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitBarcode: unitDIN,
          patientIdentifier: unit.patientHash || 'PT-ANON',
          donorBloodType: unit.bloodType,
          completedAt: nowIso,
          hasReaction: true,
          reactionDetails: { type, severity, notes },
          clinicianId: clinicianName
        })
      });
    } catch {
      /* non-blocking */
    }
  };

  const createHospitalRequest = async (
    hospitalName: string,
    department: string,
    urgency: 'EMERGENCY_CODE_CRIMSON' | 'URGENT' | 'ROUTINE',
    bloodType: BloodType,
    componentType: ComponentType,
    unitsNeeded: number
  ): Promise<HospitalRequest> => {
    const newReq: HospitalRequest = {
      id: `REQ-${Date.now().toString(36).toUpperCase()}`,
      hospitalName,
      department,
      urgency,
      bloodType,
      componentType,
      unitsNeeded,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      fulfilledUnitDins: []
    };

    setRequests(prev => [newReq, ...prev]);
    if (spine.mode === 'shared') spine.client.createRequest(newReq as any).catch(() => {});
    await persistRequest(newReq);

    try {
      await fetch('/api/clinical/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: newReq.id,
          hospital: hospitalName,
          department,
          urgency,
          bloodType,
          componentType,
          quantity: unitsNeeded
        })
      });
    } catch {
      /* non-blocking */
    }

    return newReq;
  };

  return (
    <AegisContext.Provider
      value={{
        currentUser,
        currentClinician,
        isAuthenticated: currentClinician !== null,
        units,
        requests,
        issuesList,
        blockchain,
        staffList,
        loginClinician,
        quickDemoClinicianLogin,
        logoutClinician,
        verifyBedsideCrossmatch,
        completeTransfusion,
        reportAdverseReaction,
        createHospitalRequest
      }}
    >
      {children}
    </AegisContext.Provider>
  );
};

export const useAegis = () => {
  const context = useContext(AegisContext);
  if (!context) {
    throw new Error('useAegis must be used within an AegisProvider');
  }
  return context;
};
