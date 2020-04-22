// import { writable, derived } from "./factory"
// import db from "./db"

// async function getUTXOs() {
//   console.log("loading UTXOs from db...")
//   return await db.utxos.toArray()
// }

// export async function setUTXOs() {
//   await db.utxos.clear()
//   await db.utxos.bulkPut(utxos)
// }

// export const utxos = writable(getUTXOs, setUTXOs)

import { writable, derived } from "svelte/store"

export const utxos = writable([])

export const sats = derived(utxos, ($utxos) => {
  return $utxos.reduce((acc, utxo) => acc + utxo.satoshis, 0)
})
