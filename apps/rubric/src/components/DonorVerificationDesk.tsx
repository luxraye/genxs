import React, { useState } from 'react';
import { useRubric } from '../context/RubricContext';
import { Search, FileText, ChevronDown, ExternalLink, BadgeCheck, Check, X } from 'lucide-react';
import type { DonorProfile, DonorVerificationTier } from '@shared/types/bloodchain';

const TIER_LABEL: Record<number, string> = {
  1: 'Registered',
  2: 'Documents submitted',
  3: 'Verified',
  4: 'Verified repeat donor'
};

export const DonorVerificationDesk: React.FC = () => {
  const { donorsList, reviewDonorDocument, updateDonorTier } = useRubric();

  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [openId, setOpenId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const filtered = donorsList
    .filter(d => {
      if (tierFilter !== 'ALL' && d.tier.toString() !== tierFilter) return false;
      if (groupFilter !== 'ALL' && d.bloodType !== groupFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          d.fullName.toLowerCase().includes(q) ||
          d.email.toLowerCase().includes(q) ||
          (d.nationalIdNumber ?? '').toLowerCase().includes(q) ||
          (d.cityDistrict ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => b.tier - a.tier);

  const approveAll = async (donor: DonorProfile) => {
    for (const doc of donor.uploadedDocuments) {
      if (doc.status === 'PENDING') {
        await reviewDonorDocument(donor.id, doc.id, 'APPROVED', 'Reviewed and accepted.');
      }
    }
    if (donor.tier < 3) await updateDonorTier(donor.id, 3 as DonorVerificationTier);
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">Donor verification</div>
        <h1 className="page-title">Donor documents &amp; verification</h1>
        <p className="page-sub">
          Review submitted identification and health documents and record a verification decision. Verification is a
          human decision — nothing is verified automatically.
        </p>
      </div>

      <div className="card">
        <div className="card-hd">
          <h3>
            Donors ({donorsList.length}) &middot;{' '}
            <span style={{ color: 'var(--watch)', fontWeight: 600 }}>
              {donorsList.filter(d => d.tier === 2).length} awaiting review
            </span>
          </h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 9, top: 10, color: 'var(--ink-3)' }} />
              <input
                className="input"
                style={{ paddingLeft: 30, width: 210 }}
                placeholder="Name, ID, district"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <select className="select" style={{ width: 'auto' }} value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
              <option value="ALL">All levels</option>
              <option value="2">Documents submitted</option>
              <option value="3">Verified</option>
              <option value="4">Verified repeat donor</option>
              <option value="1">Registered</option>
            </select>
            <select className="select" style={{ width: 'auto' }} value={groupFilter} onChange={e => setGroupFilter(e.target.value)}>
              <option value="ALL">All groups</option>
              {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map(bg => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Donor</th>
                <th style={{ textAlign: 'center' }}>Group</th>
                <th style={{ textAlign: 'center' }}>Level</th>
                <th>District</th>
                <th style={{ textAlign: 'center' }}>Donations</th>
                <th>Documents</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="tbl-empty">No donor records match the current filters.</div>
                  </td>
                </tr>
              ) : (
                filtered.map(donor => {
                  const open = openId === donor.id;
                  return (
                    <React.Fragment key={donor.id}>
                      <tr>
                        <td>
                          <div className="cell-strong" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {donor.fullName}
                            {donor.tier >= 4 && <BadgeCheck size={14} color="var(--safe)" />}
                          </div>
                          <div className="cell-sub mono">{donor.nationalIdNumber || donor.id}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="strong-group">{donor.bloodType}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className={`status ${
                              donor.tier >= 4
                                ? 'status--safe'
                                : donor.tier === 3
                                ? 'status--info'
                                : donor.tier === 2
                                ? 'status--watch'
                                : 'status--hold'
                            }`}
                          >
                            {TIER_LABEL[donor.tier]}
                          </span>
                        </td>
                        <td>{donor.cityDistrict || '—'}</td>
                        <td style={{ textAlign: 'center' }} className="mono">
                          {donor.totalDonations}
                        </td>
                        <td>
                          <button
                            className="btn btn--outline"
                            style={{ padding: '4px 9px', fontSize: 12 }}
                            onClick={() => setOpenId(open ? null : donor.id)}
                          >
                            <FileText size={13} />
                            {donor.uploadedDocuments.length}
                            <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
                          </button>
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {donor.tier === 2 && (
                            <button
                              className="btn btn--ok"
                              style={{ padding: '4px 10px', fontSize: 12 }}
                              onClick={() => approveAll(donor)}
                            >
                              <Check size={13} />
                              Verify
                            </button>
                          )}
                        </td>
                      </tr>

                      {open && (
                        <tr>
                          <td colSpan={7} style={{ background: 'var(--surface-2)' }}>
                            {donor.uploadedDocuments.length === 0 ? (
                              <div className="dim" style={{ fontSize: 12.5, padding: '4px 0' }}>
                                No documents submitted.
                              </div>
                            ) : (
                              <div style={{ display: 'grid', gap: 10 }}>
                                {donor.uploadedDocuments.map(doc => (
                                  <div key={doc.id} className="card" style={{ boxShadow: 'none' }}>
                                    <div className="card-bd" style={{ padding: 13 }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                        <span style={{ display: 'inline-flex', gap: 7, alignItems: 'center', fontWeight: 600, fontSize: 13 }}>
                                          <FileText size={14} color="var(--ink-3)" />
                                          {doc.name}
                                          {doc.fileDataUrl && (
                                            <a href={doc.fileDataUrl} target="_blank" rel="noreferrer" title="Open document">
                                              <ExternalLink size={12} />
                                            </a>
                                          )}
                                        </span>
                                        <span className="status status--hold">{doc.status}</span>
                                      </div>
                                      <div className="cell-sub" style={{ marginTop: 4 }}>
                                        {doc.type.replace(/_/g, ' ').toLowerCase()} &middot; submitted{' '}
                                        {new Date(doc.uploadedAt).toLocaleDateString('en-GB')}
                                      </div>

                                      {doc.status === 'PENDING' && (
                                        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                                          <input
                                            className="input"
                                            style={{ flex: 1, minWidth: 200 }}
                                            placeholder="Review note (recorded against this decision)"
                                            value={notes[doc.id] ?? ''}
                                            onChange={e => setNotes({ ...notes, [doc.id]: e.target.value })}
                                          />
                                          <button
                                            className="btn btn--ok"
                                            onClick={() =>
                                              reviewDonorDocument(donor.id, doc.id, 'APPROVED', notes[doc.id] || 'Reviewed and accepted.')
                                            }
                                          >
                                            <Check size={13} />
                                            Accept
                                          </button>
                                          <button
                                            className="btn btn--danger"
                                            onClick={() =>
                                              reviewDonorDocument(donor.id, doc.id, 'REJECTED', notes[doc.id] || 'Not accepted.')
                                            }
                                          >
                                            <X size={13} />
                                            Reject
                                          </button>
                                        </div>
                                      )}

                                      {doc.reviewNotes && (
                                        <div className="cell-sub" style={{ marginTop: 8 }}>
                                          Note: {doc.reviewNotes}
                                          {doc.reviewedBy ? ` — ${doc.reviewedBy}` : ''}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
