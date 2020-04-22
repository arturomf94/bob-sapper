import Dexie from "dexie"

const db = new Dexie("bob")
db.version(6).stores({
  keys: `&api`,
  wallet: "++id",
  utxos: "&txid",
  messages: "&txid, timestamp, recipient, sender"
})

export default db
