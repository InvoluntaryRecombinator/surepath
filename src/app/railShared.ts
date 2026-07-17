import { draftCounts } from './draft'

export function downloadJson(filename: string, data: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const DELETE_CONFIRM =
  'We never store your information on our servers — it stays on this computer while ' +
  'you work.\n\nThis will remove everything you have entered from this computer, so ' +
  'nothing is left behind.\n\nIf you want to pick up where you left off later, download ' +
  'your progress file first (Cancel, then "Save my progress").\n\nDelete everything from ' +
  'this computer?'

export function formatCounter(counts: ReturnType<typeof draftCounts>) {
  const recordsLabel =
    counts.records === 1
      ? counts.deferrals === 1
        ? 'deferred adjudication'
        : 'conviction'
      : counts.deferrals > 0
        ? 'convictions & deferrals'
        : 'convictions'

  return (
    `${counts.incidents} ${counts.incidents === 1 ? 'incident' : 'incidents'} · ` +
    `${counts.records} ${recordsLabel}`
  )
}
