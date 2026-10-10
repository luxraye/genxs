import React, { useState } from 'react';
import { useScyther } from '../context/ScytherContext';
import { CheckCircle2, XCircle, RotateCcw, Calendar, ShieldCheck, Info } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  detail: string;
  /** Answer that keeps the donor eligible. */
  eligibleAnswer: boolean;
  /** Days of deferral applied when the answer is not the eligible one. */
  deferDays: number;
}

const QUESTIONS: Question[] = [
  {
    id: 'age',
    text: 'Are you aged 17 to 65?',
    detail: 'Standard age range for whole-blood donation.',
    eligibleAnswer: true,
    deferDays: 0
  },
  {
    id: 'weight',
    text: 'Do you weigh at least 50 kg?',
    detail: 'A minimum weight applies to the volume collected.',
    eligibleAnswer: true,
    deferDays: 0
  },
  {
    id: 'well',
    text: 'Are you feeling well today?',
    detail: 'No fever, cold, cough or other active infection.',
    eligibleAnswer: true,
    deferDays: 7
  },
  {
    id: 'tattoo',
    text: 'Have you had a tattoo or piercing in the last 6 months?',
    detail: 'A window period applies for hepatitis screening.',
    eligibleAnswer: false,
    deferDays: 180
  },
  {
    id: 'meds',
    text: 'Are you taking antibiotics or malaria treatment now?',
    detail: 'A clearance interval applies after the course ends.',
    eligibleAnswer: false,
    deferDays: 7
  },
  {
    id: 'interval',
    text: 'Have you donated whole blood in the last 56 days?',
    detail: 'A minimum interval applies between whole-blood donations.',
    eligibleAnswer: false,
    deferDays: 56
  }
];

export const EligibilityCheck: React.FC<{ onBook: () => void }> = ({ onBook }) => {
  const { donor } = useScyther();
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!donor) return null;

  const allAnswered = QUESTIONS.every(q => answers[q.id] !== undefined);
  const blocking = QUESTIONS.filter(q => answers[q.id] !== undefined && answers[q.id] !== q.eligibleAnswer);
  const isEligible = blocking.length === 0;

  const nextEligible = () => {
    const days = Math.max(...blocking.map(q => q.deferDays), 0);
    if (days === 0) return null;
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div className="card">
      <div className="card-hd">
        <h3>Can you donate today?</h3>
        <span className="badge">
          <ShieldCheck size={13} />
          Self-check
        </span>
      </div>

      <div className="card-bd">
        {submitted ? (
          <div className={`notice ${isEligible ? 'notice--safe' : 'notice--watch'}`} style={{ padding: 18 }}>
            <span className="notice-icon">
              {isEligible ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            </span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15.5 }}>
                {isEligible ? `You appear eligible to donate, ${donor.fullName.split(' ')[0]}.` : 'A temporary deferral applies.'}
              </div>
              <p style={{ fontSize: 13.5, marginTop: 6 }}>
                {isEligible
                  ? 'Your answers meet the standard donor health questions. Please book a slot — the collection team will confirm your eligibility on the day.'
                  : `One or more answers require a waiting period. Based on the longest applicable interval, you would be eligible again from ${nextEligible()}. You can retake this check after that date.`}
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                {isEligible && (
                  <button className="btn btn--primary" onClick={onBook}>
                    <Calendar size={15} />
                    Book a donation
                  </button>
                )}
                <button className="btn btn--outline" onClick={reset}>
                  <RotateCcw size={15} />
                  Start again
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="muted" style={{ fontSize: 13.5, marginBottom: 18 }}>
              Six quick questions based on the standard donor health questionnaire. This is a preliminary self-check —
              the final decision is made by the collection team on the day.
            </p>

            <div>
              {QUESTIONS.map(q => {
                const answer = answers[q.id];
                return (
                  <div className="row" key={q.id}>
                    <div style={{ maxWidth: '62%' }}>
                      <div className="row-k">{q.text}</div>
                      <div className="row-sub">{q.detail}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn"
                        aria-pressed={answer === true}
                        style={{
                          borderColor: answer === true ? 'var(--safe)' : 'var(--border-2)',
                          background: answer === true ? 'var(--safe-tint)' : 'var(--surface)',
                          color: answer === true ? 'var(--safe)' : 'var(--ink)'
                        }}
                        onClick={() => setAnswers(p => ({ ...p, [q.id]: true }))}
                      >
                        Yes
                      </button>
                      <button
                        className="btn"
                        aria-pressed={answer === false}
                        style={{
                          borderColor: answer === false ? 'var(--stop)' : 'var(--border-2)',
                          background: answer === false ? 'var(--stop-tint)' : 'var(--surface)',
                          color: answer === false ? 'var(--stop)' : 'var(--ink)'
                        }}
                        onClick={() => setAnswers(p => ({ ...p, [q.id]: false }))}
                      >
                        No
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <button className="btn btn--primary" disabled={!allAnswered} onClick={() => setSubmitted(true)}>
                Check my eligibility
              </button>
            </div>
          </>
        )}

        <div className="notice" style={{ marginTop: 18 }}>
          <Info className="notice-icon" size={15} />
          <span style={{ fontSize: 12.5 }}>
            Your answers are used only for this check and are not added to your donor record.
          </span>
        </div>
      </div>
    </div>
  );
};
