import Group from "@/components/Group"
import MorphologyViewer from "@/components/MorphologyViewer"
import { HDF5Group } from "@/data/hdf5"
import { State } from "@/state"
import { ViewPanel, ViewStrip, ViewSwitch } from "@tolokoban/ui"
import { useMemo } from "react"

export default function Page() {
    const data = State.data.useValue()
    const allMorphologiesGroups: HDF5Group[] = useMemo(
        () => extractAllMorphologies(data),
        [data]
    )
    const [groupsToDisplay, setGroupsToDisplay] =
        State.groupsToDisplay.useState()

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
                    <ViewSwitch
                        value={allMorphologiesGroups === groupsToDisplay}
                        onChange={(value) =>
                            value
                                ? setGroupsToDisplay(allMorphologiesGroups)
                                : []
                        }
                    >
                        View whole circuit ({allMorphologiesGroups.length}{" "}
                        neurons)
                    </ViewSwitch>
                    <Group group={data} />
                </ViewPanel>
            </ViewStrip>
            <ViewPanel color="neutral-3" position="relative" fullsize>
                <MorphologyViewer groups={groupsToDisplay} />
            </ViewPanel>
        </ViewStrip>
    )
}

function extractAllMorphologies(data: HDF5Group | null): HDF5Group[] {
    if (!data) return []

    return data.keys
        .map((path) => data.get(path))
        .filter((group) => group.has("points") && group.has("structure"))
}
