import { commit } from './store'
import type { WaterLog, WaterSettings } from './types'

const now = () => new Date().toISOString()

export function saveWaterSettings(settings: Omit<WaterSettings, 'updatedAt'>) {
  const editedAt = now()
  const saved: WaterSettings = { ...settings, updatedAt: editedAt }
  commit(
    (current) => ({
      ...current,
      waterSettings: [...current.waterSettings.filter((item) => item.id !== saved.id), saved],
    }),
    [{ method: 'PUT', path: `/water-settings/${saved.id}`, body: { ...saved, editedAt } }],
  )
}

export function saveWaterLog(log: WaterLog) {
  commit((current) => ({ ...current, waterLogs: [...current.waterLogs, log] }), [
    { method: 'PUT', path: `/water-logs/${log.id}`, body: { ...log, editedAt: now() } },
  ])
}

/** Some da tela na hora. O `DELETE` só vai para a fila quando o prazo de desfazer acaba. */
export function hideWaterLog(log: WaterLog) {
  commit(
    (current) => ({ ...current, waterLogs: current.waterLogs.filter((item) => item.id !== log.id) }),
    [],
  )
}

export function restoreWaterLog(log: WaterLog) {
  commit((current) => ({ ...current, waterLogs: [...current.waterLogs, log] }), [])
}

export function deleteWaterLog(log: WaterLog) {
  commit((current) => current, [{ method: 'DELETE', path: `/water-logs/${log.id}` }])
}
