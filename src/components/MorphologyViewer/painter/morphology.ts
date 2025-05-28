import {
    ArrayNumber4,
    TgdContext,
    TgdPainter,
    TgdPainterSegments,
    TgdPainterSegmentsData,
} from "@tolokoban/tgd"

import { DatasetPoints } from "@/morphology/dataset-points"
import { DatasetStructure } from "@/morphology/dataset-structure"

export class PainterMorphology extends TgdPainter {
    private readonly painter: TgdPainterSegments

    constructor(
        context: TgdContext,
        {
            points,
            structure,
        }: { points: DatasetPoints; structure: DatasetStructure }
    ) {
        super()
        const segments = new TgdPainterSegmentsData()
        for (let i1 = 0; i1 < structure.count; i1++) {
            const i2 = structure.parent(i1)
            if (i2 < 0) continue

            const a = structure.point(i1)
            const b = structure.point(i2)
            const Axyzr: ArrayNumber4 = [
                points.x(a),
                points.y(a),
                points.z(a),
                points.diameter(a),
            ]
            const Bxyzr: ArrayNumber4 = [
                points.x(b),
                points.y(b),
                points.z(b),
                points.diameter(b),
            ]
            segments.add(Axyzr, Bxyzr)
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
