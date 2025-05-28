import { isFunction, isType } from "@tolokoban/type-guards"
import * as hdf5Lib from "jsfive"

interface HDF5InternalGroup {
    name: string
    keys: string[]
    attrs: Record<string, string>
    value?: number[]
    parent: HDF5InternalGroup
    get(path: string): HDF5InternalGroup
}

export class HDF5Group {
    static fromArrayBuffer(data: ArrayBuffer, filename = "<ROOT>") {
        const group = new hdf5Lib.File(data, filename)
        return new HDF5Group(group, filename)
    }

    private constructor(
        private readonly root: HDF5InternalGroup,
        public readonly name: string
    ) {}

    get keys(): string[] {
        const item = this.root
        const keys = isFunction(item.keys) ? item.keys() : item.keys
        return isType<string[]>(keys, ["array", "string"]) ? keys : []
    }

    get attrs(): Record<string, string> {
        const item = this.root
        return structuredClone(item.attrs ?? {})
    }

    get value(): number[] | undefined {
        const item = this.root
        return item.value
    }

    get(path: string): HDF5Group {
        const fullPath = [this.name, path].join("/")
        const item = this.root.get(path)
        if (!item) {
            throw new Error(`Path "${fullPath}" does not exist!`)
        }

        return new HDF5Group(item, fullPath)
    }

    has(pathItem: string) {
        return this.keys.includes(pathItem)
    }
}
