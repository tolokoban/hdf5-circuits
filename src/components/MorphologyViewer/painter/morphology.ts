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
            if (structure.type(i1) !== DatasetStructure.SOMA) continue

            const k = structure.point(i1)
            points.setDiameter(k, 5)
        }
        for (let i1 = 0; i1 < structure.count; i1++) {
            const i2 = structure.parent(i1)
            if (i2 < 0) continue

            const a = structure.point(i1)
            const b = structure.point(i2)
            const Axyzr: ArrayNumber4 = [
                points.x(a),
                points.y(a),
                points.z(a),
                points.diameter(a) * 0.5,
            ]
            const Bxyzr: ArrayNumber4 = [
                points.x(b),
                points.y(b),
                points.z(b),
                points.diameter(b) * 0.5,
            ]
            const color1 =
                structure.type(i2) === DatasetStructure.SOMA
                    ? 0.5 / 4
                    : (structure.type(i1) - 0.5) / 4
            const color2 = (structure.type(i2) - 0.5) / 4
            segments.add(Axyzr, Bxyzr, [color1, color1], [color2, color2])
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
