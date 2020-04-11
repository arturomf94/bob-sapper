import { writable } from "svelte/store"
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

function createKey() {
  const { subscribe, set, update } = writable()

  return {
    subscribe,
    set: (key) => {
      set(key)
      setKey(key)
    },
    load: async () => {
      set(await getKey())
    }
  }
}

export const apiKey = createKey()
