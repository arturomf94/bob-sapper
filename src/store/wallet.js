import { writable, derived } from "svelte/store"
import Mnemonic from "bsv/mnemonic"
import db from "./db"

async function getSeed() {
  const seed = await db.wallet.get(1)
  return seed ? seed.seed : undefined
}

export async function setSeed(seed) {
  db.wallet.put({ id: 1, seed })
}

function createSeed() {
  const { subscribe, set, update } = writable()

  return {
    subscribe,
    set: (seed) => {
      set(seed)
      setSeed(seed)
    },
    load: async () => {
      set(await getSeed())
    }
  }
}

export const seed = createSeed()

export const xprivKey = {
  ...derived(seed, ($seed) => Mnemonic.fromString($seed).toHDPrivateKey()),
  load: seed.load
}

export const privateKey = {
  ...derived(xprivKey, ($xprivKey) => $xprivKey.privateKey),
  load: seed.load
}
