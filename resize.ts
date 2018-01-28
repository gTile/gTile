import { TileSpec } from "./tilespec"

export class Hello {}

export function isZero(spec: TileSpec) {
    return spec.gridWidth === 0;
}
