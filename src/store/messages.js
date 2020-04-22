// import { writable, derived } from "./factory"
import db from "./db"

// async function getMessages() {
//   return db.messages.orderBy("timestamp").reverse().limit(1000)
// }

// async function setMessages(messages) {
//   db.messages.bulkPut(messages)
// }

// export const messages = writable(getMessages, setMessages)

import { writable, derived, get } from "svelte/store"
import { address } from "./wallet"

export const messages = writable({})

export const sorted = derived(messages, ($messages) =>
  Object.values($messages).sort((a, b) => a.timestamp - b.timestamp)
)

export const chats = derived(
  [sorted, address],
  async ([$sorted, $address], set) => {
    await address.loaded
    // console.log($sorted)
    // console.log(
    //   $sorted.map((message) => {
    //     return message.sender == $address ? message.recipient : message.sender
    //   })
    // )

    set(
      //   Array.from(
      //     new Set(
      //       // $sorted.map((message) => {
      //       //   return message.sender == $address
      //       //     ? message.recipient
      //       //     : message.sender
      //       // })

      //     )
      //   )
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

export async function putMessage(message) {
  const m = get(messages)
  m[message.txid] = message
  messages.set(m)
  db.messages.put(message)
}
