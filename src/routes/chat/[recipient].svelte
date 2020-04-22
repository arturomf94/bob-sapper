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
  import { seed, privateKey, address } from "../../store/wallet";
  import { messages, sorted, putMessage } from "../../store/messages";
  import { build } from "../../transaction";
  import db from "../../store/db";
  import * as bsvMessage from "bsv/message";
  import ReverseScroller from "../../components/ReverseScroller.svelte";
  import { fetchBitsocket, getMessage } from "../../planaria";
  import { readStream } from "../../utils/stream";
  import { derived } from "svelte/store";
  import Navbar from "../../components/Navbar.svelte";

  export let recipient;
  // let messages = {};
  // $: sorted = Object.values(messages).sort((a, b) => a.timestamp - b.timestamp);

  // let localMessages = [];

  $: localMessages = $sorted.filter(
    message => message.recpient == recipient || message.sender == recipient
  );

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

  $: query = JSON.stringify({
    q: {
      find: {
        "out.s2": "13N6yAoibzWQ6MZPeoroeMAE8NRviupB75",
        $or: [
          { "out.s3": $address, "out.s4": recipient },
          {
            "out.s3": recipient,
            "out.s4": $address
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
        "out.o1": 1,
        "in.e": 1,
        timestamp: 1,
        "blk.i": 1
      },
      limit: 30
    }
  });

  async function loadMore() {
    if (loadingAt == localMessages.length) return;
    loadingAt = localMessages.length;

    console.log("loading");
    const loaded = await db.messages
      .orderBy("timestamp")
      .reverse()
      .limit(5)
      .toArray();

    Object.assign(
      $messages,
      loaded.reduce((obj, tx) => ((obj[tx.txid] = tx), obj), {})
    );

    const res = await fetchBitsocket(query);
    readStream(res, tx => putMessage(getMessage(tx)));
  }

  async function handleSend(event) {
    const text = event.detail.text;

    await privateKey.loaded;
    const signature = bsvMessage.sign(text, $privateKey);

    const data = [
      "13N6yAoibzWQ6MZPeoroeMAE8NRviupB75",
      $address,
      recipient,
      text,
      signature
    ];

    const tx = await build({
      data
    });

    putMessage({
      txid: tx.hash,
      recipient,
      sender: $address,
      text,
      broadcast: false,
      mempool: false,
      timestamp: Date.now()
    });
    const res = await broadcast(tx.serialize());
    $messages[tx.hash].broadcast = true;
  }

  // async function putMessage(tx) {
  //   const output = tx.out[0];
  //   const message = {
  //     text: output.s5,
  //     sender: output.s3,
  //     recipient: output.s4,
  //     timestamp: tx.timestamp || tx.blk.t,
  //     mempool: true,
  //     txid: tx.tx.h,
  //     prev: tx.in[0].e,
  //     blk: tx.blk ? tx.blk.i : undefined
  //   };
  //   $messages[tx.tx.h] = message;
  //   db.messages.put(message);
  // }

  onMount(async () => {
    await loadMore();
  });
</script>

<Navbar back="/">{recipient}</Navbar>
<ReverseScroller on:loadMore={loadMore}>
  {#each localMessages as { sender, text, mempool, broadcast }, i}
    <div
      class="flex {sender == $address ? 'flex-row-reverse' : 'flex-row'}"
      style="margin: 0.5rem;">
      <!-- {#if i === 0 || messages[i - 1].sendByMe}
          <div class="w-8 h-8 bg-grey-200 rounded-full mt-auto flex-shrink-0" />
        {/if} -->
      <Message sendByMe={sender == $address} {text} {mempool} {broadcast} />
    </div>
  {/each}
</ReverseScroller>
<Input on:send={handleSend} />
