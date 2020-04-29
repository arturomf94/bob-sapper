import { writable, derived } from "./factory"
import Mnemonic from "bsv/mnemonic"
import db from "./db"
import bsvEcies from "bsv/ecies"

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

export const publicKey = derived(privateKey, ($privateKey) =>
  $privateKey ? $privateKey.publicKey : undefined
)

export const pubKeyString = derived(publicKey, ($publicKey) =>
  $publicKey ? $publicKey.toString() : undefined
)

export const address = derived(privateKey, ($privateKey) =>
  $privateKey ? $privateKey.toAddress().toString() : undefined
)

export const decryptECIES = derived(privateKey, ($privateKey) =>
  $privateKey ? bsvEcies().privateKey($privateKey) : undefined
)

export const encryptECIES = derived(publicKey, ($publicKey) =>
  $publicKey ? bsvEcies().publicKey($publicKey) : undefined
)
