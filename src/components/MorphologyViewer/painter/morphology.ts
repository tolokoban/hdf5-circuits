import { MorphologyNode } from "./../../../morphology/morphology"
import {
    tgdCanvasCreateGradientHorizontal,
    TgdContext,
    TgdPainter,
    TgdPainterSegments,
    TgdPainterSegmentsData,
} from "@tolokoban/tgd"

import { Morphology } from "@/morphology"
import { getHueWheel } from "@/utils/colors"

export class PainterMorphology extends TgdPainter {
    private readonly painter: TgdPainterSegments

    constructor(
        context: TgdContext,
        morphology: Morphology,
        options: { color: number }
    ) {
        super()
        const { color } = options
        const segments = new TgdPainterSegmentsData()
        for (const section of morphology.sections) {
            let prvNode: MorphologyNode | null = null
            for (const curNode of section.nodes) {
                if (prvNode) {
                    const { x: x1, y: y1, z: z1 } = prvNode.center
                    const { x: x2, y: y2, z: z2 } = curNode.center
                    const r1 = prvNode.radius
                    const r2 = curNode.radius
                    const u1 = (prvNode.type - 0.5) / 4
                    const u2 = (curNode.type - 0.5) / 4
                    segments.add(
                        [x1, y1, z1, r1],
                        [x2, y2, z2, r2],
                        [color, u1],
                        [color, u2]
                    )
                }
                prvNode = curNode
            }
        }
        this.painter = new TgdPainterSegments(context, {
            makeDataset: segments.makeDataset,
            minRadius: 1,
        })
        this.painter.colorTexture.loadBitmap(
            tgdCanvasCreateGradientHorizontal(360, getHueWheel(50))
        )
    }

    delete(): void {
        this.painter.delete()
    }

    paint(time: number, delay: number): void {
        this.painter.paint(time, delay)
    }
}
