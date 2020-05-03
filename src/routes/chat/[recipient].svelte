<script context="module">
  export async function preload(page, session) {
    return page.params;
  }
</script>

<script>
  import { onMount } from "svelte";
  import Message from "../../components/Message.svelte";
  import Input from "../../components/Input.svelte";
  import { broadcast } from "../../mattercloud";
  import {
    seed,
    privateKey,
    address,
    encryptECIES,
    decryptECIES,
    publicKey,
    pubKeyString
  } from "../../store/wallet";
  import { messages, sorted } from "../../store/messages";
  import { build } from "../../transaction";
  import db from "../../store/db";
  import ReverseScroller from "../../components/ReverseScroller.svelte";
  import { fetchBitsocket, getMessage, fetchBitbus } from "../../planaria";
  import { readStream } from "../../utils/stream";
  import { derived } from "svelte/store";
  import Navbar from "../../components/Navbar.svelte";
  import protocols from "../../protocols";

  import bsv from "bsv";
  import bsvEcies from "bsv/ecies";
  import * as bsvMessage from "bsv/message";

  export let recipient;

  $: localMessages = $sorted.filter(
    message =>
      (message.recipient === recipient && message.sender === $pubKeyString) ||
      (message.sender === recipient && message.recipient === $pubKeyString)
  );

  $: recipientECIES = bsvEcies().publicKey(bsv.PublicKey.fromString(recipient));

  let input;
  let batchSize = 30;
  let threshold = 300;
  let lastTimestamp = 0;
  let loadingAt;
  let lastFetched;
  let loading = false;

  async function loadMore() {
    // await messages.loaded;
    // const lastLoaded = localMessages[0].blk;

    // if (loading) return;
    // loading = true;

    // if (!lastFetched) lastFetched = lastLoaded;

    console.log("loading");

    // const loaded = await db.messages
    //   .where("blk")
    //   .between(lastFetched - 5, lastFetched, true, true)
    //   .toArray();

    // messages.bulkPut(loaded, false);

    // const q = query;
    // q.q.find["blk.i"] = { $lte: lastFetched, $gte: lastFetched - 5 };

    // const res = await fetchBitsocket(JSON.stringify(q));
    // readStream(res, tx => messages.put(getMessage(tx)));

    // lastFetched += -5;
    // loading = false;
  }

  async function handleSend(event) {
    const text = event.detail.text;

    await privateKey.loaded;
    const signature = bsvMessage.sign(text, $privateKey);

    const encryptedText = recipientECIES.encrypt(text).toString("hex");
    const messageToSelf = $encryptECIES.encrypt(text).toString("hex");

    const timestamp = Date.now();

    const data = [
      protocols.message,
      $publicKey.toString(),
      recipient,
      encryptedText,
      messageToSelf,
      signature,
      timestamp.toString()
    ];

    const tx = await build({
      data
    });

    const message = {
      txid: tx.hash,
      recipient,
      sender: $publicKey.toString(),
      text,
      signature,
      broadcast: false,
      mempool: false,
      timestamp
    };

    messages.put(message);
    const res = await broadcast(tx.serialize());
    messages.put({
      ...message,
      broadcast: true
    });
  }
</script>

<Navbar back="/chat">
  <div class="overflow-hidden">{recipient}</div>
  <div class="flex-grow" />
</Navbar>
<ReverseScroller on:loadMore={loadMore}>
  {#each localMessages as { sender, recipient, text, mempool, broadcast, timestamp, blk }, index}
    <div
      class="flex {sender == $pubKeyString ? 'flex-row-reverse' : 'flex-row'}"
      style="margin: 0.5rem;">
      <!-- {#if i === 0 || messages[i - 1].sendByMe}
          <div class="w-8 h-8 bg-grey-200 rounded-full mt-auto flex-shrink-0" />
        {/if} -->
      <Message
        sendByMe={sender == $pubKeyString}
        {text}
        {mempool}
        {broadcast}
        {timestamp}
        block={blk} />
    </div>
  {/each}
</ReverseScroller>
<Input on:send={handleSend} />
