import React, { useState } from 'react';
import { useScyther } from '../context/ScytherContext';
import {
  Plus,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Calendar,
  MapPin,
  Layers
} from 'lucide-react';
import type { BloodType } from '@shared/types/bloodchain';

const POINTS = [
  { icon: ShieldCheck, text: 'Check whether you can donate today, in about a minute.' },
  { icon: MapPin, text: 'Find a donation centre near you and reserve a time.' },
  { icon: Layers, text: 'Follow what happens to your donation after you give it.' }
];

export const AuthPage: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { loginDonor, registerDonor, quickDemoLogin, donorsList, donor, logoutDonor } = useScyther();

  const DEMO_ENABLED = import.meta.env.VITE_DEMO_ACCOUNTS !== 'false';

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

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await loginDonor(email, password);
      res.success ? onSuccess() : setError(res.error ?? 'Sign in failed.');
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
      res.success ? onSuccess() : setError(res.error ?? 'Registration failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <aside className="auth-brand">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 30 }}>
            <span className="brand-mark" style={{ background: '#fff', color: 'var(--brand)' }}>
              <Plus size={17} strokeWidth={2.8} />
            </span>
            <span style={{ fontFamily: '"Instrument Sans", sans-serif', fontWeight: 700, fontSize: 18 }}>
              Bloodchain
            </span>
            <span
              className="brand-tag"
              style={{ background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}
            >
              Donor
            </span>
          </div>

          <h1 style={{ color: '#fff', fontSize: 28, lineHeight: 1.2 }}>
            Give blood.
            <br />
            Follow it all the way.
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.86)', fontSize: 14.5, marginTop: 14, maxWidth: '42ch' }}>
            A donor service for Botswana&rsquo;s national blood programme — from the moment you decide to give, to the
            patient who receives it.
          </p>

          <ul className="auth-points">
            {POINTS.map(p => {
              const Icon = p.icon;
              return (
                <li key={p.text}>
                  <Icon size={17} style={{ flexShrink: 0, marginTop: 2, opacity: 0.9 }} />
                  <span>{p.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="auth-tag">
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={15} style={{ opacity: 0.9 }} />
            Part of the Bloodchain ecosystem.
          </div>
          <div style={{ marginTop: 6, opacity: 0.85, fontSize: 12.5, lineHeight: 1.5 }}>
            One platform connecting donors, collection centres, laboratories and hospital care.
          </div>
        </div>
      </aside>

      <section className="auth-form">
        {donor ? (
          <div className="card">
            <div className="card-bd">
              <div className="eyebrow">Already signed in</div>
              <div style={{ fontSize: 19, fontWeight: 600, marginTop: 2 }}>{donor.fullName}</div>
              <p className="muted" style={{ fontSize: 13.5, marginTop: 8 }}>
                You are signed in to the donor portal. Continue to your donor home, or sign out to use a different
                account.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                <button className="btn btn--primary" onClick={onSuccess}>
                  <ArrowRight size={15} />
                  Continue
                </button>
                <button className="btn btn--outline" onClick={logoutDonor}>
                  Sign out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-bd">
              <div className="seg" style={{ marginBottom: 20 }}>
                <button aria-pressed={mode === 'SIGNIN'} onClick={() => setMode('SIGNIN')}>
                  Sign in
                </button>
                <button aria-pressed={mode === 'REGISTER'} onClick={() => setMode('REGISTER')}>
                  Create account
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
                    <label className="label" htmlFor="ap-email">
                      Email address
                    </label>
                    <input
                      id="ap-email"
                      className="input"
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.bw"
                    />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="ap-pw">
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="ap-pw"
                        className="input"
                        type={showPw ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{ paddingRight: 40 }}
                      />
                      <button
                        type="button"
                        className="modal-close"
                        style={{ position: 'absolute', right: 9, top: 9 }}
                        onClick={() => setShowPw(v => !v)}
                        aria-label="Toggle password visibility"
                      >
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
                    <label className="label" htmlFor="ap-name">
                      Full name
                    </label>
                    <input
                      id="ap-name"
                      className="input"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="grid-2" style={{ gap: 12 }}>
                    <div className="field">
                      <label className="label" htmlFor="ap-id">
                        National ID
                      </label>
                      <input
                        id="ap-id"
                        className="input mono"
                        required
                        value={nationalId}
                        onChange={e => setNationalId(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="ap-bt">
                        Blood group
                      </label>
                      <select
                        id="ap-bt"
                        className="select"
                        value={bloodType}
                        onChange={e => setBloodType(e.target.value as BloodType)}
                      >
                        {(['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as BloodType[]).map(t => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid-2" style={{ gap: 12 }}>
                    <div className="field">
                      <label className="label" htmlFor="ap-phone">
                        Phone
                      </label>
                      <input
                        id="ap-phone"
                        className="input mono"
                        required
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+267 …"
                      />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="ap-district">
                        District
                      </label>
                      <input
                        id="ap-district"
                        className="input"
                        required
                        value={district}
                        onChange={e => setDistrict(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="ap-email2">
                      Email address
                    </label>
                    <input
                      id="ap-email2"
                      className="input"
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="ap-pw2">
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="ap-pw2"
                        className="input"
                        type={showPw ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{ paddingRight: 40 }}
                      />
                      <button
                        type="button"
                        className="modal-close"
                        style={{ position: 'absolute', right: 9, top: 9 }}
                        onClick={() => setShowPw(v => !v)}
                        aria-label="Toggle password visibility"
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <label className="checkline" style={{ marginBottom: 16 }}>
                    <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
                    <span>
                      I consent to my information being processed for donor eligibility and service delivery, under the
                      Data Protection Act, 2024.
                    </span>
                  </label>

                  <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
                    {busy ? 'Creating account…' : 'Create donor account'}
                  </button>
                </form>
              )}

              {DEMO_ENABLED && (
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 22, paddingTop: 16 }}>
                <div className="meta-k" style={{ marginBottom: 8 }}>
                  Sample accounts (demonstration)
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {donorsList.slice(0, 3).map(d => (
                    <button
                      key={d.id}
                      className="btn btn--outline"
                      style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '8px 10px' }}
                      onClick={() => {
                        quickDemoLogin(d.id);
                        onSuccess();
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{d.fullName.split(' ')[0]}</span>
                      <span className="mono dim" style={{ fontSize: 11 }}>
                        {d.bloodType}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              )}

              <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>
                This is a demonstration environment. No live donor records are used or displayed.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
