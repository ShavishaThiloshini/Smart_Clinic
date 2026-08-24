import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

/* ──────────────────── Types ──────────────────── */
type DoctorSummary = {
  doctorId: number;
  name: string;
  specialization: string | null;
  clinic: string | null;
  consultationFee: number | null;
};

type AvailabilitySlot = {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  status: boolean;
};

type BookingStep = 1 | 2 | 3;

const navigation = [
  { label: 'Dashboard', icon: '⌂', path: '/patient/dashboard' },
  { label: 'Find a doctor', icon: '⌕', path: '/patient/search' },
  { label: 'My appointments', icon: '▣', path: '/patient/appointments' },
  { label: 'Medical records', icon: '▤', path: '#' },
  { label: 'Prescriptions', icon: '▱', path: '#' },
  { label: 'Notifications', icon: '◌', path: '#' },
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/* ──────────────────── Helpers ──────────────────── */
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

function generateSlots(startTime: string, endTime: string, duration: number): string[] {
  const slots: string[] = [];
  let current = toMinutes(startTime);
  const end = toMinutes(endTime);
  while (current + duration <= end) {
    slots.push(fromMinutes(current));
    current += duration;
  }
  return slots;
}

function buildCalendar(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const blanks: null[] = Array(firstDay).fill(null);
  const days: Date[] = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
  return [...blanks, ...days];
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/* ──────────────────── Step Indicator ──────────────────── */
function StepWizard({ step }: { step: BookingStep }) {
  const steps = ['Select Date', 'Select Time', 'Confirm'];
  return (
    <div className="bk-step-wizard" role="list" aria-label="Booking steps">
      {steps.map((label, i) => {
        const num = (i + 1) as BookingStep;
        const state = num < step ? 'done' : num === step ? 'active' : 'future';
        return (
          <div key={label} className="bk-step-item" role="listitem">
            <div className={`bk-step-circle ${state}`} aria-current={state === 'active' ? 'step' : undefined}>
              {state === 'done' ? '✓' : num}
            </div>
            <span className={`bk-step-label ${state}`}>{label}</span>
            {i < steps.length - 1 && <div className={`bk-step-connector ${num < step ? 'done' : ''}`} aria-hidden="true" />}
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────── Main Page ──────────────────── */
export function AppointmentBookingPage() {
  const navigate = useNavigate();
  const { doctorId } = useParams<{ doctorId: string }>();

  const [step, setStep] = useState<BookingStep>(1);
  const [doctor, setDoctor] = useState<DoctorSummary | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [initError, setInitError] = useState('');

  /* Calendar state */
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  /* Time state */
  const [selectedTime, setSelectedTime] = useState('');

  /* Confirm state */
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const patientName = (() => {
    try {
      return JSON.parse(localStorage.getItem('sc_user') || '{}').name || 'Patient';
    } catch {
      return 'Patient';
    }
  })();

  function logout() {
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_user');
    navigate('/login', { replace: true });
  }

  /* Load doctor + availability */
  useEffect(() => {
    if (!doctorId) { setInitError('Invalid doctor.'); setLoadingInit(false); return; }
    const token = localStorage.getItem('sc_token') || '';
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`/api/doctors/${doctorId}`, { headers }).then((r) => r.json()),
      fetch(`/api/doctors/${doctorId}/availability`, { headers }).then((r) => r.json()),
    ])
      .then(([doctorData, availData]) => {
        if (!doctorData.success) { setInitError(doctorData.message || 'Doctor not found.'); return; }
        const d = doctorData.doctor;
        setDoctor({ doctorId: d.doctorId, name: d.name, specialization: d.specialization, clinic: d.clinic, consultationFee: d.consultationFee });
        if (availData.success) {
          setAvailability((availData.availability || []).filter((s: AvailabilitySlot) => s.status));
        }
      })
      .catch(() => setInitError('Unable to load booking data.'))
      .finally(() => setLoadingInit(false));
  }, [doctorId]);

  /* Days with availability */
  const availableDays = useMemo(
    () => new Set(availability.map((s) => s.dayOfWeek)),
    [availability]
  );

  /* Calendar cells for current month */
  const calendarCells = useMemo(() => buildCalendar(calYear, calMonth), [calYear, calMonth]);

  function isDayAvailable(date: Date): boolean {
    const dayName = DAY_NAMES[date.getDay()];
    return date >= today && availableDays.has(dayName);
  }

  /* Slots for selected date */
  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    const dayName = DAY_NAMES[selectedDate.getDay()];
    const dayAvail = availability.filter((s) => s.dayOfWeek === dayName);
    const slots: string[] = [];
    dayAvail.forEach((avail) => {
      generateSlots(avail.startTime, avail.endTime, avail.slotDuration).forEach((t) => slots.push(t));
    });
    return [...new Set(slots)].sort();
  }, [selectedDate, availability]);

  /* Navigation handlers */
  function prevMonth() {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
  }

  function selectDate(date: Date) {
    if (!isDayAvailable(date)) return;
    setSelectedDate(date);
    setSelectedTime('');
  }

  const goToStep2 = useCallback(() => {
    if (selectedDate) setStep(2);
  }, [selectedDate]);

  const goToStep3 = useCallback(() => {
    if (selectedTime) setStep(3);
  }, [selectedTime]);

  async function submitBooking() {
    if (!doctor || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const token = localStorage.getItem('sc_token') || '';
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          doctorId: doctor.doctorId,
          appointmentDate: isoDate(selectedDate),
          startTime: selectedTime,
          reason: reason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.message || 'Booking failed. Please try again.');
        return;
      }
      navigate('/patient/booking-confirmation', { state: { appointment: data.appointment } });
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ──── Render ──── */
  return (
    <main className="patient-shell">
      <aside className="patient-sidebar">
        <img className="patient-logo" src={logo} alt="Smart Clinic" />
        <nav aria-label="Patient navigation">
          {navigation.map((nav, index) => (
            <button
              className={`patient-nav-link ${index === 1 ? 'active' : ''}`}
              key={nav.label}
              type="button"
              onClick={() => nav.path !== '#' && navigate(nav.path)}
            >
              <span aria-hidden="true">{nav.icon}</span>{nav.label}
            </button>
          ))}
        </nav>
        <button className="patient-logout" type="button" onClick={logout}>↪ Sign out</button>
      </aside>

      <section className="patient-content">
        <header className="patient-header">
          <button className="mobile-menu" type="button" aria-label="Open navigation">☰</button>
          <div className="patient-header-spacer" />
          <button className="notification-button" type="button" aria-label="Notifications">♧<span /></button>
          <div
            className="patient-avatar"
            aria-hidden="true"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/patient/profile')}
            title="View Profile"
          >
            {patientName.charAt(0).toUpperCase()}
          </div>
        </header>

        <div className="patient-page">
          {/* Breadcrumb */}
          <nav className="doc-pub-breadcrumb" aria-label="Breadcrumb">
            <button type="button" onClick={() => {
              if (step === 1) navigate(doctor ? `/patient/doctor/${doctor.doctorId}` : '/patient/search');
              else setStep((s) => (s - 1) as BookingStep);
            }}>
              ← {step === 1 ? 'Back to profile' : 'Go back'}
            </button>
          </nav>

          <header className="patient-welcome" style={{ marginBottom: '8px' }}>
            <div>
              <p className="patient-eyebrow">APPOINTMENT BOOKING</p>
              <h1>Book your visit{doctor ? ` with Dr. ${doctor.name}` : ''}</h1>
              {doctor?.specialization && <p style={{ margin: '4px 0 0', color: '#71809a' }}>{doctor.specialization} · {doctor.clinic || 'Smart Clinic'}</p>}
            </div>
          </header>

          {loadingInit && (
            <div className="bk-loading" aria-busy="true">
              <div className="bk-shimmer" />
              <div className="bk-shimmer bk-shimmer-sm" />
            </div>
          )}

          {initError && !loadingInit && (
            <div className="alert-error" style={{ marginTop: '16px' }}>{initError}</div>
          )}

          {!loadingInit && !initError && doctor && (
            <div className="bk-shell">
              <StepWizard step={step} />

              {/* ── STEP 1: SELECT DATE ── */}
              {step === 1 && (
                <div className="bk-panel" aria-label="Step 1: Select date">
                  <div className="bk-panel-head">
                    <h2>Select a date</h2>
                    <p>Highlighted dates have available appointments.</p>
                  </div>

                  <div className="bk-calendar">
                    <div className="cal-nav">
                      <button type="button" className="cal-nav-btn" onClick={prevMonth} aria-label="Previous month">‹</button>
                      <span className="cal-month-label">{MONTH_NAMES[calMonth]} {calYear}</span>
                      <button type="button" className="cal-nav-btn" onClick={nextMonth} aria-label="Next month">›</button>
                    </div>
                    <div className="cal-grid" role="grid" aria-label="Calendar">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                        <div key={d} className="cal-weekday" role="columnheader">{d}</div>
                      ))}
                      {calendarCells.map((date, idx) => {
                        if (!date) return <div key={`blank-${idx}`} className="cal-day cal-blank" aria-hidden="true" />;
                        const available = isDayAvailable(date);
                        const selected = selectedDate ? isoDate(date) === isoDate(selectedDate) : false;
                        const isPast = date < today;
                        const isToday = isoDate(date) === isoDate(today);
                        return (
                          <button
                            key={isoDate(date)}
                            type="button"
                            role="gridcell"
                            className={`cal-day ${available ? 'cal-available' : ''} ${selected ? 'cal-selected' : ''} ${isPast ? 'cal-past' : ''} ${isToday && !selected ? 'cal-today' : ''}`}
                            onClick={() => selectDate(date)}
                            disabled={!available}
                            aria-label={`${isoDate(date)}${available ? ', available' : ', unavailable'}`}
                            aria-selected={selected}
                          >
                            {date.getDate()}
                          </button>
                        );
                      })}
                    </div>

                    <div className="cal-legend" aria-label="Calendar legend">
                      <span><i className="cal-dot cal-dot-available" aria-hidden="true" />Available</span>
                      <span><i className="cal-dot cal-dot-selected" aria-hidden="true" />Selected</span>
                      <span><i className="cal-dot cal-dot-disabled" aria-hidden="true" />Unavailable</span>
                    </div>
                  </div>

                  {selectedDate && (
                    <div className="bk-selected-info" aria-live="polite">
                      <span>Selected: <strong>{selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
                    </div>
                  )}

                  <div className="bk-actions">
                    <button
                      type="button"
                      className="bk-next-btn"
                      onClick={goToStep2}
                      disabled={!selectedDate}
                      id="booking-next-date"
                    >
                      Continue to time selection →
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 2: SELECT TIME ── */}
              {step === 2 && selectedDate && (
                <div className="bk-panel" aria-label="Step 2: Select time">
                  <div className="bk-panel-head">
                    <h2>Select a time slot</h2>
                    <p>
                      Available times for{' '}
                      <strong>{selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
                    </p>
                  </div>

                  {timeSlots.length === 0 ? (
                    <div className="empty-state">
                      <p>No time slots available for this date.</p>
                      <button type="button" className="bk-back-link" onClick={() => setStep(1)}>Choose another date</button>
                    </div>
                  ) : (
                    <div className="bk-slot-grid" role="group" aria-label="Available time slots">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          className={`bk-time-slot ${selectedTime === slot ? 'bk-slot-selected' : ''}`}
                          onClick={() => setSelectedTime(slot)}
                          aria-pressed={selectedTime === slot}
                          aria-label={`Time slot ${formatTime12h(slot)}`}
                        >
                          {formatTime12h(slot)}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="bk-actions">
                    <button type="button" className="bk-back-btn" onClick={() => setStep(1)}>← Back</button>
                    <button
                      type="button"
                      className="bk-next-btn"
                      onClick={goToStep3}
                      disabled={!selectedTime}
                      id="booking-next-time"
                    >
                      Review & confirm →
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: CONFIRM ── */}
              {step === 3 && selectedDate && selectedTime && (
                <div className="bk-panel" aria-label="Step 3: Confirm booking">
                  <div className="bk-panel-head">
                    <h2>Confirm your appointment</h2>
                    <p>Please review your booking details before confirming.</p>
                  </div>

                  <div className="bk-confirm-details">
                    <div className="bk-confirm-row">
                      <span className="bk-confirm-icon" aria-hidden="true">👨‍⚕️</span>
                      <div>
                        <p className="bk-confirm-label">Doctor</p>
                        <p className="bk-confirm-value">Dr. {doctor.name}</p>
                        {doctor.specialization && <p className="bk-confirm-sub">{doctor.specialization}</p>}
                      </div>
                    </div>
                    <div className="bk-confirm-row">
                      <span className="bk-confirm-icon" aria-hidden="true">📅</span>
                      <div>
                        <p className="bk-confirm-label">Date</p>
                        <p className="bk-confirm-value">{selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="bk-confirm-row">
                      <span className="bk-confirm-icon" aria-hidden="true">⏰</span>
                      <div>
                        <p className="bk-confirm-label">Time</p>
                        <p className="bk-confirm-value">{formatTime12h(selectedTime)}</p>
                      </div>
                    </div>
                    {doctor.clinic && (
                      <div className="bk-confirm-row">
                        <span className="bk-confirm-icon" aria-hidden="true">🏥</span>
                        <div>
                          <p className="bk-confirm-label">Clinic</p>
                          <p className="bk-confirm-value">{doctor.clinic}</p>
                        </div>
                      </div>
                    )}
                    {doctor.consultationFee != null && (
                      <div className="bk-confirm-row">
                        <span className="bk-confirm-icon" aria-hidden="true">💰</span>
                        <div>
                          <p className="bk-confirm-label">Consultation fee</p>
                          <p className="bk-confirm-value">Rs. {Number(doctor.consultationFee).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bk-reason-group">
                    <label htmlFor="booking-reason">
                      Reason for visit <span className="bk-optional">(optional)</span>
                    </label>
                    <textarea
                      id="booking-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Briefly describe your symptoms or reason for this appointment..."
                      maxLength={1000}
                      rows={4}
                    />
                    <span className="bk-char-count">{reason.length}/1000</span>
                  </div>

                  {submitError && (
                    <div className="alert-error" aria-live="assertive">{submitError}</div>
                  )}

                  <div className="bk-actions">
                    <button type="button" className="bk-back-btn" onClick={() => setStep(2)} disabled={submitting}>← Back</button>
                    <button
                      type="button"
                      className="bk-confirm-btn"
                      onClick={submitBooking}
                      disabled={submitting}
                      id="booking-confirm-btn"
                    >
                      {submitting ? 'Booking...' : 'Confirm Appointment ✓'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
