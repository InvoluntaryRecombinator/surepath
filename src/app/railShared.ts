import { draftCounts } from './draft'

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
