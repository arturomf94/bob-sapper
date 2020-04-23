import { bitbusKey } from "./store/keys"
import { get } from "svelte/store"
import Address from "bsv/lib/address"

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
    text: output.s5,
    sender: output.s3,
    recipient: output.s4,
    timestamp: tx.timestamp || tx.blk.t,
    mempool: true,
    txid: tx.tx.h,
    prev: tx.in ? tx.in[0].e : undefined,
    blk: tx.blk ? tx.blk.i : undefined
  }

  new Address(message.recipient)
  new Address(message.sender)

  if (!message.recipient || !message.prev) {
    console.log(tx)
    console.log(message)
  }
  return message
}
