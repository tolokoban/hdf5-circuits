import React from "react"

import styles from "./Dataset.module.css"

export interface DatasetProps {
    className?: string
    value?: number[]
}

export default function Dataset({ className, value }: DatasetProps) {
    if (!value) return null
    return (
        <div className={join(className, styles.dataset)}>
            <code>
                [
                {value
                    .slice(0, 16)
                    .map((n) => n.toFixed(3))
                    .join(", ")}
                {value.length > 16 && <span>, ...</span>}]
            </code>
            {value.length > 16 && (
                <div>
                    <strong>{value.length}</strong> elements
                </div>
            )}
        </div>
    )
}

function join(...classes: unknown[]): string {
    return classes.filter((cls) => typeof cls === "string").join(" ")
}
