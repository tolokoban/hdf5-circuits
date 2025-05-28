import React from "react"

import Background from "@/generated/background"

import Styles from "./layout.module.css"

export default function LayoutBackground({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className={Styles.Layoutbackground}>
            <Background type="background" />
            {children}
        </div>
    )
}
