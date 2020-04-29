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
  // let messages = {};
  // $: sorted = Object.values(messages).sort((a, b) => a.timestamp - b.timestamp);

  // let localMessages = [];

  $: localMessages = $sorted.filter(
    message =>
      (message.recipient === recipient && message.sender === $pubKeyString) ||
      (message.sender === recipient && message.recipient === $pubKeyString)
  );

  $: recipientECIES = bsvEcies().publicKey(bsv.PublicKey.fromString(recipient));

  // const localMessages = derived(sorted, $sort =>
  //   $sort.filter(
  //     message => message.recpient == recipient || message.sender == recipient
  //   )
  // );

  let input;
  let batchSize = 30;
  let threshold = 300;
  let lastTimestamp = 0;
  let loadingAt;
  let lastFetched;
  let loading = false;

  $: query = {
    q: {
      find: {
        "out.s2": protocols.message,
        $or: [
          { "out.s3": $pubKeyString, "out.s4": recipient },
          {
            "out.s3": recipient,
            "out.s4": $pubKeyString
          }
        ]
      },
      // sort: { timestamp: -1 },
      project: {
        blk: 1,
        "tx.h": 1,
        "out.s3": 1,
        "out.s4": 1,
        "out.s5": 1,
        "out.s6": 1,
        "out.s7": 1,
        "out.o1": 1,
        "in.e": 1,
        timestamp: 1,
        "blk.i": 1
      },
      limit: 200
    }
  };

  $: queryString = JSON.stringify(query);

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

    const data = [
      protocols.message,
      $publicKey.toString(),
      recipient,
      encryptedText,
      messageToSelf,
      signature
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
      timestamp: Date.now()
    };

    messages.put(message);
    const res = await broadcast(tx.serialize());
    messages.put({
      ...message,
      broadcast: true
    });
  }

  onMount(async () => {
    await address.loaded;
    const res = await fetchBitsocket(queryString);
    readStream(res, tx => messages.put(getMessage(tx)));
    const bitbusRes = await fetchBitbus(queryString);
    readStream(bitbusRes, tx => messages.put(getMessage(tx)));
    // await sorted.loaded;
    // console.log($sorted);
    // console.log($messages);
  });
</script>

<Navbar back="/">
  {recipient}
  <div class="flex-grow" />
</Navbar>
<ReverseScroller on:loadMore={loadMore}>
  {#each localMessages as { sender, recipient, text, mempool, broadcast, timestamp, blk }, i}
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
