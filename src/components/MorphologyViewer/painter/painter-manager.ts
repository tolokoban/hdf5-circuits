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
                    makePointsClouds(context, morphologies),
                    makeLines(context, morphologies),
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
    morphologies: readonly Morphology[]
): TgdPainterPointsCloud {
    const point: number[] = []
    const uv: number[] = []
    for (let i = 0; i < morphologies.length; i++) {
        const nodes = morphologies[i].nodes
        for (const node of nodes) {
            const { x, y, z } = node.center
            const r = node.radius
            point.push(x, y, z, r)
            const u = (i + 0.5) / morphologies.length
            uv.push(u, u)
        }
    }
    return new TgdPainterPointsCloud(context, {
        dataPoint: new Float32Array(point),
        dataUV: new Float32Array(uv),
        minSizeInPixels: 5,
    })
}

function makeLines(
    context: TgdContext,
    morphologies: readonly Morphology[]
): TgdPainterLines {
    const points: number[] = []
    let index = 0
    for (const { lines } of morphologies) {
        const color = (index + 0.5) / morphologies.length
        index++
        for (const { node1, node2 } of lines) {
            for (const node of [node1, node2]) {
                const { x, y, z } = node.center
                points.push(x, y, z, color)
            }
        }
    }
    const painter = new TgdPainterLines(context, {
        dataPoint: new Float32Array(points),
    })
    return painter
}
