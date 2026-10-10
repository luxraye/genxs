import React, { useState } from 'react';
import { useScyther } from '../context/ScytherContext';
import { MapPin, Clock, CheckCircle2, CalendarX2 } from 'lucide-react';

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export const Booking: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { centers, donor, bookAppointment, bookedAppointment, cancelAppointment } = useScyther();
  const [centerId, setCenterId] = useState(centers[0]?.id ?? '');
  const [date, setDate] = useState(tomorrow());
  const [time, setTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const center = centers.find(c => c.id === centerId) ?? centers[0];

  const confirm = async () => {
    if (!time || !center) return;
    setSubmitting(true);
    try {
      await bookAppointment(center.id, date, time);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">Donation centres</div>
        <h1 className="page-title">Book a donation</h1>
        <p className="page-sub">
          Choose a donation centre, pick a date and an available time. Facility names and availability below are
          illustrative.
        </p>
      </div>

      {bookedAppointment && (
        <div className="card">
          <div className="card-bd" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <CheckCircle2 size={20} color="var(--safe)" />
              <div>
                <div style={{ fontWeight: 600 }}>{bookedAppointment.centerName}</div>
                <div className="muted" style={{ fontSize: 13 }}>
                  {bookedAppointment.date} · {bookedAppointment.time} · bring your donor card
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn--outline" onClick={cancelAppointment}>
                <CalendarX2 size={15} />
                Cancel
              </button>
              <button className="btn btn--primary" onClick={onDone}>
                View my donations
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-hd">
            <h3>Nearby centres</h3>
            <span className="dim" style={{ fontSize: 12.5 }}>
              {centers.length} example sites
            </span>
          </div>
          <div className="card-bd stack" style={{ gap: 10 }}>
            {centers.map(c => (
              <button
                key={c.id}
                className="choose"
                aria-pressed={c.id === centerId}
                onClick={() => {
                  setCenterId(c.id);
                  setTime(null);
                }}
              >
                <div className="avatar avatar--brand" style={{ marginTop: 2 }}>
                  {c.district.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="choose-title">{c.name}</div>
                  <div className="choose-sub" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
                      <MapPin size={13} /> {c.address}
                    </span>
                  </div>
                  <div className="choose-sub" style={{ display: 'inline-flex', gap: 5, alignItems: 'center', marginTop: 5 }}>
                    <Clock size={13} /> {c.hours}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {c.urgentNeeds.map(t => (
                      <span key={t} className={`badge ${t === donor.bloodType ? 'badge--brand' : ''}`}>
                        {t}
                        {t === donor.bloodType ? ' · your group' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-hd">
            <h3>Reserve a time</h3>
          </div>
          <div className="card-bd">
            <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
              {center?.name}
            </p>

            <div className="field">
              <label className="label" htmlFor="bk-date">
                Date
              </label>
              <input
                id="bk-date"
                className="input"
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setDate(e.target.value)}
              />
            </div>

            <div className="field">
              <div className="label">Available times</div>
              <div className="slots">
                {center?.slots.map(s => (
                  <button
                    key={s.time}
                    className="slot"
                    disabled={!s.available}
                    aria-pressed={time === s.time}
                    onClick={() => setTime(s.time)}
                    title={s.available ? '' : 'Unavailable'}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
              <div className="hint" style={{ marginTop: 8 }}>
                Times shown as unavailable are already booked.
              </div>
            </div>

            <button className="btn btn--primary btn--block" disabled={!time || submitting} onClick={confirm} style={{ marginTop: 8 }}>
              {submitting ? 'Confirming…' : time ? `Confirm ${date} at ${time}` : 'Select a time to continue'}
            </button>

            <p className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>
              Booking reserves a chair at the centre. Eligibility is confirmed on the day. You can cancel at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
