/** A not-yet-built section: the real intro copy from the config, inside the real section
 * structure — never a line floating in space. */
import { SectionIntro } from '../../ui/SectionIntro'
import { useAppStore } from '../storeContext'

export function StubSection({ sectionId }: { sectionId: string }) {
  const { config } = useAppStore()
  const section = config.sections.find((s) => s.id === sectionId)!
  return (
    <div className="flex flex-col gap-8">
      <SectionIntro section={section} />
      <p className="text-[14px] text-muted">
        This step is being built — Continue walks the flow in the meantime.
      </p>
    </div>
  )
}
