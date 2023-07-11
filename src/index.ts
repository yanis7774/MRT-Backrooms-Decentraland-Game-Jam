import "./modules/mapgen/levelgeneration";
import { initGamePlay } from "./gameplay"
import "./modules/compatibility/polyfill/declares";
export * from '@dcl/sdk'

export function main(){
  initGamePlay();
}