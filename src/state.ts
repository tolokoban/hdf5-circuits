import AtomicState from "@tolokoban/react-state"
import { HDF5Group } from "./data/hdf5"

export const State = {
    data: new AtomicState<HDF5Group | null>(null),
    groupToDisplay: new AtomicState<HDF5Group | null>(null),
}
