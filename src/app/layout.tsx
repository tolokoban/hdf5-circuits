import React from "react"

import Styles from "./layout.module.css"

export default function LayoutBackground({
    children,
}: {
    children: React.ReactNode
}) {
    return <div className={Styles.Layoutbackground}>{children}</div>
}
