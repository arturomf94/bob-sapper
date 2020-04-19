import { writable } from "./factory"
import db from "./db"

async function getKey() {
  const key = await db.keys.where("api").equals("mattercloud").first()
  return key ? key.key : undefined
}

async function setKey(key) {
  db.keys.put({
    api: "mattercloud",
    key
  })
}

export const apiKey = writable(getKey, setKey)
