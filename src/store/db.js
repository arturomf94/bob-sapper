import Dexie from "dexie"

const db = new Dexie("bob")
db.version(9).stores({
  keys: `&api`,
  wallet: "++id",
  utxos: "&txid",
  messages: "&txid, timestamp, recipient, sender, blk",
  versions: "&module",
  state: "&context"
})

export default db
