const BASE = '/api'

export interface Estate {
  id: number
  name: string
  district: string
}

export interface Slot {
  id: number
  estateId: number
  startTime: string
  isBooked: boolean
}

export interface Tenant {
  id: number
  tenancyNumber: string
  name: string
}

export interface Appointment {
  id: number
  status: string
  estate: string
  district: string
  startTime: string
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export const api = {
  getEstates: () => fetch(`${BASE}/estates`).then(json<Estate[]>),

  registerTenant: (payload: {
    tenancyNumber: string
    hkid: string
    name: string
    phone: string
    dateOfBirth: string
  }) =>
    fetch(`${BASE}/tenants/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(json<Tenant>),

  getSlots: (estateId: number) =>
    fetch(`${BASE}/estates/${estateId}/slots?onlyAvailable=true`).then(json<Slot[]>),

  book: (tenantId: number, slotId: number) =>
    fetch(`${BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, slotId }),
    }).then(json<unknown>),

  getAppointments: (tenantId: number) =>
    fetch(`${BASE}/tenants/${tenantId}/appointments`).then(json<Appointment[]>),
}
