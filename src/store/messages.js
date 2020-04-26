import { writable, derived } from "./factory"
import db from "./db"
import { get } from "svelte/store"
import { address } from "./wallet"
import Address from "bsv/lib/address"
import * as bsvMessage from "bsv/message"

async function getMessages() {
  const loaded = await db.messages
    .orderBy("timestamp")
    .reverse()
    .limit(1000)
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
  const { subscribe, loaded, update } = writable(getMessages, setMessages, {})

  return {
    subscribe,
    loaded,
    put: (msg) => {
      update((msgs) => {
        msgs[msg.txid] = msg
        return msgs
      })
      db.messages.put(msg)
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
    }
  }
}

export const messages = createMessageStore()

export const sorted = derived(messages, ($messages) =>
  Object.values($messages).sort((a, b) => a.timestamp - b.timestamp)
)

export const chats = derived(
  [sorted, address],
  async ([$sorted, $address], set) => {
    await address.loaded

    set(
      $sorted
        .reverse()
        .concat([
          {
            sender: $address,
            recipient: $address,
            text: "You can send messages to yourself here"
          }
        ])
        .map((msg) => {
          return {
            contact: msg.recipient === $address ? msg.sender : msg.recipient,
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
  new Address(message.recipient)
  new Address(message.sender)
  const signed = bsvMessage.verify(
    message.text,
    message.sender,
    message.signature
  )
  if (!signed) throw new Error("Failed to verify message signature")
}
