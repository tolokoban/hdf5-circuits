import React from "react"
import {
    tgdCalcDegToRad,
    TgdCameraPerspective,
    tgdCanvasCreateFill,
    TgdContext,
    TgdControllerCameraOrbit,
    TgdPainter,
    TgdPainterClear,
    TgdPainterState,
    TgdVec3,
    webglPresetDepth,
} from "@tolokoban/tgd"

import { HDF5Group } from "@/data/hdf5"
import { PainterMorphology } from "./morphology"
import { Morphology } from "@/morphology"
import { TgdPainterPointsCloud } from "@/painters/points-cloud"
import { TgdPainterLines } from "@/painters/lines"
import AtomicState from "@tolokoban/react-state"
import { PainterSoma } from "./soma"

export function usePainterManager(): PainterManager {
    const ref = React.useRef<PainterManager | null>(null)
    if (!ref.current) ref.current = new PainterManager()

    return ref.current as PainterManager
}

class PainterManager {
    private _canvas: HTMLCanvasElement | null = null
    private _groups: HDF5Group[] = []
    private _context: TgdContext | null = null
    private structurePainter: TgdPainter | null = null
    private pointsPainter: TgdPainter | null = null
    private somaPainter: TgdPainter | null = null

    public readonly showPoints = new AtomicState(false)
    public readonly showStructure = new AtomicState(true)

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

    /**
     * Update visibility of painters.
     * Most of the time this depends on user clicks.
     */
    private readonly updateVisibility = () => {
        const { pointsPainter, structurePainter } = this
        if (pointsPainter) pointsPainter.active = this.showPoints.value
        if (structurePainter) structurePainter.active = this.showStructure.value
        this._context?.paint()
        console.log(
            "🚀 [painter-manager] pointsPainter.active =",
            pointsPainter?.active
        ) // @FIXME: Remove this line written on 2025-06-02 at 15:21
        console.log(
            "🚀 [painter-manager] structurePainter.active =",
            structurePainter?.active
        ) // @FIXME: Remove this line written on 2025-06-02 at 15:22
    }

    private cleanup() {
        if (this._groups.length === 0) return

        if (this._context) this._context.delete()
        this._canvas = null
        this._groups = []
        this.showPoints.removeListener(this.updateVisibility)
        this.showStructure.removeListener(this.updateVisibility)
        console.log("REMOVE listeners")
    }

    private initialize() {
        const { canvas, groups } = this
        if (!canvas || groups.length === 0) return

        const context = new TgdContext(canvas, {
            antialias: true,
        })
        const morphologies = groups.map((group) => new Morphology(group))
        const morphoPainters = morphologies.map(
            (morpho, index) =>
                new PainterMorphology(context, morpho, {
                    color: (index + 0.5) / morphologies.length,
                })
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
        const somaPainter = new PainterSoma(context, morphologies)
        const children = [...morphoPainters, somaPainter]
        const structurePainter = makePointsClouds(context, morphologies)
        this.structurePainter = structurePainter
        const pointsPainter = makeLines(context, morphologies)
        this.pointsPainter = pointsPainter
        context.add(
            new TgdPainterClear(context, {
                color: [0, 0, 0, 1],
                depth: 1,
            }),
            new TgdPainterState(context, {
                depth: webglPresetDepth.lessOrEqual,
                children,
                // children: [structurePainter, pointsPainter], //, ...children],
            })
        )
        context.paint()
        console.log("ADD listeners")
        this.showPoints.addListener(this.updateVisibility)
        this.showStructure.addListener(this.updateVisibility)
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
    for (const { sections } of morphologies) {
        const color = (index + 0.5) / morphologies.length
        index++
        for (const section of sections) {
            let prvNode = null
            for (const curNode of section.nodes) {
                if (prvNode) {
                    for (const node of [prvNode, curNode]) {
                        const { x, y, z } = node.center
                        points.push(x, y, z, color)
                    }
                }
                prvNode = curNode
            }
        }
    }
    const painter = new TgdPainterLines(context, {
        dataPoint: new Float32Array(points),
    })
    if (morphologies.length === 1) {
        painter.texture.loadBitmap(tgdCanvasCreateFill(1, 1, "#fa0"))
    }
    return painter
}
