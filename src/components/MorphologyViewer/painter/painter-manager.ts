import React from "react"
import {
    ArrayNumber3,
    tgdCalcDegToRad,
    TgdCameraPerspective,
    TgdContext,
    TgdControllerCameraOrbit,
    TgdPainterAxes,
    TgdPainterClear,
    TgdPainterMesh,
    TgdPainterState,
    webglPresetDepth,
} from "@tolokoban/tgd"

import { HDF5Group } from "@/data/hdf5"
import { DatasetPoints } from "@/morphology/dataset-points"
import { DatasetStructure } from "@/morphology/dataset-structure"
import { PainterMorphology } from "./morphology"

export function usePainterManager(): PainterManager {
    const ref = React.useRef<PainterManager | null>(null)
    if (!ref.current) ref.current = new PainterManager()

    return ref.current as PainterManager
}
class PainterManager {
    private _canvas: HTMLCanvasElement | null = null
    private _group: HDF5Group | null = null
    private _context: TgdContext | null = null
    private points: DatasetPoints | null = null
    private structure: DatasetStructure | null = null

    get canvas() {
        return this._canvas
    }
    set canvas(value: HTMLCanvasElement | null) {
        if (!value) {
            this.cleanup()
            return
        }
        this._canvas = value
        this.initialize()
    }

    get group() {
        return this._group
    }
    set group(value: HDF5Group | null) {
        if (!value) {
            this.cleanup()
            return
        }
        if (value.has("points") && value.has("structure")) {
            this.points = new DatasetPoints(value.get("points").value ?? [])
            this.structure = new DatasetStructure(
                value.get("structure").value ?? []
            )
        }
        this._group = value
        this.initialize()
    }

    private cleanup() {
        if (this._context) this._context.destroy()
        this._canvas = null
        this._group = null
    }

    private initialize() {
        const { canvas, group } = this
        if (!canvas || !group) return

        const context = new TgdContext(canvas, {
            antialias: true,
        })
        const { points, structure } = this
        if (!points || !structure) return

        const [, , , radius] = points.computeBounds()
        if (context.camera instanceof TgdCameraPerspective) {
            context.camera.fovy = Math.PI / 2
        }
        const [cx, cy, cz] = getSomeCenter(structure, points)
        context.camera.far = 10 * radius
        context.camera.near = 1
        context.camera.transfo.setPosition(cx, cy, cz)
        context.camera.transfo.setDistance(radius)
        new TgdControllerCameraOrbit(context, {
            geo: {
                maxLat: tgdCalcDegToRad(60),
                minLat: tgdCalcDegToRad(-60),
            },
            speedZoom: 25,
            inertiaOrbit: 1000,
        })
        context.add(
            new TgdPainterClear(context, {
                color: [0, 0, 0, 1],
                depth: 1,
            }),
            new TgdPainterState(context, {
                depth: webglPresetDepth.lessOrEqual,
                children: [
                    new PainterMorphology(context, { points, structure }),
                ],
            })
        )
        context.paint()
        console.log(
            "🚀 [painter-manager] cx, cy, cz, radius =",
            cx,
            cy,
            cz,
            radius
        ) // @FIXME: Remove this line written on 2025-05-28 at 15:10
    }
}

function getSomeCenter(
    structure: DatasetStructure,
    points: DatasetPoints
): ArrayNumber3 {
    let count = 0
    let x = 0
    let y = 0
    let z = 0
    for (let i = -0; i < structure.count; i++) {
        if (structure.type(i) !== DatasetStructure.SOMA) continue

        const k = structure.point(i)
        x += points.x(k)
        y += points.y(k)
        z += points.z(k)
        count++
    }
    const coeff = 1 / count
    return [x * coeff, y * coeff, z * coeff]
}
