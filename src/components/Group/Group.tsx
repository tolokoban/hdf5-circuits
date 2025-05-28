import React from "react"

import styles from "./Group.module.css"
import { State } from "@/state"
import Attributes from "../Attributes"
import Dataset from "../Dataset"

export interface GroupProps {
    className?: string
    path: string
}

export default function Group({ className, path }: GroupProps) {
    const data = State.data.useValue()

    if (!data) return null
    return (
        <details className={join(className, styles.group)} open={path === ""}>
            <summary>{path.split("/").at(-1) || <strong>ROOT</strong>}</summary>
            <Dataset value={data.value(path)} />
            <div className={styles.children}>
                <Attributes attrs={data.attrs(path)} />
                {data.keys(path).map((key) => (
                    <Group key={key} path={[path, key].join("/")} />
                ))}
            </div>
        </details>
    )
}

function join(...classes: unknown[]): string {
    return classes.filter((cls) => typeof cls === "string").join(" ")
}
