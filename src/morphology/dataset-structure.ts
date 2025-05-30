export class DatasetStructure {
    public readonly length: number

    constructor(private readonly data: number[]) {
        this.length = Math.floor(data.length / 3)
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
        for (let i = 0; i < this.length; i++) {
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
        for (let i = 0; i < this.length; i++) {
            const k = this.parent(i)
            if (this.type(k) === type) indexes.push(i)
        }
        return indexes
    }

    private actualIndex(index: number): number {
        if (index < 0 || index >= this.length) {
            throw new Error(
                `Index of a structure element must be between 0 and ${this.length - 1}!`
            )
        }

        return index * 3
    }
}
