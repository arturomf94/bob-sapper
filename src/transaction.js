import bsv from "bsv"
import { get } from "svelte/store"
import { utxos, sats } from "./store/utxos"
import { privateKey, address } from "./store/wallet"
import { fetchUTXOs } from "./mattercloud"

const feeb = 1.0

export async function build({ data, to = [] }) {
  const tx = new bsv.Transaction()

  if (data && data.length) {
    const script = createDataScript(data)
    tx.addOutput(new bsv.Transaction.Output({ script, satoshis: 0 }))
  }

  // if (fee) tx.fee(fee)
  tx.feePerKb(feeb * 1000)

  to.forEach((receiver) => tx.to(receiver.address, receiver.value))

  await privateKey.loaded
  const key = get(privateKey)
  if (!key) {
    throw new Error("No seed loaded")
  }

  const address = key.toAddress()
  tx.change(address)

  if (get(sats) < tx.getFee()) {
    console.log("fetching utxos: ")
    const res = await fetchUTXOs(address)
    utxos.set(res)
  }

  tx.from(get(utxos))
  tx.sign(key)

  const change = tx.outputs[1]

  utxos.set([
    {
      txid: tx.hash,
      outputIndex: 1,
      vout: 1,
      satoshis: change.satoshis,
      value: change.satoshis / 1000,
      script: change.script.toHex()
    }
  ])

  return tx
}

function createDataScript(data) {
  if (typeof data === "string") return bsv.Script.fromHex(data)

  const script = new bsv.Script()

  // Add OP_RETURN
  script.add(bsv.Opcode.OP_FALSE)
  script.add(bsv.Opcode.OP_RETURN)

  // Add data
  for (const item of data) {
    if (typeof item === "object" && item.hasOwnProperty("op")) {
      script.add({ opcodenum: item.op })
    } else if (typeof item === "string" && /^0x/i.test(item)) {
      // e.g. 0x6d02
      script.add(Buffer.from(item.slice(2), "hex"))
    } else {
      script.add(Buffer.from(item))
    }
  }

  return script
}
