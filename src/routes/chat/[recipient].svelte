<script context="module">
  export async function preload(page, session) {
    return page.params;
  }
</script>

<script>
  import allMessages from "../../messages";
  import { onMount } from "svelte";
  import Message from "../../components/Message.svelte";
  import Input from "../../components/Input.svelte";
  import { broadcast } from "../../mattercloud";
  import { apiKey } from "../../store/keys";
  import { seed, privateKey } from "../../store/wallet";
  import { build } from "../../transaction";
  import db from "../../store/db";
  // import datapay from "datapay";
  // import { testSeed } from "../../seed";
  import * as bsvMessage from "bsv/message";
  import ReverseScroller from "../../components/ReverseScroller.svelte";

  export let recipient;
  let messages = {};
  $: sorted = Object.values(messages).sort((a, b) => a.timestamp - b.timestamp);

  let input;
  let batchSize = 30;
  let threshold = 300;
  let lastTimestamp = 0;
  let loadingAt;

  $: address = $privateKey ? $privateKey.toAddress().toString() : undefined;

  $: query = JSON.stringify({
    q: {
      find: {
        "out.s2": "13N6yAoibzWQ6MZPeoroeMAE8NRviupB75",
        $or: [
          { "out.s3": address, "out.s4": recipient },
          {
            "out.s3": recipient,
            "out.s4": address
          }
        ]
      },
      // sort: { timestamp: -1 },
      project: {
        blk: 1,
        "tx.h": 1,
        "out.s3": 1,
        "out.s5": 1,
        "out.s6": 1,
        "out.o1": 1,
        timestamp: 1
      },
      limit: 30
    }
  });

  function randomMessage() {
    return allMessages[(Math.random() * allMessages.length) | 0];
  }

  async function loadMore() {
    if (loadingAt == sorted.length) return;
    loadingAt = sorted.length;

    console.log("loading");
    const loaded = await db.messages
      .orderBy("timestamp")
      .reverse()
      .limit(5)
      .toArray();

    Object.assign(
      messages,
      loaded.reduce((obj, tx) => ((obj[tx.txid] = tx), obj), {})
    );

    const res = await fetch("https://txo.bitsocket.network/crawl", {
      method: "post",
      headers: {
        "Content-type": "application/json; charset=utf-8",
        token: `eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJzdWIiOiIxTXRVdlU1VERhcUZiZDc1N1R2NTU3RVI1NWRKN0JSV3V3IiwiaXNzdWVyIjoiZ2VuZXJpYy1iaXRhdXRoIn0.SDhiTkE5RDVtcVhTbG1HaWZ2NStxVXE2U3YrUStaVWY2L3ErYVZScVMzV1BjNzFycDBMZCsyWjdldE15bkZlbmhGVEpsMy9FS3RkNTRWRUNEenZOR2VFPQ`
      },
      body: query
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");

    async function readNext() {
      const { done, value } = await reader.read();

      if (done) return;
      const decoded = decoder.decode(value).split("\n");
      decoded.pop();
      console.log(decoded);
      for (const json of decoded) {
        const tx = JSON.parse(json);
        putMessage(tx);
      }

      //TODO: Check signature

      readNext();
    }
    await readNext();

    // messages = [
    //   ...Array.from(Array(batchSize).keys()).map(e => {
    //     return {
    //       sendByMe: Boolean((Math.random() * 2) | 0),
    //       text: randomMessage()
    //     };
    //   }),
    //   ...messages
    // ];
  }

  async function handleSend(event) {
    const text = event.detail.text;

    // setTimeout(() => {
    //   messages = messages.concat({
    //     sendByMe: false,
    //     text: randomMessage()
    //   });
    // }, 200 + Math.random() * 200);
    // return;

    await privateKey.loaded;
    const signature = bsvMessage.sign(text, $privateKey);

    const data = [
      "13N6yAoibzWQ6MZPeoroeMAE8NRviupB75",
      address,
      recipient,
      text,
      signature
    ];

    const tx = await build({
      data
    });

    const message = {
      sender: address,
      text,
      timestamp: Date.now(),
      mempool: false,
      txid: tx.hash
    };
    messages[tx.hash] = message;
    db.messages.put(message);
    const res = await broadcast(tx.serialize());
    messages[tx.hash].broadcast = true;
  }

  async function putMessage(tx) {
    const message = {
      text: tx.out[0].s5,
      sender: tx.out[0].s3,
      timestamp: tx.timestamp,
      mempool: true,
      txid: tx.tx.h
    };
    messages[tx.tx.h] = message;
    db.messages.put(message);
  }

  async function createSocket() {
    await address.loaded;
    await recipient.loaded;
    const socket = new EventSource(
      "https://txo.bitsocket.network/s/" + btoa(query)
    );
    socket.onmessage = event => {
      const data = JSON.parse(event.data);
      for (const tx of data.data) {
        putMessage(tx);
      }
    };
    console.log("Socket listening");
  }

  onMount(async () => {
    await loadMore();
    createSocket();
  });
</script>

<ReverseScroller on:loadMore={loadMore}>
  {#each sorted as { sender, text, mempool, broadcast }, i}
    <div
      class="flex {sender == address ? 'flex-row-reverse' : 'flex-row'}"
      style="margin: 0.5rem;">
      <!-- {#if i === 0 || messages[i - 1].sendByMe}
          <div class="w-8 h-8 bg-grey-200 rounded-full mt-auto flex-shrink-0" />
        {/if} -->
      <Message sendByMe={sender == address} {text} {mempool} {broadcast} />
    </div>
  {/each}
</ReverseScroller>
<Input on:send={handleSend} />
