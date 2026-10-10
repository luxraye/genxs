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
import { BloodUnit, StaffAccount, SystemIssue, BlockchainBlock } from '@shared/types/bloodchain';
import { INITIAL_UNITS, INITIAL_STAFF_ACCOUNTS, INITIAL_SYSTEM_ISSUES, INITIAL_BLOCKS } from '@shared/data/seedData';
import { useSpine } from '@shared/lib/spine/react';
import { calculateBlockHash } from '@shared/lib/crypto';

const COURIER_KEY = 'torrent_active_courier';

/** Units a logistics courier can act on. */
export const DISPATCHABLE_STATUSES: BloodUnit['status'][] = ['RELEASED'];
export const TRANSIT_STATUSES: BloodUnit['status'][] = ['IN_TRANSIT'];

interface OfflineTelemetryPing {
  din: string;
  temp: number;
  location: string;
  timestamp: string;
}

interface TorrentContextType {
  currentUser: FirebaseUser | null;
  /** Null when no courier is signed in. */
  currentCourier: StaffAccount | null;
  isAuthenticated: boolean;
  units: BloodUnit[];
  issuesList: SystemIssue[];
  blockchain: BlockchainBlock[];
  /** Logistics staff accounts available on this console (sample data). */
  staffList: StaffAccount[];

  isOffline: boolean;
  offlineQueue: OfflineTelemetryPing[];
  setIsOffline: (offline: boolean) => void;
  syncOfflineQueue: () => Promise<void>;

  loginCourier: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  quickDemoCourierLogin: () => void;
  logoutCourier: () => Promise<void>;

  dispatchUnitToTransit: (
    unitDIN: string,
    courierName: string,
    destinationHospital: string,
    initialTemp: number
  ) => Promise<void>;

  logTelemetryReading: (
    unitDIN: string,
    temperatureCelsius: number,
    locationName: string
  ) => Promise<{ breachDetected: boolean }>;

  confirmHospitalReceipt: (
    unitDIN: string,
    receivingFacility: string,
    receivingStaff: string
  ) => Promise<void>;
}

const TorrentContext = createContext<TorrentContextType | null>(null);

const readStoredCourier = (): StaffAccount | null => {
  try {
    const saved = localStorage.getItem(COURIER_KEY);
    return saved ? (JSON.parse(saved) as StaffAccount) : null;
  } catch {
    return null;
  }
};

export const TorrentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  // A visitor starts signed out. Only a successful sign-in sets a courier.
  const [currentCourier, setCurrentCourier] = useState<StaffAccount | null>(readStoredCourier);

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
  const [blockchain, setBlockchain] = useState<BlockchainBlock[]>(INITIAL_BLOCKS);

  const [isOffline, setIsOffline] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineTelemetryPing[]>([]);

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
      err => console.warn('Cold-chain units sync:', err.message)
    );
    const unsubIssues = onSnapshot(
      collection(db, 'systemIssues'),
      snap => {
        if (!snap.empty) setIssuesList(snap.docs.map(d => d.data() as SystemIssue));
      },
      err => console.warn('Cold-chain issues sync:', err.message)
    );
    const qBlocks = query(collection(db, 'blockchainBlocks'), orderBy('index', 'asc'));
    const unsubBlocks = onSnapshot(
      qBlocks,
      snap => {
        if (!snap.empty) setBlockchain(snap.docs.map(d => d.data() as BlockchainBlock));
      },
      err => console.warn('Cold-chain audit log sync:', err.message)
    );
    return () => {
      unsubUnits();
      unsubIssues();
      unsubBlocks();
    };
  }, []);

  const persistCourier = (c: StaffAccount | null) => {
    if (c) localStorage.setItem(COURIER_KEY, JSON.stringify(c));
    else localStorage.removeItem(COURIER_KEY);
    setCurrentCourier(c);
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

  const persistIssue = async (iss: SystemIssue) => {
    try {
      await setDoc(doc(db, 'systemIssues', iss.id), iss, { merge: true });
    } catch (err: any) {
      console.warn('Persist issue:', err.message);
    }
  };

  /**
   * Append to the local, hash-chained audit log. The chain is self-consistent
   * for demonstration purposes; it is not a distributed ledger.
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

  const loginCourier = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
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
          id: `STF-COURIER-${Date.now().toString(36).toUpperCase()}`,
          fullName: cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          email: cleanEmail,
          role: 'LOGISTICS_COURIER',
          facility: 'National blood logistics hub',
          badgeNumber: 'Not assigned',
          status: 'ACTIVE',
          mustChangePassword: false,
          createdAt: new Date().toISOString(),
          provisionedBy: 'Self-registered (demonstration)'
        } as StaffAccount);

      persistCourier(matched);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Sign in failed.' };
    }
  };

  const quickDemoCourierLogin = () => {
    const demoAccount: StaffAccount = {
      id: 'DEMO-COURIER',
      fullName: 'Demonstration courier (cold-chain logistics)',
      passwordHash: 'DEMO-ACCOUNT',
      email: 'courier@example-logistics.example',
      role: 'LOGISTICS_COURIER',
      facility: 'National blood logistics hub',
      badgeNumber: 'DEMO-LOG',
      status: 'ACTIVE',
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
      provisionedBy: 'Demonstration account'
    };
    persistCourier(demoAccount);
  };

  const logoutCourier = async () => {
    try {
      await fbSignOut(auth);
    } catch {
      /* non-blocking */
    }
    setCurrentUser(null);
    persistCourier(null);
  };

  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) {
      setIsOffline(false);
      return;
    }
    for (const item of offlineQueue) {
      await logTelemetryReading(item.din, item.temp, item.location);
    }
    setOfflineQueue([]);
    setIsOffline(false);
  };

  const dispatchUnitToTransit = async (
    unitDIN: string,
    courierName: string,
    destinationHospital: string,
    initialTemp: number
  ): Promise<void> => {
    const unit = units.find(u => u.din === unitDIN);
    if (!unit) return;

    const nowIso = new Date().toISOString();
    const updatedUnit: BloodUnit = {
      ...unit,
      status: 'IN_TRANSIT',
      destinationHospital,
      telemetryLogs: [
        ...unit.telemetryLogs,
        {
          timestamp: nowIso,
          temperatureCelsius: initialTemp,
          locationName: `${unit.currentFacility} loading bay (departure)`,
          breachDetected: false
        }
      ]
    };

    setUnits(prev => prev.map(u => (u.din === unitDIN ? updatedUnit : u)));
    await persistUnit(updatedUnit);

    const sig = `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`;
    await appendBlock(
      unitDIN,
      'TRANSIT_DISPATCHED',
      {
        id: courierName,
        role: 'LOGISTICS_COURIER',
        facility: unit.currentFacility,
        signature: sig
      },
      {
        courier: courierName,
        destinationHospital,
        initialTempCelsius: initialTemp,
        dispatchedAt: nowIso
      }
    );
  };

  const logTelemetryReading = async (
    unitDIN: string,
    temperatureCelsius: number,
    locationName: string
  ): Promise<{ breachDetected: boolean }> => {
    const unit = units.find(u => u.din === unitDIN);
    if (!unit) return { breachDetected: false };

    const nowIso = new Date().toISOString();
    const isBreach =
      temperatureCelsius < unit.storageTempRange.min || temperatureCelsius > unit.storageTempRange.max;

    if (isOffline) {
      setOfflineQueue(prev => [
        ...prev,
        { din: unitDIN, temp: temperatureCelsius, location: locationName, timestamp: nowIso }
      ]);
      return { breachDetected: isBreach };
    }

    const updatedUnit: BloodUnit = {
      ...unit,
      telemetryLogs: [
        ...unit.telemetryLogs,
        { timestamp: nowIso, temperatureCelsius, locationName, breachDetected: isBreach }
      ]
    };

    setUnits(prev => prev.map(u => (u.din === unitDIN ? updatedUnit : u)));
    await persistUnit(updatedUnit);

    if (isBreach) {
      const sig = `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`;
      await appendBlock(
        unitDIN,
        'COLD_CHAIN_BREACH_DETECTED',
        {
          id: currentCourier ? currentCourier.fullName : 'Cold-chain sensor',
          role: 'LOGISTICS_COURIER',
          facility: unit.destinationHospital || 'In transit',
          signature: sig
        },
        {
          recordedTempCelsius: temperatureCelsius,
          allowedMin: unit.storageTempRange.min,
          allowedMax: unit.storageTempRange.max,
          breachLocation: locationName,
          timestamp: nowIso
        }
      );

      const incidentId = `INC-TEMP-${Date.now().toString(36).toUpperCase()}`;
      const newIssue: SystemIssue = {
        id: incidentId,
        title: `Cold-chain excursion: ${temperatureCelsius}\u00b0C on ${unitDIN}`,
        category: 'COLD_CHAIN_ALERT',
        severity: 'CRITICAL',
        status: 'OPEN',
        facility: `${unit.destinationHospital || 'In transit'} (en route)`,
        affectedEntity: `Unit DIN: ${unitDIN}`,
        description: `Cold-chain telemetry recorded a temperature outside the stored range: ${temperatureCelsius}\u00b0C (allowed ${unit.storageTempRange.min}\u00b0C to ${unit.storageTempRange.max}\u00b0C). Location: ${locationName}. Flagged for review before issue.`,
        timestamp: nowIso
      };
      await persistIssue(newIssue);
    }

    return { breachDetected: isBreach };
  };

  const confirmHospitalReceipt = async (
    unitDIN: string,
    receivingFacility: string,
    receivingStaff: string
  ): Promise<void> => {
    const unit = units.find(u => u.din === unitDIN);
    if (!unit) return;

    const nowIso = new Date().toISOString();
    const updatedUnit: BloodUnit = {
      ...unit,
      status: 'DELIVERED_TO_HOSPITAL',
      currentFacility: receivingFacility
    };

    setUnits(prev => prev.map(u => (u.din === unitDIN ? updatedUnit : u)));
    await persistUnit(updatedUnit);

    const sig = `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`;
    await appendBlock(
      unitDIN,
      'HOSPITAL_CUSTODY_TRANSFERRED',
      {
        id: receivingStaff,
        role: 'CLINICAL_STAFF',
        facility: receivingFacility,
        signature: sig
      },
      {
        receivedBy: receivingStaff,
        receivingFacility,
        sealsAttestedIntact: true,
        deliveredAt: nowIso
      }
    );
  };

  return (
    <TorrentContext.Provider
      value={{
        currentUser,
        currentCourier,
        isAuthenticated: currentCourier !== null,
        units,
        issuesList,
        blockchain,
        staffList,
        isOffline,
        offlineQueue,
        setIsOffline,
        syncOfflineQueue,
        loginCourier,
        quickDemoCourierLogin,
        logoutCourier,
        dispatchUnitToTransit,
        logTelemetryReading,
        confirmHospitalReceipt
      }}
    >
      {children}
    </TorrentContext.Provider>
  );
};

export const useTorrent = () => {
  const context = useContext(TorrentContext);
  if (!context) {
    throw new Error('useTorrent must be used within a TorrentProvider');
  }
  return context;
};
