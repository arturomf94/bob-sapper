import Dexie from "dexie"

const db = new Dexie("bob")
db.version(5).stores({
  keys: `&api`,
  wallet: "++id",
  utxos: "&txid",
  messages: "&txid, timestamp"
})

export default db
