import Dexie from "dexie"

const db = new Dexie("bob")
db.version(2).stores({
  keys: `&api`,
  wallet: "++id"
})

export default db
