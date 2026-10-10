import React, { useState } from 'react';
import { useScyther } from '../context/ScytherContext';
import { X, AlertCircle, Eye, EyeOff } from 'lucide-react';
import type { BloodType } from '@shared/types/bloodchain';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginDonor, registerDonor, quickDemoLogin, donorsList } = useScyther();

  const [mode, setMode] = useState<'SIGNIN' | 'REGISTER'>('SIGNIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodType, setBloodType] = useState<BloodType>('O+');
  const [district, setDistrict] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await loginDonor(email, password);
      res.success ? onClose() : setError(res.error ?? 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  };

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!consent) {
      setError('Please confirm consent to continue.');
      return;
    }
    setBusy(true);
    try {
      const res = await registerDonor({
        fullName,
        email,
        password,
        nationalIdNumber: nationalId,
        phone,
        bloodType,
        cityDistrict: district
      });
      res.success ? onClose() : setError(res.error ?? 'Registration failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className="modal" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-hd">
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Donor account</div>
            <h2 style={{ fontSize: 19 }}>{mode === 'SIGNIN' ? 'Sign in' : 'Register as a donor'}</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-bd">
          <div className="seg" style={{ marginBottom: 18 }}>
            <button aria-pressed={mode === 'SIGNIN'} onClick={() => setMode('SIGNIN')}>
              Sign in
            </button>
            <button aria-pressed={mode === 'REGISTER'} onClick={() => setMode('REGISTER')}>
              Register
            </button>
          </div>

          {error && (
            <div className="notice notice--stop" style={{ marginBottom: 16 }}>
              <AlertCircle className="notice-icon" size={15} />
              <span>{error}</span>
            </div>
          )}

          {mode === 'SIGNIN' ? (
            <form onSubmit={signIn}>
              <div className="field">
                <label className="label" htmlFor="si-email">Email address</label>
                <input id="si-email" className="input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.bw" />
              </div>
              <div className="field">
                <label className="label" htmlFor="si-pw">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="si-pw"
                    className="input"
                    type={showPw ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ paddingRight: 38 }}
                  />
                  <button type="button" className="modal-close" style={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setShowPw(v => !v)} aria-label="Toggle password">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          ) : (
            <form onSubmit={register}>
              <div className="field">
                <label className="label" htmlFor="rg-name">Full name</label>
                <input id="rg-name" className="input" required value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="field">
                  <label className="label" htmlFor="rg-id">National ID</label>
                  <input id="rg-id" className="input mono" required value={nationalId} onChange={e => setNationalId(e.target.value)} />
                </div>
                <div className="field">
                  <label className="label" htmlFor="rg-bt">Blood group</label>
                  <select id="rg-bt" className="select" value={bloodType} onChange={e => setBloodType(e.target.value as BloodType)}>
                    {(['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as BloodType[]).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="field">
                  <label className="label" htmlFor="rg-phone">Phone</label>
                  <input id="rg-phone" className="input mono" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+267 …" />
                </div>
                <div className="field">
                  <label className="label" htmlFor="rg-district">District</label>
                  <input id="rg-district" className="input" required value={district} onChange={e => setDistrict(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label className="label" htmlFor="rg-email">Email address</label>
                <input id="rg-email" className="input" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="field">
                <label className="label" htmlFor="rg-pw">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="rg-pw"
                    className="input"
                    type={showPw ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ paddingRight: 38 }}
                  />
                  <button type="button" className="modal-close" style={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setShowPw(v => !v)} aria-label="Toggle password">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <label className="checkline" style={{ marginBottom: 16 }}>
                <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
                <span>
                  I consent to my information being processed for donor eligibility and service delivery, under the Data
                  Protection Act, 2024.
                </span>
              </label>

              <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
                {busy ? 'Creating account…' : 'Create donor account'}
              </button>
            </form>
          )}

          <div style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 14 }}>
            <div className="meta-k" style={{ marginBottom: 8 }}>Sample accounts (demonstration)</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {donorsList.slice(0, 3).map(d => (
                <button
                  key={d.id}
                  className="btn btn--outline"
                  style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '8px 10px' }}
                  onClick={() => {
                    quickDemoLogin(d.id);
                    onClose();
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{d.fullName.split(' ')[0]}</span>
                  <span className="mono dim" style={{ fontSize: 11 }}>{d.bloodType}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
