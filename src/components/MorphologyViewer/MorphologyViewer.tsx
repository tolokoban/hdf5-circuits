import React from "react"

import styles from "./MorphologyViewer.module.css"
import { HDF5Group } from "@/data/hdf5"
import { usePainterManager } from "./painter/painter-manager"

export interface MorphologyViewerProps {
    className?: string
    groups: HDF5Group[]
}

export default function MorphologyViewer({
    className,
    groups,
}: MorphologyViewerProps) {
    const manager = usePainterManager()
    React.useEffect(() => {
        manager.groups = groups
    }, [groups])
    const handleCanvasMount = (canvas: HTMLCanvasElement | null) => {
        manager.canvas = canvas
    }

    return (
        <div className={join(className, styles.morphologyViewer)}>
            <canvas ref={handleCanvasMount}></canvas>
        </div>
    )
}

function join(...classes: unknown[]): string {
    return classes.filter((cls) => typeof cls === "string").join(" ")
}
