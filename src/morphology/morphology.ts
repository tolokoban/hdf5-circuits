import { HDF5Group } from "@/data/hdf5"
import { DatasetPoints } from "./dataset-points"
import { DatasetStructure } from "./dataset-structure"
import { TgdVec3 } from "@tolokoban/tgd"

export interface MorphologyNode {
    center: TgdVec3
    radius: number
    type: number
    lines: MorphologyLine[]
}

export interface MorphologyLine {
    node1: MorphologyNode
    node2: MorphologyNode
    length: number
}

export class Morphology {
    // Neuron's types
    static readonly SOMA = 1
    static readonly AXON = 2
    static readonly BASAL_DENDRITE = 3
    static readonly APICAL_DENDRITE = 4
    // Glia's types
    static readonly GLIA_PERIVASCULAR_PROCESS = 2
    static readonly GLIA_PROCESS = 3
    // Dendritic spine's TypeScript
    static readonly NECK = 2
    static readonly HEAD = 3

    public readonly somaCenter: Readonly<TgdVec3>
    public readonly boundingSphereRadius: number
    public readonly data: {
        points: DatasetPoints
        structure: DatasetStructure
    }

    private readonly _nodes: MorphologyNode[] = []
    private readonly _somaNodes: MorphologyNode[] = []
    private readonly _lines: MorphologyLine[] = []

    constructor(group: HDF5Group) {
        const points = new DatasetPoints(group.get("points").value ?? [])
        const structure = new DatasetStructure(
            group.get("structure").value ?? []
        )
        this.data = { points, structure }
        const { _nodes: nodes } = this
        points.forEach((x, y, z, d) => {
            nodes.push({
                center: new TgdVec3(x, y, z),
                radius: d * 0.5,
                type: 0,
                lines: [],
            })
        })
        const somaCenter = new TgdVec3()
        this.somaCenter = somaCenter
        for (let i = 0; i < structure.length; i++) {
            const type = structure.type(i)
            if (type === Morphology.SOMA) {
                const soma = nodes[i]
                soma.type = type
                somaCenter.add(soma.center)
                this._somaNodes.push(soma)
            } else {
                const node2 = nodes[structure.point(i)]
                node2.type = type
                const node1 = nodes[structure.point(structure.parent(i))]
                const line: MorphologyLine = {
                    node1,
                    node2,
                    length: TgdVec3.distance(node1.center, node2.center),
                }
                this._lines.push(line)
                node1.lines.push(line)
                node2.lines.push(line)
            }
        }
        somaCenter.scale(1 / somaCenter.length)
        let boundingSphereRadius = 0
        for (const node of nodes) {
            boundingSphereRadius = Math.max(
                boundingSphereRadius,
                TgdVec3.distance(somaCenter, node.center)
            )
        }
        this.boundingSphereRadius = boundingSphereRadius
    }

    public get nodes(): Readonly<MorphologyNode[]> {
        return this._nodes
    }
    public get somaNodes(): Readonly<MorphologyNode[]> {
        return this._somaNodes
    }
    public get lines(): Readonly<MorphologyLine[]> {
        return this._lines
    }
}
