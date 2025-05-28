export class DatasetStructure {
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

    public readonly count: number

    constructor(private readonly data: number[]) {
        this.count = Math.floor(data.length / 3)
    }

    point(index: number) {
        return this.data[this.actualIndex(index)]
    }

    type(index: number) {
        return this.data[this.actualIndex(index) + 1]
    }

    parent(index: number) {
        return this.data[this.actualIndex(index) + 2]
    }

    /**
     * @param type
     * @returns A list of indexes of nodes of the same type
     */
    indexesOfSameType(type: number): number[] {
        const indexes: number[] = []
        for (let i = 0; i < this.count; i++) {
            if (this.type(i) === type) indexes.push(i)
        }
        return indexes
    }

    /**
     * @param type
     * @returns A list of indexes of nodes with parents of the same type
     */
    indexesOfSameParentType(type: number): number[] {
        const indexes: number[] = []
        for (let i = 0; i < this.count; i++) {
            const k = this.parent(i)
            if (this.type(k) === type) indexes.push(i)
        }
        return indexes
    }

    private actualIndex(index: number): number {
        if (index < 0 || index >= this.count) {
            throw new Error(
                `Index of a structure element must be between 0 and ${this.count - 1}!`
            )
        }

        return index * 3
    }
}
