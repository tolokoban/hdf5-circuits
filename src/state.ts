import AtomicState from "@tolokoban/react-state"
import { HDF5 } from "./data/hdf5"

export const State = {
    data: new AtomicState<HDF5 | null>(null),
}
