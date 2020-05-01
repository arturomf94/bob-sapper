import { writable } from "./factory"
import db from "./db"

function getter(context) {
  return async function getBlock() {
    const state = await db.state.where("context").equals(context).first()
    return state
  }
}

function setter(context) {
  return async function setBlock(i) {
    db.state.put({
      context,
      ...i
    })
  }
}

export const firstTx = writable(getter("firstTx"), setter("firstTx"))
export const lastTx = writable(getter("lastTx"), setter("lastTx"))
