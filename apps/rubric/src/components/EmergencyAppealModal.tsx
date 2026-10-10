import React, { useState } from 'react';
import { useRubric } from '../context/RubricContext';
import { X, Radio, AlertTriangle, Send, CheckCircle2 } from 'lucide-react';
import type { BloodType } from '@shared/types/bloodchain';

export const EmergencyAppealModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { publishEmergencyAppeal } = useRubric();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [facility, setFacility] = useState('');
  const [bloodType, setBloodType] = useState<BloodType>('O-');
  const [busy, setBusy] = useState(false);
  const [published, setPublished] = useState(false);

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await publishEmergencyAppeal({ title, description, facility, targetBloodType: bloodType });
      setPublished(true);
      setTimeout(() => {
        setPublished(false);
        setTitle('');
        setDescription('');
        setFacility('');
        onClose();
      }, 2200);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-hd">
          <div>
            <div className="eyebrow" style={{ color: 'var(--stop)' }}>Deficit appeal</div>
            <h2 style={{ fontSize: 18 }}>Raise a donor appeal</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-bd">
          {published ? (
            <div className="notice notice--safe" style={{ padding: 18 }}>
              <CheckCircle2 className="notice-icon" size={18} />
              <span>
                Appeal recorded as an open supply-deficit incident. Donor notifications would be delivered by the
                notification service in a live deployment.
              </span>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="field">
                <label className="label" htmlFor="ap-title">Appeal headline</label>
                <input id="ap-title" className="input" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. O- shortfall at Example Referral Hospital" />
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="field">
                  <label className="label" htmlFor="ap-group">Blood group</label>
                  <select id="ap-group" className="select" value={bloodType} onChange={e => setBloodType(e.target.value as BloodType)}>
                    {(['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as BloodType[]).map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="label" htmlFor="ap-facility">Facility</label>
                  <input id="ap-facility" className="input" required value={facility} onChange={e => setFacility(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label className="label" htmlFor="ap-desc">Message to donors</label>
                <textarea
                  id="ap-desc"
                  className="textarea"
                  rows={3}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Short, factual message. Avoid clinical detail."
                />
              </div>

              <div className="notice notice--watch">
                <AlertTriangle className="notice-icon" size={15} />
                <span>
                  This records a critical supply-deficit incident and would notify eligible donors in the affected area.
                </span>
              </div>

              <button className="btn btn--primary btn--block" type="submit" disabled={busy} style={{ marginTop: 14 }}>
                <Send size={15} />
                {busy ? 'Recording…' : 'Raise appeal'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
