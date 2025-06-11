import { HDF5Group } from "@/data/hdf5"
import { DatasetPoints } from "./dataset-points"
import { DatasetStructure } from "./dataset-structure"
import { TgdVec3 } from "@tolokoban/tgd"

export interface MorphologyNode {
    center: TgdVec3
    radius: number
    type: number
}

export interface MorphologySection {
    parent: number
    nodes: MorphologyNode[]
    type: number
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
    private readonly _somaNodes: MorphologyNode[]
    private readonly _sections: MorphologySection[] = []

    constructor(group: HDF5Group, mode: "full" | "tree" = "full") {
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
            })
        })
        const somaCenter = new TgdVec3()
        this.somaCenter = somaCenter
        let somaPointsCount = 0
        const somaNodes: MorphologyNode[] = []
        for (let i = 0; i < structure.length; i++) {
            const type = structure.getSectionType(i)
            if (type === Morphology.SOMA) {
                const soma = nodes[i]
                soma.type = type
                const somaIndexes = structure.getSectionPointsIndexes(
                    i,
                    points.length
                )
                for (const somaIndex of somaIndexes) {
                    const somaNode = nodes[somaIndex]
                    somaNodes.push(somaNode)
                    somaCenter.add(somaNode.center)
                    somaPointsCount++
                }
            } else {
                const pointsIndexes = structure.getSectionPointsIndexes(
                    i,
                    nodes.length
                )
                if (pointsIndexes.length === 0) {
                    console.log("NO POINT HERE!")
                }
                const section: MorphologySection = {
                    nodes: pointsIndexes.map((index) => nodes[index]),
                    type: nodes[pointsIndexes[0]].type,
                    parent: structure.getSectionParentIndex(i),
                }
                this._sections.push(section)
            }
        }
        this._somaNodes = somaNodes
        somaCenter.scale(1 / Math.max(1, somaPointsCount))
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
    public get sections(): Readonly<MorphologySection[]> {
        return this._sections
    }
}
