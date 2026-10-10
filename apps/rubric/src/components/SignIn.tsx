import React, { useState } from 'react';
import { useRubric } from '../context/RubricContext';
import { Plus, ShieldCheck, AlertCircle, Eye, EyeOff, ArrowRight, Activity, Building2, Radio } from 'lucide-react';

const POINTS = [
  { icon: Activity, text: 'See the national inventory position and days of cover by blood group.' },
  { icon: Building2, text: 'Allocate released units to ward requisitions and track what was dispatched.' },
  { icon: Radio, text: 'Review incidents, quarantine holds and cold-chain exceptions in one queue.' }
];

export const SignIn: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { loginOperator, quickDemoOperatorLogin, staffList, currentOperator, logoutOperator } = useRubric();

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
      const res = await loginOperator(email, password);
      res.success ? onSuccess() : setError(res.error ?? 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  };

  const demoAccounts = staffList.filter(s => s.role === 'NATIONAL_OPERATOR');

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
              Operations
            </span>
          </div>

          <h1 style={{ color: '#fff', fontSize: 26, lineHeight: 1.22 }}>
            The national view
            <br />
            of the blood supply.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 13, maxWidth: '42ch' }}>
            The operations console for the national blood service — inventory position, ward allocation, personnel and
            incident review in one place.
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
            {currentOperator ? (
              <>
                <div className="eyebrow">Already signed in</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>{currentOperator.fullName}</div>
                <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
                  You are signed in to the operations console. Continue, or sign out to use a different account.
                </p>
                <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                  <button className="btn btn--primary" onClick={onSuccess}>
                    <ArrowRight size={15} />
                    Continue
                  </button>
                  <button className="btn btn--outline" onClick={logoutOperator}>
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="eyebrow">Operator access</div>
                <h2 style={{ fontSize: 18, marginTop: 2 }}>Sign in to the console</h2>

                {error && (
                  <div className="notice notice--stop" style={{ marginTop: 16 }}>
                    <AlertCircle className="notice-icon" size={15} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={submit} style={{ marginTop: 18 }}>
                  <div className="field">
                    <label className="label" htmlFor="op-email">
                      Operator email
                    </label>
                    <input
                      id="op-email"
                      className="input"
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@bloodservice.example"
                    />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="op-pw">
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="op-pw"
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

                <div style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 14 }}>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>
                    Demonstration access
                  </div>
                  <button
                    className="btn btn--outline btn--block"
                    onClick={() => {
                      quickDemoOperatorLogin();
                      onSuccess();
                    }}
                  >
                    Sign in as demonstration operator
                  </button>
                  <p className="hint" style={{ marginTop: 8 }}>
                    {demoAccounts.length > 0
                      ? `${demoAccounts.length} national operations sample account available.`
                      : 'No sample operator account configured.'}
                  </p>
                </div>

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
