import { get } from "svelte/store"
import { mattercloudKey } from "./store/keys"
import axios from "axios"

const baseURL = "https://api.mattercloud.net/api/v3/main"

async function getConfig() {
  await mattercloudKey.loaded
  let key = get(mattercloudKey)
  if (!key) {
    console.log("Fetching new Mattercloud API key")
    key = await fetchmattercloudKey()
    mattercloudKey.set(key)
  }
  return {
    baseURL,
    headers: { api_key: key }
  }
}

export async function fetchUTXOs(address) {
  try {
    const res = await axios.post(
      "/addrs/utxo",
      {
        addrs: address.toString()
      },
      await getConfig()
    )
    return res.data
  } catch (err) {
    throw new Error(`Failed to retrieve utxo's for ${address}: ${err.message}`)
  }
}

export async function broadcast(rawtx) {
  try {
    const res = await axios.post("/tx/send", { rawtx }, await getConfig())
    return res.data ? res.data.txid : null
  } catch (err) {
    throw new Error(`Failed to broadcast transaction: ${err.message}`)
  }
}

export async function fetchmattercloudKey() {
  const response = await axios.post(
    "https://api.bitindex.network/api/v2/registration/account?secret=secretkey"
  )
  const mattercloudKey = response.data && response.data.apiKey
  if (!mattercloudKey) {
    throw new Error("Failed to request MatterCloud API key.")
  }
  return mattercloudKey
}
