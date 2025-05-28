import React from "react"

import Styles from "./layout.module.css"

export default function Layout{{name}}({ children }: { children: React.ReactNode }) {
    return (
        <div className={Styles.Layout{{name}}}>{children}</div>
    )
}
