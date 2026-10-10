import React, { useState } from 'react';
import { useScyther } from '../context/ScytherContext';
import { FileUp, FileText, CheckCircle2, Lock, Info, ExternalLink, ShieldCheck } from 'lucide-react';
import type { DonorDocument } from '@shared/types/bloodchain';

const CONSENT_KEY = 'scyther_consent_v1';

const maskId = (id: string) => (!id ? 'Not provided' : id.length <= 4 ? id : '•••• ' + id.slice(-4));

export const Profile: React.FC<{ onSignIn?: () => void }> = ({ onSignIn }) => {
  const { donor, uploadDocument, logoutDonor, isAuthenticated } = useScyther();

  const [docType, setDocType] = useState<DonorDocument['type']>('NATIONAL_ID');
  const [docName, setDocName] = useState('National_ID.pdf');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [consent, setConsent] = useState<boolean>(() => localStorage.getItem(CONSENT_KEY) === 'true');

  const toggleConsent = (v: boolean) => {
    setConsent(v);
    localStorage.setItem(CONSENT_KEY, String(v));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const res = await uploadDocument({
        name: docName.trim() || 'Document.pdf',
        type: docType,
        sizeKb: file ? Math.round(file.size / 1024) : 0,
        fileBlob: file ?? undefined
      });
      if (res.success) {
        setFeedback('Document received and queued for review.');
        setFile(null);
      } else {
        setFeedback(res.error ?? 'Upload failed.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="stack">
        <div className="page-head">
          <div className="eyebrow">Account</div>
          <h1 className="page-title">Profile</h1>
        </div>
        <div className="card">
          <div className="card-bd">
            <p className="muted">Sign in to view your donor profile and submitted documents.</p>
            {onSignIn && (
              <button className="btn btn--primary" style={{ marginTop: 14 }} onClick={onSignIn}>
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const docs = donor.uploadedDocuments ?? [];

  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">Account</div>
        <h1 className="page-title">Profile &amp; settings</h1>
        <p className="page-sub">Your donor details, verification status, and privacy settings.</p>
      </div>

      <div className="grid-2">
        <div className="stack">
          <div className="card">
            <div className="card-hd">
              <h3>Your details</h3>
            </div>
            <div className="card-bd">
              <div className="row">
                <span className="row-k" style={{ color: 'var(--ink-2)', fontWeight: 500 }}>Full name</span>
                <span>{donor.fullName}</span>
              </div>
              <div className="row">
                <span className="row-k" style={{ color: 'var(--ink-2)', fontWeight: 500 }}>Donor ID</span>
                <span className="mono">{donor.id}</span>
              </div>
              <div className="row">
                <span className="row-k" style={{ color: 'var(--ink-2)', fontWeight: 500 }}>Blood group</span>
                <span className="mono">{donor.bloodType}</span>
              </div>
              <div className="row">
                <span className="row-k" style={{ color: 'var(--ink-2)', fontWeight: 500 }}>National ID</span>
                <span className="mono">{maskId(donor.nationalIdNumber)}</span>
              </div>
              <div className="row">
                <span className="row-k" style={{ color: 'var(--ink-2)', fontWeight: 500 }}>Phone</span>
                <span className="mono">{donor.phone || 'Not provided'}</span>
              </div>
              <div className="row">
                <span className="row-k" style={{ color: 'var(--ink-2)', fontWeight: 500 }}>Email</span>
                <span>{donor.email}</span>
              </div>
              <div className="row">
                <span className="row-k" style={{ color: 'var(--ink-2)', fontWeight: 500 }}>District</span>
                <span>{donor.cityDistrict}</span>
              </div>
              <button className="btn btn--outline" style={{ marginTop: 16 }} onClick={logoutDonor}>
                Sign out
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-hd">
              <h3>Verification</h3>
              <span className={`status ${donor.tier >= 3 ? 'status--safe' : 'status--hold'}`}>
                {donor.tier >= 3 ? <ShieldCheck size={13} /> : <Lock size={13} />}
                {donor.tier >= 3 ? 'Verified' : 'Not yet verified'}
              </span>
            </div>
            <div className="card-bd">
              <p className="muted" style={{ fontSize: 13 }}>
                Submitting a document does not verify your identity. Documents are reviewed by the national blood
                service before any verification is recorded.
              </p>

              {feedback && (
                <div className="notice notice--safe" style={{ marginTop: 14 }}>
                  <CheckCircle2 className="notice-icon" size={15} />
                  <span>{feedback}</span>
                </div>
              )}

              {docs.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Document</th>
                        <th>Submitted</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docs.map(d => (
                        <tr key={d.id}>
                          <td>
                            <span style={{ display: 'inline-flex', gap: 7, alignItems: 'center' }}>
                              <FileText size={14} color="var(--ink-3)" />
                              {d.name}
                              {d.fileDataUrl && (
                                <a href={d.fileDataUrl} target="_blank" rel="noreferrer" title="Open">
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </span>
                          </td>
                          <td className="mono" style={{ fontSize: 12.5 }}>
                            {new Date(d.uploadedAt).toLocaleDateString('en-GB')}
                          </td>
                          <td>
                            <span className="status status--watch">{d.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-hd">
              <h3>Submit a document</h3>
            </div>
            <div className="card-bd">
              <form onSubmit={submit}>
                <div className="field">
                  <label className="label" htmlFor="pf-type">Document type</label>
                  <select
                    id="pf-type"
                    className="select"
                    value={docType}
                    onChange={e => {
                      const v = e.target.value as DonorDocument['type'];
                      setDocType(v);
                      setDocName(v === 'NATIONAL_ID' ? 'National_ID.pdf' : v === 'MEDICAL_CLEARANCE' ? 'Medical_Clearance.pdf' : 'Screening_Report.pdf');
                    }}
                  >
                    <option value="NATIONAL_ID">National ID / passport</option>
                    <option value="MEDICAL_CLEARANCE">Medical clearance certificate</option>
                    <option value="SEROLOGY_RECORD">Laboratory screening report</option>
                    <option value="DONOR_QUESTIONNAIRE">Signed health questionnaire</option>
                  </select>
                </div>

                <div className="field">
                  <label className="label" htmlFor="pf-file">File</label>
                  <input
                    id="pf-file"
                    className="input"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => {
                      const f = e.target.files?.[0] ?? null;
                      setFile(f);
                      if (f) setDocName(f.name);
                    }}
                  />
                  <span className="hint">PDF, JPG or PNG.</span>
                </div>

                <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
                  <FileUp size={15} />
                  {busy ? 'Uploading…' : 'Submit for review'}
                </button>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-hd">
              <h3>Consent &amp; privacy</h3>
            </div>
            <div className="card-bd">
              <div className="notice" style={{ marginBottom: 14 }}>
                <Info className="notice-icon" size={15} />
                <span style={{ fontSize: 12.5 }}>
                  Under the Data Protection Act, 2024 your information is processed for donor eligibility and service
                  delivery only. You may withdraw consent at any time.
                </span>
              </div>
              <label className="checkline">
                <input type="checkbox" checked={consent} onChange={e => toggleConsent(e.target.checked)} />
                <span>
                  I consent to the national blood service processing my donor information for eligibility, donation
                  administration and service communication.
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
