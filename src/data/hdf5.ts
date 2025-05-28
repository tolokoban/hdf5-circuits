import { isFunction, isType } from "@tolokoban/type-guards"
import * as hdf5Lib from "jsfive"

interface HDF5Group {
    name: string
    keys: string[]
    attrs: Record<string, string>
    value?: number[]
    parent: HDF5Group
    get(path: string): HDF5Group
}

export class HDF5 {
    private readonly root: HDF5Group

    constructor(
        data: ArrayBuffer,
        public readonly filename: string
    ) {
        const hdf5 = new hdf5Lib.File(data, filename)
        this.root = hdf5
    }

    keys(path = ""): string[] {
        const { root: hdf5 } = this
        if (path === "") return hdf5.keys

        const item = this.get(path)
        const keys = isFunction(item.keys) ? item.keys() : item.keys
        return isType<string[]>(keys, ["array", "string"]) ? keys : []
    }

    attrs(path = ""): Record<string, string> {
        const { root } = this
        if (path === "") return structuredClone(root.attrs)

        const item = this.get(path)
        console.log("🚀 [hdf5] path, item.value =", path, item.value) // @FIXME: Remove this line written on 2025-05-28 at 12:03
        return structuredClone(item.attrs ?? {})
    }

    value(path = ""): number[] | undefined {
        const { root } = this
        if (path === "") return root.value

        const item = this.get(path)
        return item.value
    }

    private get(path: string): HDF5Group {
        const item = this.root.get(path)
        if (!item) throw new Error(`Path "${path}" does not exist!`)

        return item
    }
}
