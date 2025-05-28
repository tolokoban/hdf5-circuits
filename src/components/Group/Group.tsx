import React from "react"

import { State } from "@/state"
import Attributes from "../Attributes"
import Dataset from "../Dataset"
import { HDF5Group } from "@/data/hdf5"

import styles from "./Group.module.css"
import { ViewSwitch } from "@tolokoban/ui"

export interface GroupProps {
    className?: string
    group: HDF5Group | null
}

export default function Group({ className, group }: GroupProps) {
    const [groupToDisplay, setGroupToDisplay] = State.groupToDisplay.useState()
    if (!group) return null

    const path = group.name
    const isMorphology = group.has("points") && group.has("structure")
    return (
        <details className={join(className, styles.group)} open={path === ""}>
            <summary>{path.split("/").at(-1) || <strong>ROOT</strong>}</summary>
            <div className={styles.children}>
                {isMorphology && (
                    <ViewSwitch
                        value={groupToDisplay?.name === group.name}
                        onChange={(value) =>
                            setGroupToDisplay(value ? group : null)
                        }
                    >
                        Show this morphology
                    </ViewSwitch>
                )}
                <Dataset value={group.value} />
                <Attributes attrs={group.attrs} />
                {group.keys.map((key) => (
                    <Group key={key} group={group.get(key)} />
                ))}
            </div>
        </details>
    )
}

function join(...classes: unknown[]): string {
    return classes.filter((cls) => typeof cls === "string").join(" ")
}
