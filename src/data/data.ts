import { isString } from "@tolokoban/type-guards"
import { HDF5 } from "./hdf5"

export async function loadHDF5(file: File | string): Promise<HDF5> {
    const data = await loadArrayBuffer(file)
    const h5 = new HDF5(data, isString(file) ? "Example" : file.name)
    return h5
}

function loadArrayBuffer(file: File | string): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        if (isString(file)) {
            fetch(file)
                .then((resp) => resp.arrayBuffer().then(resolve).catch(reject))
                .catch(reject)
        } else {
            const fileReader = new FileReader()
            fileReader.onload = () => {
                const data = fileReader.result
                if (data instanceof ArrayBuffer) resolve(data)
                else reject("Invalid format")
            }
            fileReader.onerror = reject
            fileReader.readAsArrayBuffer(file)
        }
    })
}
