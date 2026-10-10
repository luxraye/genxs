import React, { useState } from 'react';
import { useCrucible } from '../context/CrucibleContext';
import { Plus, FlaskConical, ShieldCheck, AlertCircle, Eye, EyeOff, ArrowRight, Layers, ShieldAlert } from 'lucide-react';

const POINTS = [
  { icon: FlaskConical, text: 'Record screening results and confirm the blood group for each unit.' },
  { icon: ShieldCheck, text: 'Release only units where every panel is clear and the group is confirmed.' },
  { icon: Layers, text: 'Prepare components — red cells, plasma, platelets and cryoprecipitate.' }
];

export const SignIn: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { loginScientist, quickDemoScientistLogin, staffList, currentScientist, logoutScientist } = useCrucible();

  const DEMO_ENABLED = import.meta.env.VITE_DEMO_ACCOUNTS !== 'false';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await loginScientist(email, password);
      res.success ? onSuccess() : setError(res.error ?? 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  };

  const labAccounts = staffList.filter(s => s.role === 'LAB_TECH');

  return (
    <div className="auth-wrap">
      <aside className="auth-brand">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <span className="brand-mark" style={{ background: '#fff', color: 'var(--accent)' }}>
              <Plus size={17} strokeWidth={2.8} />
            </span>
            <span style={{ fontFamily: '"Instrument Sans", sans-serif', fontWeight: 700, fontSize: 18 }}>
              Bloodchain
            </span>
            <span
              className="brand-tag"
              style={{ background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}
            >
              Laboratory
            </span>
          </div>

          <h1 style={{ color: '#fff', fontSize: 26, lineHeight: 1.22 }}>
            Every unit is tested
            <br />
            before it is released.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 13, maxWidth: '42ch' }}>
            The laboratory console for the national blood service — screening, blood-group confirmation, component
            preparation and quality release.
          </p>

          <ul className="auth-points">
            {POINTS.map(p => {
              const Icon = p.icon;
              return (
                <li key={p.text}>
                  <Icon size={16} style={{ flexShrink: 0, marginTop: 2, opacity: 0.9 }} />
                  <span>{p.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="auth-tag">
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={15} style={{ opacity: 0.9 }} />
            Part of the Bloodchain ecosystem.
          </div>
          <div style={{ marginTop: 6, opacity: 0.85, fontSize: 12.5 }}>
            One platform connecting donors, collection centres, laboratories and hospital care.
          </div>
        </div>
      </aside>

      <section className="auth-form">
        <div className="card">
          <div className="card-bd">
            {currentScientist ? (
              <>
                <div className="eyebrow">Already signed in</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>{currentScientist.fullName}</div>
                <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
                  You are signed in to the laboratory console. Continue, or sign out to use a different account.
                </p>
                <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                  <button className="btn btn--primary" onClick={onSuccess}>
                    <ArrowRight size={15} />
                    Continue
                  </button>
                  <button className="btn btn--outline" onClick={logoutScientist}>
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="eyebrow">Laboratory access</div>
                <h2 style={{ fontSize: 18, marginTop: 2 }}>Sign in to the laboratory console</h2>

                {error && (
                  <div className="notice notice--stop" style={{ marginTop: 16 }}>
                    <AlertCircle className="notice-icon" size={15} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={submit} style={{ marginTop: 18 }}>
                  <div className="field">
                    <label className="label" htmlFor="lab-email">
                      Laboratory email
                    </label>
                    <input
                      id="lab-email"
                      className="input"
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@bloodservice.example"
                    />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="lab-pw">
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="lab-pw"
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
                        style={{ position: 'absolute', right: 9, top: 8 }}
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

                {DEMO_ENABLED && (
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 14 }}>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>
                    Demonstration access
                  </div>
                  <button
                    className="btn btn--outline btn--block"
                    onClick={() => {
                      quickDemoScientistLogin();
                      onSuccess();
                    }}
                  >
                    Sign in as demonstration laboratory user
                  </button>
                  <p className="hint" style={{ marginTop: 8 }}>
                    {labAccounts.length > 0
                      ? `${labAccounts.length} laboratory sample account available.`
                      : 'No sample laboratory account configured.'}
                  </p>
                </div>
                )}

                <p className="hint" style={{ marginTop: 16 }}>
                  Demonstration environment. All records shown are illustrative sample data.
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
