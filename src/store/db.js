import Dexie from "dexie"

const db = new Dexie("bob")
db.version(7).stores({
  keys: `&api`,
  wallet: "++id",
  utxos: "&txid",
  messages: "&txid, timestamp, recipient, sender, blk"
})

export default db
