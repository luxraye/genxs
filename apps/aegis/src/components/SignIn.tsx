import React, { useState } from 'react';
import { useAegis } from '../context/AegisContext';
import { Plus, Stethoscope, ShieldCheck, AlertCircle, Eye, EyeOff, ArrowRight, UserCheck, HeartPulse } from 'lucide-react';

const POINTS = [
  { icon: UserCheck, text: 'Verify the unit and the patient at the bedside, with two clinicians signing.' },
  { icon: HeartPulse, text: 'Record observations during infusion and close the unit\u2019s journey cleanly.' },
  { icon: ShieldCheck, text: 'Report adverse reactions and flag linked components for review.' }
];

export const SignIn: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { loginClinician, quickDemoClinicianLogin, staffList, currentClinician, logoutClinician } = useAegis();

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
      const res = await loginClinician(email, password);
      res.success ? onSuccess() : setError(res.error ?? 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  };

  const clinicalAccounts = staffList.filter(s => s.role === 'CLINICAL_STAFF');

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
              Ward
            </span>
          </div>

          <h1 style={{ color: '#fff', fontSize: 26, lineHeight: 1.22 }}>
            Verify at the bedside.
            <br />
            Every time.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 13, maxWidth: '42ch' }}>
            The bedside console for hospital transfusion care — two-clinician verification, infusion monitoring and
            adverse-reaction reporting, connected to the national blood service.
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
            {currentClinician ? (
              <>
                <div className="eyebrow">Already signed in</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>{currentClinician.fullName}</div>
                <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
                  You are signed in to the ward console. Continue, or sign out to use a different account.
                </p>
                <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                  <button className="btn btn--primary" onClick={onSuccess}>
                    <ArrowRight size={15} />
                    Continue
                  </button>
                  <button className="btn btn--outline" onClick={logoutClinician}>
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="eyebrow">Ward access</div>
                <h2 style={{ fontSize: 18, marginTop: 2 }}>Sign in to the ward console</h2>

                {error && (
                  <div className="notice notice--stop" style={{ marginTop: 16 }}>
                    <AlertCircle className="notice-icon" size={15} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={submit} style={{ marginTop: 18 }}>
                  <div className="field">
                    <label className="label" htmlFor="clin-email">
                      Clinician email
                    </label>
                    <input
                      id="clin-email"
                      className="input"
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@example-hospital.example"
                    />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="clin-pw">
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="clin-pw"
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
                    {busy ? 'Signing in\u2026' : 'Sign in'}
                  </button>
                </form>

                <div style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 14 }}>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>
                    Demonstration access
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn--outline"
                      onClick={() => {
                        quickDemoClinicianLogin('DOCTOR');
                        onSuccess();
                      }}
                    >
                      <Stethoscope size={15} />
                      Enter as physician
                    </button>
                    <button
                      className="btn btn--outline"
                      onClick={() => {
                        quickDemoClinicianLogin('NURSE');
                        onSuccess();
                      }}
                    >
                      <UserCheck size={15} />
                      Enter as nurse
                    </button>
                  </div>
                  <p className="hint" style={{ marginTop: 8 }}>
                    {clinicalAccounts.length > 0
                      ? `${clinicalAccounts.length} clinical sample account available.`
                      : 'No sample clinical account configured.'}
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
