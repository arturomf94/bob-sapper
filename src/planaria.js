import { bitbusKey } from "./store/keys"
import { get } from "svelte/store"
import { verifyMessage } from "./store/messages"
import { decryptECIES, pubKeyString } from "./store/wallet"
import bsv from "bsv"

// TODO: Dynamically generate
bitbusKey.set(
  `eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJzdWIiOiIxTXRVdlU1VERhcUZiZDc1N1R2NTU3RVI1NWRKN0JSV3V3IiwiaXNzdWVyIjoiZ2VuZXJpYy1iaXRhdXRoIn0.SDhiTkE5RDVtcVhTbG1HaWZ2NStxVXE2U3YrUStaVWY2L3ErYVZScVMzV1BjNzFycDBMZCsyWjdldE15bkZlbmhGVEpsMy9FS3RkNTRWRUNEenZOR2VFPQ`
)

export async function fetchBitsocket(query) {
  const res = await fetch("https://txo.bitsocket.network/crawl", {
    method: "post",
    headers: {
      "Content-type": "application/json; charset=utf-8",
      token: get(bitbusKey)
    },
    body: query
  })
  return res.body
}

export async function fetchBitbus(query) {
  const res = await fetch("https://txo.bitbus.network/block", {
    method: "post",
    headers: {
      "Content-type": "application/json; charset=utf-8",
      token: get(bitbusKey)
    },
    body: query
  })
  return res.body
}

export function getMessage(tx) {
  const output = tx.out[0]

  const message = {
    sender: output.s3,
    recipient: output.s4,
    signature: output.s7,
    mempool: true,
    txid: tx.tx.h,
    prev: tx.in[0].e
  }

  if (output.s3 === get(pubKeyString)) {
    message.text = get(decryptECIES)
      .decrypt(bsv.deps.Buffer.from(output.s6, "hex"))
      .toString()
  } else if (output.s4 === get(pubKeyString)) {
    message.text = get(decryptECIES)
      .decrypt(bsv.deps.Buffer.from(output.s5, "hex"))
      .toString()
  } else {
    throw new Error("Can't decrypt message")
  }

  if (tx.blk) message.blk = tx.blk.i
  if (tx.timestamp) {
    message.timestamp = tx.timestamp
  } else if (tx.blk.t) {
    message.timestamp = tx.blk.t
  }

  verifyMessage(message)
  return message
}
