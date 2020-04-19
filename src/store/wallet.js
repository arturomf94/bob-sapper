import { writable, derived } from "./factory"
import Mnemonic from "bsv/mnemonic"
import db from "./db"

async function getSeed() {
  const seed = await db.wallet.get(1)
  return seed ? seed.seed : undefined
}

async function setSeed(seed) {
  db.wallet.put({ id: 1, seed })
}

export const seed = writable(getSeed, setSeed)
export const xprivKey = derived(seed, ($seed) =>
  $seed ? Mnemonic.fromString($seed).toHDPrivateKey() : undefined
)
export const privateKey = derived(xprivKey, ($xprivKey) =>
  $xprivKey ? $xprivKey.privateKey : undefined
)
