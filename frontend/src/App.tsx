import { useEffect, useState } from 'react'
import { api, type Appointment, type Estate, type Slot, type Tenant } from './api'
import './App.css'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function App() {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [estates, setEstates] = useState<Estate[]>([])
  const [selectedEstate, setSelectedEstate] = useState<number | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [form, setForm] = useState({
    tenancyNumber: 'PRH-1001',
    hkid: 'A1234567',
    name: 'Chan Tai Man',
    phone: '51234567',
    dateOfBirth: '1980-05-20',
  })

  useEffect(() => {
    api.getEstates().then(setEstates).catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (selectedEstate != null) {
      api.getSlots(selectedEstate).then(setSlots).catch((e) => setError(e.message))
    }
  }, [selectedEstate])

  async function refreshAppointments(tenantId: number) {
    setAppointments(await api.getAppointments(tenantId))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const t = await api.registerTenant(form)
      setTenant(t)
      setMessage(`Signed in as ${t.name} (tenancy ${t.tenancyNumber}).`)
      await refreshAppointments(t.id)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function handleBook(slotId: number) {
    if (!tenant) return
    setError(null)
    try {
      await api.book(tenant.id, slotId)
      setMessage('Appointment booked! You only need one on-site visit.')
      if (selectedEstate != null) setSlots(await api.getSlots(selectedEstate))
      await refreshAppointments(tenant.id)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Housing Department Appointment Booking</h1>
        <p className="subtitle">Well-off Tenants Policy — income &amp; asset declaration</p>
      </header>

      {error && <div className="banner error">{error}</div>}
      {message && <div className="banner success">{message}</div>}

      {!tenant ? (
        <section className="card">
          <h2>1. Sign in</h2>
          <form onSubmit={handleRegister} className="grid">
            <label>
              Tenancy number
              <input
                value={form.tenancyNumber}
                onChange={(e) => setForm({ ...form, tenancyNumber: e.target.value })}
                required
              />
            </label>
            <label>
              HKID
              <input
                value={form.hkid}
                onChange={(e) => setForm({ ...form, hkid: e.target.value })}
                required
              />
            </label>
            <label>
              Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label>
              Phone
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <label>
              Date of birth
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              />
            </label>
            <button type="submit" className="primary">
              Sign in
            </button>
          </form>
        </section>
      ) : (
        <>
          <section className="card">
            <h2>2. Choose your estate office</h2>
            <div className="estates">
              {estates.map((est) => (
                <button
                  key={est.id}
                  className={selectedEstate === est.id ? 'chip active' : 'chip'}
                  onClick={() => setSelectedEstate(est.id)}
                >
                  {est.name}
                  <span className="district">{est.district}</span>
                </button>
              ))}
            </div>
          </section>

          {selectedEstate != null && (
            <section className="card">
              <h2>3. Pick an available slot</h2>
              {slots.length === 0 ? (
                <p>No available slots for this estate.</p>
              ) : (
                <div className="slots">
                  {slots.map((slot) => (
                    <button key={slot.id} className="slot" onClick={() => handleBook(slot.id)}>
                      {formatTime(slot.startTime)}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="card">
            <h2>My appointments</h2>
            {appointments.length === 0 ? (
              <p>No appointments booked yet.</p>
            ) : (
              <ul className="appointments">
                {appointments.map((a) => (
                  <li key={a.id}>
                    <strong>{a.estate}</strong> ({a.district}) — {formatTime(a.startTime)}
                    <span className="status">{a.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default App
