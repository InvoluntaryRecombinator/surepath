/** A not-yet-built section: the real intro copy from the config, and nothing invented. */
import { SectionIntro } from '../../ui/SectionIntro'
import { useAppStore } from '../store'

export function StubSection({ sectionId }: { sectionId: string }) {
  const { config } = useAppStore()
  const section = config.sections.find((s) => s.id === sectionId)!
  return (
    <>
      <SectionIntro section={section} />
      <p className="text-[14px] text-muted">This step is being built.</p>
    </>
  )
}
