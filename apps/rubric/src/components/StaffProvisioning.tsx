import React, { useState } from 'react';
import { useRubric } from '../context/RubricContext';
import { UserPlus, X, Copy, Check, Search, KeyRound } from 'lucide-react';
import type { UserRole, StaffAccount } from '@shared/types/bloodchain';

const ROLE_LABEL: Record<UserRole, string> = {
  DONOR: 'Donor',
  CLINICAL_STAFF: 'Clinical staff',
  LAB_TECH: 'Laboratory technologist',
  LOGISTICS_COURIER: 'Logistics courier',
  NATIONAL_OPERATOR: 'National operator',
  AUDITOR: 'Auditor'
};

const FACILITIES = [
  'Example Referral Hospital (Gaborone)',
  'Example District Hospital (Francistown)',
  'Example Regional Hospital (Molepolole)',
  'Example District Hospital (Maun)',
  'National blood service — Headquarters'
];

export const StaffProvisioning: React.FC = () => {
  const { staffList, provisionStaff, toggleStaffStatus, resetStaffPassword } = useRubric();

  const [roleFilter, setRoleFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('CLINICAL_STAFF');
  const [facility, setFacility] = useState(FACILITIES[0]);
  const [badgeNumber, setBadgeNumber] = useState('');
  const [customTempPassword, setCustomTempPassword] = useState('');

  const filtered = staffList.filter(s => {
    if (roleFilter !== 'ALL' && s.role !== roleFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.facility.toLowerCase().includes(q) ||
        s.badgeNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetPw = async (account: StaffAccount) => {
    const t = await resetStaffPassword(account.id);
    setMessage(`Temporary password reset for ${account.fullName}: ${t}`);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const created = await provisionStaff({
        fullName,
        email,
        role,
        facility,
        badgeNumber: badgeNumber || `BW-${Math.floor(1000 + Math.random() * 9000)}`,
        customTempPassword: customTempPassword || undefined
      });
      setMessage(`Account created for ${created.fullName}. Temporary password: ${created.temporaryPassword}`);
      setModalOpen(false);
      setFullName('');
      setEmail('');
      setBadgeNumber('');
      setCustomTempPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">Personnel</div>
        <h1 className="page-title">Staff accounts</h1>
        <p className="page-sub">
          Create and manage accounts for clinical, laboratory, logistics and audit staff. Temporary passwords must be
          changed at first sign-in.
        </p>
      </div>

      {message && (
        <div className="notice notice--safe">
          <KeyRound className="notice-icon" size={15} />
          <span className="mono" style={{ fontSize: 12.5 }}>{message}</span>
        </div>
      )}

      <div className="card">
        <div className="card-hd">
          <h3>Registered staff ({staffList.length})</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 9, top: 10, color: 'var(--ink-3)' }} />
              <input
                className="input"
                style={{ paddingLeft: 30, width: 210 }}
                placeholder="Name, email, badge"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <select className="select" style={{ width: 'auto' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="ALL">All roles</option>
              {(Object.keys(ROLE_LABEL) as UserRole[]).map(r => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
            <button className="btn btn--primary" onClick={() => setModalOpen(true)}>
              <UserPlus size={15} />
              New account
            </button>
          </div>
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Facility</th>
                <th>Badge</th>
                <th>Password state</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="tbl-empty">No staff accounts match the current filters.</div>
                  </td>
                </tr>
              ) : (
                filtered.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div className="cell-strong">{a.fullName}</div>
                      <div className="cell-sub mono">{a.email}</div>
                    </td>
                    <td>{ROLE_LABEL[a.role]}</td>
                    <td>{a.facility}</td>
                    <td className="mono">{a.badgeNumber}</td>
                    <td>
                      {a.mustChangePassword ? (
                        <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                          <span className="status status--watch">Change required</span>
                          {a.temporaryPassword && (
                            <button
                              className="btn btn--outline"
                              style={{ padding: '3px 7px' }}
                              title="Copy temporary password"
                              onClick={() => copy(a.temporaryPassword!, a.id)}
                            >
                              {copiedId === a.id ? <Check size={13} color="var(--safe)" /> : <Copy size={13} />}
                            </button>
                          )}
                        </span>
                      ) : (
                        <span className="status status--safe">Set</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status ${a.status === 'ACTIVE' ? 'status--safe' : 'status--stop'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn--outline"
                        style={{ padding: '4px 9px', fontSize: 12, marginRight: 6 }}
                        onClick={() => resetPw(a)}
                      >
                        Reset password
                      </button>
                      <button
                        className={`btn ${a.status === 'ACTIVE' ? 'btn--danger' : 'btn--outline'}`}
                        style={{ padding: '4px 9px', fontSize: 12 }}
                        onClick={() => toggleStaffStatus(a.id, a.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                      >
                        {a.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={() => setModalOpen(false)}>
          <div className="modal" onMouseDown={e => e.stopPropagation()}>
            <div className="modal-hd">
              <div>
                <div className="eyebrow">New account</div>
                <h2 style={{ fontSize: 18 }}>Create staff account</h2>
              </div>
              <button className="modal-close" onClick={() => setModalOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="modal-bd">
              <form onSubmit={submit}>
                <div className="field">
                  <label className="label" htmlFor="np-name">Full name</label>
                  <input id="np-name" className="input" required value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                <div className="field">
                  <label className="label" htmlFor="np-email">Email</label>
                  <input id="np-email" className="input" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="field">
                  <label className="label" htmlFor="np-role">Role</label>
                  <select id="np-role" className="select" value={role} onChange={e => setRole(e.target.value as UserRole)}>
                    <option value="CLINICAL_STAFF">Clinical staff</option>
                    <option value="LAB_TECH">Laboratory technologist</option>
                    <option value="LOGISTICS_COURIER">Logistics courier</option>
                    <option value="AUDITOR">Auditor</option>
                    <option value="NATIONAL_OPERATOR">National operator</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label" htmlFor="np-facility">Facility</label>
                  <select id="np-facility" className="select" value={facility} onChange={e => setFacility(e.target.value)}>
                    {FACILITIES.map(f => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="label" htmlFor="np-badge">Badge ID</label>
                  <input id="np-badge" className="input mono" value={badgeNumber} onChange={e => setBadgeNumber(e.target.value)} placeholder="Auto-generated if left blank" />
                </div>
                <div className="field">
                  <label className="label" htmlFor="np-temp">Temporary password (optional)</label>
                  <input id="np-temp" className="input mono" value={customTempPassword} onChange={e => setCustomTempPassword(e.target.value)} placeholder="Generated if left blank" />
                  <span className="hint">The holder must change this at first sign-in.</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                  <button type="button" className="btn btn--outline" onClick={() => setModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn--primary" disabled={busy}>
                    {busy ? 'Creating…' : 'Create account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
