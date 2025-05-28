import Group from "@/components/Group"
import { State } from "@/state"
import { ViewPanel, ViewStrip } from "@tolokoban/ui"

export default function Page() {
    const data = State.data.useValue()

    if (!data) return null
    return (
        <ViewStrip template="*1" orientation="row">
            <ViewStrip template="*1" orientation="column">
                <ViewPanel color="primary-1" padding="M">
                    <strong>{data.filename}</strong>
                </ViewPanel>
                <ViewPanel
                    color="neutral-3"
                    overflow="auto"
                    padding="S"
                    maxWidth="480px"
                >
                    <Group path="" />
                </ViewPanel>
            </ViewStrip>
            <ViewPanel color="neutral-3">
                Here will come the viewer...
            </ViewPanel>
        </ViewStrip>
    )
}
