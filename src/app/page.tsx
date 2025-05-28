import React from "react"
import { ViewInputFile, ViewPanel, ViewSpinner } from "@tolokoban/ui"

import { loadHDF5 } from "@/data/data"
import { goto } from "./routes"
import { State } from "@/state"

export default function Page() {
    const [loading, setLoading] = React.useState(false)
    const handleLoad = (files: File[]): void => {
        const [file] = files
        if (!file) return

        setLoading(true)
        loadHDF5(file)
            .then((data) => {
                State.data.value = data
                goto("/data")
            })
            .catch(() => setLoading(false))
    }

    return (
        <ViewPanel
            display="grid"
            placeItems="center"
            fullsize
            position="absolute"
            fontSize="2em"
            color="neutral-1"
        >
            {loading ? (
                <ViewSpinner />
            ) : (
                <ViewInputFile
                    accept=".h5"
                    onLoad={handleLoad}
                    color="primary-5"
                >
                    Load HDF5 file
                </ViewInputFile>
            )}
        </ViewPanel>
    )
}
