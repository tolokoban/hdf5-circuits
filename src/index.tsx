import React from "react"
import { createRoot } from "react-dom/client"
import { ModalProvider, Theme } from "@tolokoban/ui"

import App from "./app"

import "./index.css"
import { useLang } from "./lang"

function Launcher() {
    const [, setLang] = useLang()
    React.useEffect(() => {
        // The lang can be passed as argument from another site.
        const args = new URLSearchParams(window.location.search)
        const arg = args.get("lang")
        if (typeof arg === "string" && arg.length > 1) {
            setLang(arg)
        }
        // Remove splash screen.
        removeSplashScreen()
    }, [setLang])
    return (
        <React.StrictMode>
            <ModalProvider>
                <App />
            </ModalProvider>
        </React.StrictMode>
    )
}

function start() {
    Theme.apply()
    const container = document.getElementById("app") as HTMLElement
    const root = createRoot(container)
    root.render(<Launcher />)
}

function removeSplashScreen() {
    const SPLASH_VANISHING_DELAY = 900
    const splash = document.getElementById("splash")
    if (!splash) return

    splash.classList.add("vanish")
    window.setTimeout(() => {
        const parent = splash.parentNode
        if (!parent) return

        parent.removeChild(splash)
    }, SPLASH_VANISHING_DELAY)
}

void start()
