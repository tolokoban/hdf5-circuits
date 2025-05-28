import React from "react"

import styles from "./Attributes.module.css"

export interface AttributesProps {
    className?: string
    attrs: Record<string, string>
}

export default function Attributes({ className, attrs }: AttributesProps) {
    const keys = Object.keys(attrs)
    if (keys.length === 0) {
        return <div className={styles.empty}>No attributes.</div>
    }
    return (
        <ul className={join(className, styles.attributes)}>
            {keys.map((key) => (
                <li key={key}>
                    <strong>{key}</strong>: {attrs[key]}
                </li>
            ))}
        </ul>
    )
}

function join(...classes: unknown[]): string {
    return classes.filter((cls) => typeof cls === "string").join(" ")
}
