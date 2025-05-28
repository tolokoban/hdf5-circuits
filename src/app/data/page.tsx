import Group from "@/components/Group"
import MorphologyViewer from "@/components/MorphologyViewer"
import { State } from "@/state"
import { ViewPanel, ViewStrip } from "@tolokoban/ui"

export default function Page() {
    const data = State.data.useValue()
    const groupToDisplay = State.groupToDisplay.useValue()

    if (!data) return null
    return (
        <ViewStrip template="*1" orientation="row">
            <ViewStrip template="*1" orientation="column">
                <ViewPanel color="primary-1" padding="M">
                    <strong>{data.name}</strong>
                </ViewPanel>
                <ViewPanel
                    color="neutral-3"
                    overflow="auto"
                    padding="S"
                    maxWidth="480px"
                >
                    <Group group={data} />
                </ViewPanel>
            </ViewStrip>
            <ViewPanel color="neutral-3" position="relative" fullsize>
                <MorphologyViewer group={groupToDisplay} />
            </ViewPanel>
        </ViewStrip>
    )
}
