import React from "react"
import {
    tgdCalcDegToRad,
    TgdCameraPerspective,
    tgdCanvasCreateFill,
    TgdContext,
    TgdControllerCameraOrbit,
    TgdGeometry,
    TgdGeometryBox,
    TgdPainterClear,
    TgdPainterMesh,
    TgdPainterState,
    TgdTexture2D,
    TgdVec3,
    webglPresetDepth,
} from "@tolokoban/tgd"

import { HDF5Group } from "@/data/hdf5"
import { PainterMorphology } from "./morphology"
import { Morphology, MorphologyLine, MorphologyNode } from "@/morphology"
import { TgdPainterPointsCloud } from "@/painters/points-cloud"
import { TgdPainterLines } from "@/painters/lines"

export function usePainterManager(): PainterManager {
    const ref = React.useRef<PainterManager | null>(null)
    if (!ref.current) ref.current = new PainterManager()

    return ref.current as PainterManager
}
class PainterManager {
    private _canvas: HTMLCanvasElement | null = null
    private _groups: HDF5Group[] = []
    private _context: TgdContext | null = null

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

    get groups() {
        return this._groups
    }
    set groups(groups: HDF5Group[]) {
        this.cleanup()
        for (const group of groups) {
            if (group.has("points") && group.has("structure")) {
                this._groups.push(group)
            }
        }
        this.initialize()
    }

    private cleanup() {
        if (this._groups.length === 0) return

        if (this._context) this._context.destroy()
        this._canvas = null
        this._groups = []
    }

    private initialize() {
        const { canvas, groups } = this
        if (!canvas || groups.length === 0) return

        const context = new TgdContext(canvas, {
            antialias: true,
        })
        const morphologies = groups.map((group) => new Morphology(group))
        console.log("🚀 [painter-manager] morphologies =", morphologies) // @FIXME: Remove this line written on 2025-05-30 at 11:45
        const morphoPainters = morphologies.map(
            (morpho) => new PainterMorphology(context, morpho)
        )
        const [center, radius] = getBoundingSphere(morphologies)
        if (context.camera instanceof TgdCameraPerspective) {
            context.camera.fovy = Math.PI / 2
        }
        const [cx, cy, cz] = center
        context.camera.far = 10 * radius
        context.camera.near = 1
        context.camera.transfo.setPosition(cx, cy, cz)
        context.camera.transfo.setDistance(radius)
        new TgdControllerCameraOrbit(context, {
            geo: {
                maxLat: tgdCalcDegToRad(60),
                minLat: tgdCalcDegToRad(-60),
            },
            speedZoom: 50,
            inertiaOrbit: 1000,
        })
        const children = morphoPainters
        context.add(
            new TgdPainterClear(context, {
                color: [0, 0, 0, 1],
                depth: 1,
            }),
            new TgdPainterState(context, {
                depth: webglPresetDepth.lessOrEqual,
                children: [
                    makePointsClouds(context, morphologies[0].nodes),
                    makeLines(context, morphologies[0].lines),
                    // ...children,
                ],
            })
        )
        context.paint()
    }
}

function getBoundingSphere(
    morphologies: Morphology[]
): [center: TgdVec3, radius: number] {
    const center = TgdVec3.center(
        morphologies.map((morpho) => morpho.somaCenter)
    )
    let radius = 0
    for (const morpho of morphologies) {
        radius = Math.max(
            radius,
            morpho.boundingSphereRadius +
                TgdVec3.distance(center, morpho.somaCenter)
        )
    }
    return [center, radius]
}

function makePointsClouds(
    context: TgdContext,
    nodes: readonly MorphologyNode[]
): TgdPainterPointsCloud {
    const point: number[] = []
    const uv: number[] = []
    for (const node of nodes) {
        const { x, y, z } = node.center
        const r = node.radius
        point.push(x, y, z, r)
        const u = (node.type - 0.5) / 4
        uv.push(u, u)
    }
    return new TgdPainterPointsCloud(context, {
        dataPoint: new Float32Array(point),
        dataUV: new Float32Array(uv),
        minSizeInPixels: 5,
        texture: new TgdTexture2D(context).loadBitmap(
            tgdCanvasCreateFill(1, 1, "#008")
        ),
    })
}

function makePointsCloudsFromLines(
    context: TgdContext,
    lines: readonly MorphologyLine[]
): TgdPainterPointsCloud {
    const points: number[] = []
    const uvs: number[] = []
    for (const { node1, node2 } of lines) {
        for (const node of [node1, node2]) {
            const { x, y, z } = node.center
            const r = node.radius
            points.push(x, y, z, r)
            const u = (node.type - 0.5) / 4
            uvs.push(u, u)
        }
    }
    return new TgdPainterPointsCloud(context, {
        dataPoint: new Float32Array(points),
        dataUV: new Float32Array(uvs),
        minSizeInPixels: 5,
        texture: new TgdTexture2D(context).loadBitmap(
            tgdCanvasCreateFill(1, 1, "#080")
        ),
    })
}

function makeLines(
    context: TgdContext,
    lines: readonly MorphologyLine[]
): TgdPainterLines {
    const points: number[] = []
    for (const { node1, node2 } of lines) {
        for (const node of [node1, node2]) {
            const { x, y, z } = node.center
            points.push(x, y, z, 0)
        }
    }
    const painter = new TgdPainterLines(context, {
        dataPoint: new Float32Array(points),
    })
    painter.texture.loadBitmap(tgdCanvasCreateFill(1, 1, "#fff"))
    return painter
}
