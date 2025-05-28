import { ViewButton, ViewPanel } from "@tolokoban/ui"
import { makeGoto } from "./routes"

export default function Page() {
    return (
        <ViewPanel
            display="grid"
            placeItems="start end"
            fullsize
            position="absolute"
            fontSize="8em"
        >
            <ViewButton onClick={makeGoto("/next")}>Next page</ViewButton>
        </ViewPanel>
    )
}
