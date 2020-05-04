import { messages } from "../store/messages"
import { pubKeyString, decryptECIES } from "../store/wallet"
import { get } from "svelte/store"
import {
  getMessage,
  project,
  sort,
  getTxFilter,
  fetchBitsocket
} from "../planaria"
import { readStream } from "../utils/stream"
import protocols from "../protocols"

global.window = self

async function fetchMempool() {
  await pubKeyString.loaded
  await decryptECIES.loaded

  const pubKey = get(pubKeyString)
  const ecies = get(decryptECIES)

  const query = JSON.stringify({
    q: {
      find: {
        "out.s2": protocols.message,
        ...(await getTxFilter())
      },
      sort,
      project
    }
  })
  const res = await fetchBitsocket(query)
  await readStream(res, (tx) => messages.put(getMessage(tx, pubKey, ecies)))
}

fetchMempool()
