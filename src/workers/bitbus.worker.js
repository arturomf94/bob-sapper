// import db from "../store/db"
import { pubKeyString, decryptECIES } from "../store/wallet"
import { messages } from "../store/messages"
import { get } from "svelte/store"
import {
  getMessage,
  fetchBitbus,
  project,
  sort,
  getTxFilter
} from "../planaria"
import { firstTx, lastTx } from "../store/state"
import { readStream } from "../utils/stream"
import protocols from "../protocols"

global.window = self

async function fetchHistory() {
  await messages.loaded
  await firstTx.loaded
  await pubKeyString.loaded
  await decryptECIES.loaded

  const txFilter = await getTxFilter()
  const pubKey = get(pubKeyString)
  const ecies = get(decryptECIES)

  async function loadChunk() {
    let res
    let blkBefore
    let iBefore

    const current = get(firstTx)

    if (!current) {
      const query = JSON.stringify({
        q: {
          find: {
            "out.s2": protocols.message,
            ...txFilter
          },
          sort,
          project
        }
      })

      res = await fetchBitbus(query)
    } else if (current.blk === 0 && current.i === 0) {
      return
    } else {
      blkBefore = current.blk
      iBefore = current.i

      const query = JSON.stringify({
        q: {
          find: {
            "out.s2": protocols.message,
            $and: [
              {
                $or: [
                  { "blk.i": { $lt: current.blk } },
                  {
                    "blk.i": current.blk,
                    i: { $lt: current.i }
                  }
                ]
              },
              txFilter
            ]
          },
          sort,
          project
        }
      })

      res = await fetchBitbus(query)
    }

    await readStream(res, (tx) => messages.put(getMessage(tx, pubKey, ecies)))

    const newState = get(firstTx)
    if (blkBefore === newState.blk && iBefore === newState.i) {
      firstTx.set({ blk: 0, i: 0 })
      console.log("Loaded all historic messages.")
      return
    }

    loadChunk()
  }

  loadChunk()
}

async function fetchRecent() {
  await pubKeyString.loaded
  await messages.loaded
  await lastTx.loaded
  await decryptECIES.loaded

  const txFilter = await getTxFilter()
  const pubKey = get(pubKeyString)
  const ecies = get(decryptECIES)

  let loadedMessages = []
  let firstLoadedBlk
  let firstLoadedI
  let lastLoadedBlk
  let lastLoadedI

  async function loadChunk() {
    let res
    let firstLoadedBlkBefore = firstLoadedBlk
    let firstLoadedIBefore = firstLoadedI

    const current = get(lastTx)
    if (!current) return

    let query = {
      q: {
        find: {
          "out.s2": protocols.message,
          $and: [
            {
              $or: [
                { "blk.i": { $gt: current.blk } },
                {
                  "blk.i": current.blk,
                  i: { $gt: current.i }
                }
              ]
            },
            txFilter
          ]
        },
        sort,
        project
      }
    }

    if (firstLoadedBlk) {
      const loadedFilter = {
        $or: [
          { "blk.i": { $lt: firstLoadedBlk } },
          {
            "blk.i": firstLoadedBlk,
            i: { $lt: firstLoadedI }
          }
        ]
      }
      query.q.find.$and.push(loadedFilter)
    }

    res = await fetchBitbus(JSON.stringify(query))

    await readStream(res, (tx) => {
      const message = getMessage(tx, pubKey, ecies)
      loadedMessages.push(message)

      if (
        !lastLoadedBlk ||
        message.blk > lastLoadedBlk ||
        (message.blk === lastLoadedBlk && message.i > lastLoadedI)
      ) {
        lastLoadedBlk = message.blk
        lastLoadedI = message.i
      }
      if (
        !firstLoadedBlk ||
        message.blk < firstLoadedBlk ||
        (message.blk === firstLoadedBlk && message.i < lastLoadedI)
      ) {
        firstLoadedBlk = message.blk
        firstLoadedI = message.i
      }
    })

    if (!firstLoadedBlk) return

    if (
      firstLoadedBlkBefore === firstLoadedBlk &&
      firstLoadedIBefore === firstLoadedI
    ) {
      // if ($lastTx.blk === firstLoadedBlk && $lastTx.i === firstLoadedI) {
      await Promise.all(
        loadedMessages.map(async (message) => {
          await messages.put(message)
        })
      )

      lastTx.set({ blk: lastLoadedBlk, i: lastLoadedI })

      console.log(`Found ${loadedMessages.length} new messages.`)
      return
    }

    loadChunk()
  }

  loadChunk()
}

fetchHistory()
fetchRecent()
