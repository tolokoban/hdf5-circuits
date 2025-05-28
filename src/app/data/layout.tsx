import React from "react"
import { IconArrowLeft, IconImport, ViewButton, ViewPanel } from "@tolokoban/ui"

import { State } from "@/state"
import { loadHDF5 } from "@/data/data"

export default function LayoutBackground({
    children,
}: {
    children: React.ReactNode
}) {
    const data = State.data.useValue()
    const handleLoadDefaultFile = () => {
        loadHDF5("merged-morphologies.h5").then(
            (data) => (State.data.value = data)
        )
    }
    if (!data) {
        return (
            <ViewPanel display="grid" placeItems="center" color="neutral-5">
                <ViewPanel
                    color="error"
                    padding="L"
                    display="flex"
                    flexDirection="column"
                >
                    <p>There is no file loaded yet...</p>
                    <hr />
                    <ViewButton
                        onClick="#/"
                        variant="text"
                        icon={IconArrowLeft}
                    >
                        Back to main page
                    </ViewButton>
                    <ViewButton
                        onClick={handleLoadDefaultFile}
                        variant="text"
                        icon={IconImport}
                    >
                        Load default example
                    </ViewButton>
                </ViewPanel>
            </ViewPanel>
        )
    }

    return <>{children}</>
}
