import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SLOT_DURATIONS = [15, 20, 30, 45, 60];

type Slot = {
  id?: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  status: boolean;
};

function emptySlot(day: string): Slot {
  return { dayOfWeek: day, startTime: '09:00', endTime: '17:00', slotDuration: 30, status: true };
}

export function AvailabilityPage() {
  const navigate = useNavigate();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });

  const initials = (() => {
    const u = JSON.parse(localStorage.getItem('sc_user') || '{}');
    return (u.name || '').split(' ').filter(Boolean).map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() || 'DR';
  })();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/doctor/availability', {
          headers: { Authorization: `Bearer ${localStorage.getItem('sc_token') || ''}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setSlots(data.availability);
        } else if (res.status !== 404) {
          setNotice({ type: 'error', text: data.message || 'Unable to load availability.' });
        }
      } catch {
        setNotice({ type: 'error', text: 'Unable to reach the availability service.' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function addSlot(day: string) {
    setSlots(prev => [...prev, emptySlot(day)]);
  }

  function removeSlot(index: number) {
    setSlots(prev => prev.filter((_, i) => i !== index));
  }

  function updateSlot(index: number, field: keyof Slot, value: string | number | boolean) {
    setSlots(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }

  async function save() {
    // Validate: end time must be after start time
    for (const slot of slots) {
      if (slot.startTime >= slot.endTime) {
        setNotice({ type: 'error', text: `End time must be after start time for ${slot.dayOfWeek}.` });
        return;
      }
    }
    setSaving(true);
    setNotice({ type: '', text: '' });
    try {
      const res = await fetch('/api/doctor/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sc_token') || ''}`
        },
        body: JSON.stringify({ availability: slots })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save.');
      setSlots(data.availability);
      setNotice({ type: 'success', text: 'Availability saved successfully.' });
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save.' });
    } finally {
      setSaving(false);
    }
  }

  function signOut() {
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_user');
    navigate('/login', { replace: true });
  }

  const slotsByDay = DAYS.map(day => ({
    day,
    slots: slots.map((s, i) => ({ ...s, _index: i })).filter(s => s.dayOfWeek === day)
  }));

  return (
    <main className="doctor-profile-shell">
      {/* Sidebar */}
      <aside className="doctor-profile-sidebar">
        <img src={logo} alt="Smart Clinic" />
        <p className="doctor-profile-role">DOCTOR PORTAL</p>
        <nav aria-label="Doctor navigation">
          <button type="button" onClick={() => navigate('/doctor/profile')}>My profile</button>
          <button type="button" onClick={() => navigate('/doctor/prescriptions')}>Prescriptions</button>
          <button type="button" disabled>Appointments</button>
          <button type="button" disabled>Patients</button>
          <button type="button" className="avail-nav-active" onClick={() => navigate('/doctor/availability')}>Availability</button>
        </nav>
        <button className="doctor-signout" type="button" onClick={signOut}>Sign out</button>
      </aside>

      {/* Content */}
      <section className="doctor-profile-content">
        <header className="doctor-profile-header">
          <span>Availability settings</span>
          <div className="doctor-avatar">{initials}</div>
        </header>

        <div className="doctor-profile-page">
          <p className="doctor-profile-kicker">SCHEDULE MANAGEMENT</p>
          <h1>My Availability</h1>
          <p className="doctor-profile-intro">Set your weekly working hours and appointment slot durations so patients can book at the right times.</p>

          {notice.text && (
            <div className={`doctor-notice ${notice.type}`} role="alert">{notice.text}</div>
          )}

          {loading ? (
            <div className="avail-loading">
              <div className="avail-shimmer" />
              <div className="avail-shimmer" />
              <div className="avail-shimmer" />
            </div>
          ) : (
            <div className="avail-wrapper">
              {slotsByDay.map(({ day, slots: daySlots }) => (
                <article key={day} className="avail-day-card">
                  <header className="avail-day-header">
                    <div className="avail-day-label">
                      <span className={`avail-day-dot ${daySlots.length > 0 ? 'active' : ''}`} />
                      <strong>{day}</strong>
                      <span className="avail-slot-count">
                        {daySlots.length === 0 ? 'No slots' : `${daySlots.length} slot${daySlots.length > 1 ? 's' : ''}`}
                      </span>
                    </div>
                    <button type="button" className="avail-add-btn" onClick={() => addSlot(day)}>
                      + Add slot
                    </button>
                  </header>

                  {daySlots.length === 0 ? (
                    <p className="avail-empty">No working hours set for {day}.</p>
                  ) : (
                    <div className="avail-slot-list">
                      {daySlots.map((slot) => (
                        <div key={slot._index} className={`avail-slot-row ${slot.status ? '' : 'disabled-slot'}`}>
                          <div className="avail-slot-times">
                            <label className="avail-label">
                              Start
                              <input
                                type="time"
                                value={slot.startTime}
                                onChange={e => updateSlot(slot._index, 'startTime', e.target.value)}
                                className="avail-time-input"
                              />
                            </label>
                            <span className="avail-arrow">→</span>
                            <label className="avail-label">
                              End
                              <input
                                type="time"
                                value={slot.endTime}
                                onChange={e => updateSlot(slot._index, 'endTime', e.target.value)}
                                className="avail-time-input"
                              />
                            </label>
                            <label className="avail-label">
                              Slot (min)
                              <select
                                value={slot.slotDuration}
                                onChange={e => updateSlot(slot._index, 'slotDuration', Number(e.target.value))}
                                className="avail-select"
                              >
                                {SLOT_DURATIONS.map(d => (
                                  <option key={d} value={d}>{d} min</option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <div className="avail-slot-actions">
                            <label className="avail-toggle" title="Enable / Disable slot">
                              <input
                                type="checkbox"
                                checked={slot.status}
                                onChange={e => updateSlot(slot._index, 'status', e.target.checked)}
                              />
                              <span className="avail-toggle-track">
                                <span className="avail-toggle-thumb" />
                              </span>
                              <span className="avail-toggle-label">{slot.status ? 'Active' : 'Off'}</span>
                            </label>
                            <button
                              type="button"
                              className="avail-remove-btn"
                              aria-label={`Remove slot for ${day}`}
                              onClick={() => removeSlot(slot._index)}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}

              <footer className="avail-footer">
                <p className="avail-tip">✦ Changes apply immediately to new bookings after saving.</p>
                <div className="avail-footer-actions">
                  <button type="button" className="doctor-cancel" onClick={() => navigate('/doctor/profile')}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="doctor-save"
                    disabled={saving}
                    onClick={save}
                  >
                    {saving ? 'Saving...' : 'Save availability'}
                  </button>
                </div>
              </footer>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
