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
  import { fetchApiKey } from "../../mattercloud";
  import { apiKey } from "../../store/keys";
  import { seed, privateKey } from "../../store/wallet";
  // import { sendMessage } from "../../push";
  import datapay from "datapay";
  import { testSeed } from "../../seed";
  import * as bsvMessage from "bsv/message";
  import ReverseScroller from "../../components/ReverseScroller.svelte";

  export let recipient;
  let messages = [];
  let input;
  let batchSize = 30;
  let threshold = 300;
  let lastTimestamp = 0;

  $: address = $privateKey.toAddress().toString();

  $: query = {
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
      sort: { "blk.i": 1 },
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
  };

  function randomMessage() {
    return allMessages[(Math.random() * allMessages.length) | 0];
  }

  async function loadMore() {
    const res = await fetch("https://txo.bitsocket.network/crawl", {
      method: "post",
      headers: {
        "Content-type": "application/json; charset=utf-8",
        token: `eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJzdWIiOiIxTXRVdlU1VERhcUZiZDc1N1R2NTU3RVI1NWRKN0JSV3V3IiwiaXNzdWVyIjoiZ2VuZXJpYy1iaXRhdXRoIn0.SDhiTkE5RDVtcVhTbG1HaWZ2NStxVXE2U3YrUStaVWY2L3ErYVZScVMzV1BjNzFycDBMZCsyWjdldE15bkZlbmhGVEpsMy9FS3RkNTRWRUNEenZOR2VFPQ`
      },
      body: JSON.stringify(query)
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");

    async function readNext() {
      const { done, value } = await reader.read();

      if (done) return;
      const json = decoder.decode(value);
      const tx = JSON.parse(json);

      //TODO: Check signature

      messages = [{ text: tx.out[0].s5, sender: tx.out[0].s3 }, ...messages];

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
    const message = event.detail.text;

    messages = messages.concat({
      sender: address,
      text: message
    });
    // setTimeout(() => {
    //   messages = messages.concat({
    //     sendByMe: false,
    //     text: randomMessage()
    //   });
    // }, 200 + Math.random() * 200);
    // return;
    const signature = bsvMessage.sign(message, $privateKey);

    const data = [
      "13N6yAoibzWQ6MZPeoroeMAE8NRviupB75",
      address,
      recipient,
      message,
      signature
    ];
    console.log(data);

    datapay.connect({
      baseURL: "https://api.bitindex.network/api/v3/test",
      headers: { api_key: apiKey }
    });

    await datapay.send(
      {
        data,
        pay: { key: $privateKey.toString() }
      },
      (err, res) => console.log(message, res)
    );
  }

  onMount(async () => {
    await apiKey.load();
    if (!$apiKey) {
      $apiKey = await fetchApiKey();
    }

    $seed = testSeed;
    await privateKey.load();

    await loadMore();
  });
</script>

<ReverseScroller on:loadMore={loadMore}>
  {#each messages as { sender, text }, i}
    <div
      class="flex {sender == address ? 'flex-row-reverse' : 'flex-row'}"
      style="margin: 0.5rem;">
      <!-- {#if i === 0 || messages[i - 1].sendByMe}
          <div class="w-8 h-8 bg-grey-200 rounded-full mt-auto flex-shrink-0" />
        {/if} -->
      <Message sendByMe={sender == address} {text} />
    </div>
  {/each}
</ReverseScroller>
<Input on:send={handleSend} />
