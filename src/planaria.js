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

export function getMessage(tx, pubKey, ecies) {
  const output = tx.out[0]

  const message = {
    sender: output.s3,
    recipient: output.s4,
    signature: output.s7,
    mempool: true,
    txid: tx.tx.h,
    prev: tx.in[0].e,
    i: tx.i,
    tSender: output.s8
  }

  let encryptedText
  if (output.s3 === pubKey) {
    encryptedText = bsv.deps.Buffer.from(output.s6, "hex")
  } else if (output.s4 === pubKey) {
    encryptedText = bsv.deps.Buffer.from(output.s5, "hex")
  } else {
    throw new Error("Can't decrypt message")
  }

  try {
    message.text = ecies.decrypt(encryptedText).toString()
  } catch (e) {
    throw new Error("Failed to decrypt message", e)
  }

  if (tx.blk) message.blk = tx.blk.i
  if (tx.timestamp) {
    message.timestamp = tx.timestamp
  } else if (tx.blk.t) {
    message.blktime = tx.blk.t
  }

  verifyMessage(message)
  return message
}

export const project = {
  blk: 1,
  "tx.h": 1,
  "out.s3": 1,
  "out.s4": 1,
  "out.s5": 1,
  "out.s6": 1,
  "out.s7": 1,
  "out.s8": 1,
  "out.o1": 1,
  "in.e": 1,
  timestamp: 1,
  i: 1
}

export const sort = { "blk.i": -1, i: -1 }

export async function getTxFilter() {
  const pubKey = get(pubKeyString)
  return {
    $or: [
      { "out.s3": pubKey },
      {
        "out.s4": pubKey
      }
    ]
  }
}
