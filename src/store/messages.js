import { writable, derived } from "./factory"
import db from "./db"
import { get } from "svelte/store"
import { address, pubKeyString } from "./wallet"
import Address from "bsv/lib/address"
import PublicKey from "bsv/lib/publickey"
import * as bsvMessage from "bsv/message"
import { lastTx as ltx, firstTx as ftx } from "./state"

let lastTx = get(ltx)
let firstTx = get(ftx)

ltx.subscribe((i) => (lastTx = i))
ftx.subscribe((i) => (firstTx = i))

async function updateState(blk, i) {
  if (!lastTx || blk > lastTx.blk || (blk === lastTx.blk && i > lastTx.i)) {
    ltx.set({ blk, i })
  }
  if (!firstTx || blk < firstTx.blk || (blk === firstTx.blk && i < firstTx.i)) {
    ftx.set({ blk, i })
  }
}

async function getMessages() {
  const loaded = await db.messages
    // .orderBy("timestamp")
    .reverse()
    .toArray()
  return loaded.reduce((acc, m) => {
    acc[m.txid] = m
    return acc
  }, {})
}

async function setMessages(messages) {
  db.messages.bulkPut(messages)
}

function createMessageStore() {
  const { update, ...storeObj } = writable(getMessages, setMessages, {})

  return {
    ...storeObj,
    put: (msg) => {
      let updated
      update((msgs) => {
        const existing = msgs[msg.txid]
        updated = existing ? Object.assign(existing, msg) : msg
        msgs[msg.txid] = updated
        return msgs
      })
      db.messages.put(updated)
      if (msg.blk) updateState(msg.blk, msg.i)
    },
    bulkPut: (newMsgs, saveDB = true) => {
      update((msgs) => {
        Object.assign(
          msgs,
          newMsgs.reduce((obj, tx) => ((obj[tx.txid] = tx), obj), {})
        )
        return msgs
      })
      if (saveDB) db.messages.bulkPut(msgs)
      // TODO: Update last block state
    }
  }
}

export const messages = createMessageStore()

export const sorted = derived(messages, ($messages) =>
  // Object.values($messages).sort((a, b) => a.timestamp || 0 - b.timestamp || 0)
  Object.values($messages).sort((a, b) => {
    // if (a.txid == b.prev.h) return 1
    // if (b.txid == a.prev.h) return -1
    // return 0
    if (a.blk == b.blk) {
      if (a.timestamp && b.timestamp) return a.timestamp - b.timestamp
      if (a.tSender && b.tSender) return a.tSender - b.tSender
      return a.i - b.i
    }
    // if (a.timestamp && b.timestamp) return a.timestamp || 0 - b.timestamp || 0
    if (a.blk && b.blk) return a.blk - b.blk
    return b.blk || 0 - a.blk || 0
  })
)

export const chats = derived(
  [sorted, pubKeyString],
  async ([$sorted, $pubKeyString], set) => {
    await pubKeyString.loaded

    set(
      $sorted
        .reverse()
        .concat([
          {
            sender: $pubKeyString,
            recipient: $pubKeyString,
            text: "You can send messages to yourself here"
          }
        ])
        .map((msg) => {
          return {
            contact:
              msg.recipient === $pubKeyString ? msg.sender : msg.recipient,
            text: msg.text
          }
        })
        .filter(
          (message, index, self) =>
            self.findIndex((msg) => {
              return msg.contact === message.contact
            }) === index
        )
    )
  },
  []
)

export function verifyMessage(message) {
  new PublicKey(message.recipient)
  const sender = new PublicKey(message.sender)
  const signed = bsvMessage.verify(
    message.text,
    sender.toAddress(),
    message.signature
  )
  if (!signed) throw new Error("Failed to verify message signature")
}
