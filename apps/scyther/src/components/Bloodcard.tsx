import React from 'react';
import { useScyther } from '../context/ScytherContext';
import { QrCode, Calendar, CheckCircle2 } from 'lucide-react';

const maskId = (id: string | undefined) => {
  if (!id) return 'Not provided';
  if (id.length <= 4) return id;
  return '•••• ' + id.slice(-4);
};

const fmtDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const DonorCard: React.FC<{ onBook: () => void }> = ({ onBook }) => {
  const { donor, bookedAppointment } = useScyther();
  if (!donor) return null;

  return (
    <div className="donorcard">
      <div className="donorcard-strip" />
      <div className="donorcard-hd">
        <div>
          <div className="org">Botswana national blood service</div>
          <div className="title">Donor card</div>
        </div>
        <span className="badge badge--brand">
          {donor.tier >= 3 ? 'Identity verified' : 'Identity not yet verified'}
        </span>
      </div>

      <div className="donorcard-bd">
        <div>
          <div className="name">{donor.fullName}</div>
          <div className="meta-grid">
            <div>
              <div className="meta-k">Donor ID</div>
              <div className="meta-v mono">{donor.id}</div>
            </div>
            <div>
              <div className="meta-k">District</div>
              <div className="meta-v">{donor.cityDistrict}</div>
            </div>
            <div>
              <div className="meta-k">National ID</div>
              <div className="meta-v mono">{maskId(donor.nationalIdNumber)}</div>
            </div>
            <div>
              <div className="meta-k">Last donation</div>
              <div className="meta-v">{donor.lastDonationDate ? fmtDate(donor.lastDonationDate) : 'None recorded'}</div>
            </div>
          </div>
        </div>

        <div className="qr">
          <div className="qr-box">
            <QrCode size={92} strokeWidth={1.2} color="var(--ink)" />
          </div>
          <div className="meta-k" style={{ textAlign: 'center' }}>
            Present at intake
          </div>
        </div>
      </div>

      <div className="donorcard-ft">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="meta-k" style={{ margin: 0 }}>
            Blood group
          </span>
          <span className="bloodgroup" style={{ width: 46, height: 46, fontSize: 20 }}>
            {donor.bloodType}
          </span>
        </div>

        {bookedAppointment ? (
          <span className="status status--safe">
            <CheckCircle2 size={13} />
            Appointment {bookedAppointment.date} · {bookedAppointment.time}
          </span>
        ) : (
          <button className="btn btn--primary" onClick={onBook}>
            <Calendar size={15} />
            Book a donation
          </button>
        )}
      </div>
    </div>
  );
};

export const ImpactPanel: React.FC = () => {
  const { donor } = useScyther();
  if (!donor) return null;
  const units = donor.totalDonations;
  const transfusions = donor.totalDonations * 3;

  return (
    <div className="card">
      <div className="card-hd">
        <h3>Your donation record</h3>
        <span className="dim" style={{ fontSize: 12.5 }}>
          Illustrative figures
        </span>
      </div>
      <div className="card-bd">
        <div className="stat-grid">
          <div className="stat">
            <div className="stat-k">Donations recorded</div>
            <div className="stat-v">{units}</div>
          </div>
          <div className="stat">
            <div className="stat-k">Components produced</div>
            <div className="stat-v">{units}</div>
          </div>
          <div className="stat">
            <div className="stat-k">Transfusions supported</div>
            <div className="stat-v">
              {transfusions}
              <small>est.</small>
            </div>
          </div>
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>
          Each whole-blood donation is separated into components. The number of patients supported depends on clinical
          need and is an estimate, not a recorded outcome.
        </p>
      </div>
    </div>
  );
};
