import { ArrayNumber4, TgdVec3 } from "@tolokoban/tgd"

export class DatasetPoints {
    public readonly length: number

    constructor(private readonly data: number[]) {
        this.length = Math.floor(data.length / 4)
    }

    position(index: number): TgdVec3 {
        const { data } = this
        const k = this.actualIndex(index)
        return new TgdVec3(data[k + 0], data[k + 1], data[k + 2])
    }

    x(index: number) {
        return this.data[this.actualIndex(index)]
    }

    y(index: number) {
        return this.data[this.actualIndex(index) + 1]
    }

    z(index: number) {
        return this.data[this.actualIndex(index) + 2]
    }

    diameter(index: number) {
        return this.data[this.actualIndex(index) + 3]
    }

    setDiameter(index: number, value: number) {
        this.data[this.actualIndex(index) + 3] = value
    }

    forEach(
        callback: (
            x: number,
            y: number,
            z: number,
            diameter: number
        ) => boolean | void
    ) {
        for (let i = 0; i < this.length; i++) {
            const x = this.x(i)
            const y = this.y(i)
            const z = this.z(i)
            const d = this.diameter(i)
            if (false === callback(x, y, z, d)) return
        }
    }

    /**
     * Return the center and the radius of a bounding sphere.
     * @returns [x, y, z, radius]
     */
    computeBounds(): ArrayNumber4 {
        let minX = Number.POSITIVE_INFINITY
        let minY = Number.POSITIVE_INFINITY
        let minZ = Number.POSITIVE_INFINITY
        let maxX = Number.NEGATIVE_INFINITY
        let maxY = Number.NEGATIVE_INFINITY
        let maxZ = Number.NEGATIVE_INFINITY
        for (let i = 0; i < this.length; i++) {
            const x = this.x(i)
            const y = this.y(i)
            const z = this.z(i)
            minX = Math.min(minX, x)
            maxX = Math.max(maxX, x)
            minY = Math.min(minY, y)
            maxY = Math.max(maxY, y)
            minZ = Math.min(minZ, z)
            maxZ = Math.max(maxZ, z)
        }
        let centerX = (minX + maxX) / 2
        let centerY = (minY + maxY) / 2
        let centerZ = (minZ + maxZ) / 2
        return [
            centerX,
            centerY,
            centerZ,
            Math.max(
                Math.abs(centerX - minX),
                Math.abs(centerX - maxX),
                Math.abs(centerY - minY),
                Math.abs(centerY - maxY),
                Math.abs(centerZ - minZ),
                Math.abs(centerZ - maxZ)
            ),
        ]
    }

    private actualIndex(index: number): number {
        if (index < 0 || index >= this.length) {
            throw new Error(
                `Index of a points element must be between 0 and ${this.length - 1}!`
            )
        }

        return index * 4
    }
}
