export class DatasetStructure {
    public readonly length: number

    constructor(private readonly data: number[]) {
        this.length = Math.floor(data.length / 3)
    }

    /**
     * Index of the first point of the section at `index`.
     */
    getFirstPointIndex(index: number) {
        return this.data[this.actualIndex(index)]
    }

    /**
     * @returns An array of indexes of all the points of the section at `index`.
     */
    getSectionPointsIndexes(index: number, pointsCount: number): number[] {
        const points: number[] = []
        for (
            let pointer = this.getFirstPointIndex(index);
            pointer <
            (index < this.length - 1
                ? this.getFirstPointIndex(index + 1)
                : pointsCount);
            pointer++
        ) {
            points.push(pointer)
        }
        return points
    }

    getSectionType(index: number) {
        return this.data[this.actualIndex(index) + 1]
    }

    /**
     *
     * @param index
     * @returns
     */
    getSectionParentIndex(index: number) {
        return this.data[this.actualIndex(index) + 2]
    }

    /**
     * @param type
     * @returns A list of indexes of nodes of the same type
     */
    getSectionIndexesOfSameType(type: number): number[] {
        const indexes: number[] = []
        for (let i = 0; i < this.length; i++) {
            if (this.getSectionType(i) === type) indexes.push(i)
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
            const k = this.getSectionParentIndex(i)
            if (this.getSectionType(k) === type) indexes.push(i)
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
