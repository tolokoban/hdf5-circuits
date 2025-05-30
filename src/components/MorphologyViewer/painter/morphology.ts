import {
    ArrayNumber4,
    TgdContext,
    TgdPainter,
    TgdPainterSegments,
    TgdPainterSegmentsData,
} from "@tolokoban/tgd"

import { Morphology } from "@/morphology"

export class PainterMorphology extends TgdPainter {
    private readonly painter: TgdPainterSegments

    constructor(context: TgdContext, morphology: Morphology) {
        super()
        const segments = new TgdPainterSegmentsData()
        for (const { node1, node2 } of morphology.lines) {
            const { x: x1, y: y1, z: z1 } = node1.center
            const { x: x2, y: y2, z: z2 } = node2.center
            const r1 = node1.radius
            const r2 = node2.radius
            const u1 = (node1.type - 0.5) / 4
            const u2 = (node2.type - 0.5) / 4
            segments.add([x1, y1, z1, r1], [x2, y2, z2, r2], [u1, u1], [u2, u2])
        }
        this.painter = new TgdPainterSegments(context, {
            makeDataset: segments.makeDataset,
            minRadius: 1,
        })
    }

    delete(): void {
        this.painter.delete()
    }

    paint(time: number, delay: number): void {
        this.painter.paint(time, delay)
    }
}
