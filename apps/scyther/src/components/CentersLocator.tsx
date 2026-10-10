import React, { useMemo, useState } from 'react';
import { useScyther } from '../context/ScytherContext';
import { DonationMap, CATEGORY_META, type MapPoint, type MapCategory } from './DonationMap';
import { BW_HEALTH_FACILITIES } from '../data/bwHealthFacilities';
import { haversineKm, formatKm, formatDuration, drivingEstimate } from '../lib/geo';
import {
  MapPin,
  Clock,
  CheckCircle2,
  CalendarX2,
  LocateFixed,
  Info,
  Car,
  Hospital
} from 'lucide-react';

type ServiceKey = 'hospital' | 'clinic' | 'pharmacy' | 'doctors';

const SERVICE_KEYS: ServiceKey[] = ['hospital', 'clinic', 'pharmacy', 'doctors'];

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export const Booking: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { centers, donor, bookAppointment, bookedAppointment, cancelAppointment } = useScyther();

  const [layers, setLayers] = useState<Record<ServiceKey, boolean>>({
    hospital: true,
    clinic: true,
    pharmacy: false,
    doctors: false
  });
  const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(centers[0]?.id ?? null);
  const [centerId, setCenterId] = useState(centers[0]?.id ?? '');
  const [date, setDate] = useState(tomorrow());
  const [time, setTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [drive, setDrive] = useState<{ km: number; min: number } | null>(null);
  const [driveMsg, setDriveMsg] = useState<string | null>(null);
  const [driveBusy, setDriveBusy] = useState(false);

  const locate = () => {
    setGeoMsg(null);
    if (!('geolocation' in navigator)) {
      setGeoMsg('Location is not available in this browser.');
      return;
    }
    setGeoMsg('Requesting your location…');
    navigator.geolocation.getCurrentPosition(
      p => {
        setUserPos({ lat: p.coords.latitude, lon: p.coords.longitude });
        setGeoMsg(null);
      },
      () => setGeoMsg('Could not get your location. You can still browse centres on the map.'),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const points: MapPoint[] = useMemo(() => {
    const p: MapPoint[] = centers.map(c => ({
      id: c.id,
      name: c.name,
      category: 'donation' as MapCategory,
      lat: c.lat,
      lon: c.lon,
      sub: c.hours
    }));
    SERVICE_KEYS.forEach(k => {
      if (!layers[k]) return;
      BW_HEALTH_FACILITIES.filter(f => f.category === k).forEach(f => {
        p.push({ id: f.id, name: f.name, category: k, lat: f.lat, lon: f.lon, sub: f.city });
      });
    });
    return p;
  }, [centers, layers]);

  const distanceTo = (lat: number, lon: number) =>
    userPos ? haversineKm(userPos, { lat, lon }) : null;

  const sortedCenters = useMemo(() => {
    const arr = [...centers];
    if (userPos) {
      arr.sort((a, b) => haversineKm(userPos, a) - haversineKm(userPos, b));
    }
    return arr;
  }, [centers, userPos]);

  const nearbyServices = useMemo(() => {
    const active = SERVICE_KEYS.filter(k => layers[k]);
    const arr = BW_HEALTH_FACILITIES.filter(f => active.includes(f.category as ServiceKey));
    if (userPos) arr.sort((a, b) => haversineKm(userPos, a) - haversineKm(userPos, b));
    return arr;
  }, [layers, userPos]);

  const center = centers.find(c => c.id === centerId) ?? centers[0];
  const selected = points.find(p => p.id === selectedId) ?? null;
  const selectedIsCenter = selected?.category === 'donation';

  const confirm = async () => {
    if (!time || !center) return;
    setSubmitting(true);
    try {
      await bookAppointment(center.id, date, time);
    } finally {
      setSubmitting(false);
    }
  };

  const getDrive = async () => {
    if (!userPos || !selected) return;
    setDriveBusy(true);
    setDriveMsg(null);
    setDrive(null);
    const r = await drivingEstimate(userPos, { lat: selected.lat, lon: selected.lon });
    setDriveBusy(false);
    if (r) setDrive(r);
    else setDriveMsg('Road estimate unavailable right now. Showing the straight-line distance instead.');
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">Donation centres &amp; health services</div>
        <h1 className="page-title">Find a donation centre</h1>
        <p className="page-sub">
          Explore donation centres and nearby health services across Botswana. Share your location to see distances and
          the nearest options first.
        </p>
      </div>

      <div className="card">
        <div className="card-hd" style={{ flexWrap: 'wrap', gap: 12 }}>
          <h3>Map of Botswana</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn--outline" onClick={locate}>
              <LocateFixed size={15} />
              {userPos ? 'Location shared' : 'Use my location'}
            </button>
          </div>
        </div>
        <div className="card-bd">
          <DonationMap
            points={points}
            userPos={userPos}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {geoMsg && (
            <div className="notice" style={{ marginTop: 12 }}>
              <Info className="notice-icon" size={15} />
              <span>{geoMsg}</span>
            </div>
          )}

          <div className="map-toolbar">
            <span className="meta-k" style={{ margin: 0 }}>
              Show on map
            </span>
            <span className="badge badge--brand">
              <span className="bc-pin-dot" style={{ background: CATEGORY_META.donation.color, width: 10, height: 10, border: '1.5px solid #fff' }} />
              Donation centre
            </span>
            {SERVICE_KEYS.map(k => (
              <label key={k} className="layer-toggle">
                <input
                  type="checkbox"
                  checked={layers[k]}
                  onChange={e => setLayers(p => ({ ...p, [k]: e.target.checked }))}
                />
                <span className="bc-pin-dot" style={{ background: CATEGORY_META[k].color, width: 10, height: 10, border: '1.5px solid #fff' }} />
                {CATEGORY_META[k].label}
              </label>
            ))}
          </div>

          <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            Map tiles &copy; OpenStreetMap contributors. Facility points are from OpenStreetMap and are not an official
            registry — treat them as indicative.
          </p>
        </div>
      </div>

      {selected && (
        <div className="card">
          <div className="card-bd" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <div className="meta-k">{CATEGORY_META[selected.category].label}</div>
              <div style={{ fontWeight: 600, fontSize: 16, marginTop: 2 }}>{selected.name}</div>
              {selected.sub && <div className="muted" style={{ fontSize: 13 }}>{selected.sub}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              {userPos ? (
                <>
                  <div className="meta-k">Approx. straight-line</div>
                  <div className="mono" style={{ fontSize: 20, fontWeight: 600 }}>
                    {formatKm(distanceTo(selected.lat, selected.lon)!)}
                  </div>
                </>
              ) : (
                <span className="muted" style={{ fontSize: 12.5 }}>
                  Share your location for a distance estimate
                </span>
              )}
            </div>
          </div>
          {userPos && (
            <div className="card-ft">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn--outline" onClick={getDrive} disabled={driveBusy}>
                  <Car size={15} />
                  {driveBusy ? 'Estimating…' : 'Estimate road distance'}
                </button>
                {drive && (
                  <span className="status status--info">
                    {formatKm(drive.km)} by road · about {formatDuration(drive.min)}
                  </span>
                )}
                {driveMsg && (
                  <span className="muted" style={{ fontSize: 12.5 }}>
                    {driveMsg}
                  </span>
                )}
              </div>
              <span className="dim" style={{ fontSize: 11.5 }}>
                Road estimates use a public routing service — indicative only.
              </span>
            </div>
          )}
        </div>
      )}

      <div className="grid-2">
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-hd">
            <h3>Donation centres</h3>
            <span className="dim" style={{ fontSize: 12.5 }}>
              {userPos ? 'Nearest first' : `${centers.length} example sites`}
            </span>
          </div>
          <div className="card-bd stack" style={{ gap: 10 }}>
            {sortedCenters.map(c => {
              const d = distanceTo(c.lat, c.lon);
              return (
                <button
                  key={c.id}
                  className="choose"
                  aria-pressed={c.id === centerId}
                  onClick={() => {
                    setCenterId(c.id);
                    setSelectedId(c.id);
                    setTime(null);
                    setDrive(null);
                    setDriveMsg(null);
                  }}
                >
                  <div className="avatar avatar--brand" style={{ marginTop: 2 }}>
                    {c.district.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="choose-title">{c.name}</div>
                    <div className="choose-sub" style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
                      <MapPin size={13} /> {c.address}
                    </div>
                    <div className="choose-sub" style={{ display: 'inline-flex', gap: 5, alignItems: 'center', marginTop: 4 }}>
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
                  {d !== null && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div className="mono" style={{ fontWeight: 600 }}>
                        {formatKm(d)}
                      </div>
                      <div className="dim" style={{ fontSize: 11 }}>
                        away
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
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
                  >
                    {s.time}
                  </button>
                ))}
              </div>
              <div className="hint" style={{ marginTop: 8 }}>
                Times shown as unavailable are already booked.
              </div>
            </div>

            <button
              className="btn btn--primary btn--block"
              disabled={!time || submitting}
              onClick={confirm}
              style={{ marginTop: 8 }}
            >
              {submitting ? 'Confirming…' : time ? `Confirm ${date} at ${time}` : 'Select a time to continue'}
            </button>

            {bookedAppointment && (
              <div className="notice notice--safe" style={{ marginTop: 14 }}>
                <CheckCircle2 className="notice-icon" size={15} />
                <span>
                  Booked: {bookedAppointment.centerName} · {bookedAppointment.date} at {bookedAppointment.time}
                </span>
              </div>
            )}

            <p className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>
              Booking reserves a chair at the centre. Eligibility is confirmed on the day.
            </p>
          </div>
        </div>
      </div>

      {SERVICE_KEYS.some(k => layers[k]) && (
        <div className="card">
          <div className="card-hd">
            <h3>Nearby health services</h3>
            <span className="dim" style={{ fontSize: 12.5 }}>
              {userPos ? 'Nearest first' : 'Enable your location to sort by distance'}
            </span>
          </div>
          <div className="card-bd">
            <div className="service-list">
              {nearbyServices.slice(0, 18).map(f => {
                const d = distanceTo(f.lat, f.lon);
                return (
                  <button key={f.id} className="service-row" onClick={() => setSelectedId(f.id)}>
                    <span
                      className="bc-pin-dot"
                      style={{ background: CATEGORY_META[f.category as MapCategory].color, width: 10, height: 10, border: '1.5px solid #fff', flexShrink: 0 }}
                    />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.name}
                      </span>
                      <span className="muted" style={{ fontSize: 12 }}>
                        {CATEGORY_META[f.category as MapCategory].label}
                        {f.city ? ` · ${f.city}` : ''}
                      </span>
                    </span>
                    {d !== null && (
                      <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, flexShrink: 0 }}>
                        {formatKm(d)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {nearbyServices.length > 18 && (
              <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
                Showing the nearest 18 of {nearbyServices.length} matching services.
              </p>
            )}
          </div>
        </div>
      )}

      {bookedAppointment && (
        <div className="card">
          <div className="card-bd" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
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
                <Hospital size={15} />
                View my donations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
