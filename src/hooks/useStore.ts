import { useSyncExternalStore } from 'react'
import { snapshot, subscribe } from '@/lib/store'

export function useEmployees() {
  return useSyncExternalStore(subscribe, snapshot.employees, snapshot.employees)
}

export function useDaysOff() {
  return useSyncExternalStore(subscribe, snapshot.daysOff, snapshot.daysOff)
}

export function useSickLeaves() {
  return useSyncExternalStore(subscribe, snapshot.sickLeaves, snapshot.sickLeaves)
}

export function useEmployee(id: string | undefined) {
  const employees = useEmployees()
  return id ? employees.find((e) => e.id === id) ?? null : null
}

export function useStoreStatus() {
  const loading = useSyncExternalStore(subscribe, snapshot.loading, snapshot.loading)
  const hydrated = useSyncExternalStore(subscribe, snapshot.hydrated, snapshot.hydrated)
  const error = useSyncExternalStore(subscribe, snapshot.error, snapshot.error)
  return { loading, hydrated, error }
}
