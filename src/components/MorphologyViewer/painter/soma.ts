import { Morphology, MorphologyNode } from "@/morphology"
import {
    ArrayNumber3,
    TgdContext,
    tgdMakeGeometryFromVolume,
    TgdMaterialFaceOrientation,
    TgdPainter,
    TgdPainterGroup,
    TgdPainterMesh,
    TgdPainterPointsCloud,
    tgdSdfCapsule,
    tgdSdfSphere,
    TgdVec3,
} from "@tolokoban/tgd"

export class PainterSoma extends TgdPainter {
    private readonly painter: TgdPainter

    constructor(context: TgdContext, morphologies: Morphology[]) {
        super()
        const meshes: TgdPainterMesh[] = []
        const points: number[] = []
        for (const morphology of morphologies) {
            let radius = 0
            const somaCenter = morphology.somaCenter
            const segments: MorphologyNode[] = []
            let size = 0
            for (const section of morphology.sections) {
                if (section.parent !== 0) continue

                const node = section.nodes.at(0)
                if (!node) continue

                segments.push(node)
                radius = Math.max(
                    radius,
                    TgdVec3.distance(somaCenter, node.center)
                )
                const nodeDistance =
                    2 * node.radius + TgdVec3.distance(somaCenter, node.center)
                size = Math.max(size, nodeDistance)
            }
            const voxelSize = (2 * size) / 48
            const bboxCorner = new TgdVec3(
                somaCenter.x - size,
                somaCenter.y - size,
                somaCenter.z - size
            )
            const bboxSize = new TgdVec3(size * 2, size * 2, size * 2)
            const geometry = tgdMakeGeometryFromVolume({
                bboxCorner,
                bboxSize,
                voxelSize,
                sdfPoint: (x, y, z) => {
                    const somaRadius = radius * 0.333
                    const r1 = somaRadius * 0.5
                    const p: ArrayNumber3 = [x, y, z]
                    let dist = tgdSdfSphere(p, somaCenter, somaRadius)
                    for (const node of segments) {
                        dist = Math.min(
                            dist,
                            tgdSdfCapsule(
                                p,
                                somaCenter,
                                node.center,
                                Math.max(r1, node.radius),
                                node.radius
                            )
                        )
                    }
                    return dist
                },
                smoothingLevel: 2,
            })
            const mesh = new TgdPainterMesh(context, {
                geometry,
                material: new TgdMaterialFaceOrientation(),
            })
            meshes.push(mesh)
        }
        this.painter = new TgdPainterGroup([
            new TgdPainterPointsCloud(context, {
                dataPoint: new Float32Array(points),
            }),
            ...meshes,
        ])
    }

    delete(): void {
        this.painter.delete()
    }

    paint(time: number, delay: number): void {
        this.painter.paint(time, delay)
    }
}
