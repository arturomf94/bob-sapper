import { writable } from "./factory"
import db from "./db"

function getter(api) {
  return async function getKey() {
    const key = await db.keys.where("api").equals(api).first()
    return key ? key.key : undefined
  }
}

function setter(api) {
  return async function setKey(key) {
    db.keys.put({
      api,
      key
    })
  }
}

export const mattercloudKey = writable(
  getter("mattercloud"),
  setter("mattercloud")
)
export const bitbusKey = writable(getter("bitbus"), setter("bitbus"))
