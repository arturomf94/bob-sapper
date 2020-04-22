<script>
  // import Navbar from "../components/Navbar.svelte";
  import { onMount } from "svelte";
  import { address } from "../store/wallet";
  import { messages, putMessage } from "../store/messages";
  import { getMessage } from "../planaria";
  import db from "../store/db";

  $: query = JSON.stringify({
    q: {
      find: {
        "out.s2": "13N6yAoibzWQ6MZPeoroeMAE8NRviupB75",
        $or: [
          { "out.s3": $address },
          {
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
        timestamp: 1
      },
      limit: 30
    }
  });

  async function createSocket() {
    await address.loaded;
    const socket = new EventSource(
      "https://txo.bitsocket.network/s/" + btoa(query)
    );
    socket.onmessage = event => {
      const data = JSON.parse(event.data);
      for (const tx of data.data) {
        console.log(tx);
        const message = getMessage(tx);
        console.log(message);
        putMessage(message);
      }
    };
    console.log("Socket listening");
  }

  onMount(async () => {
    createSocket();
    const loaded = await db.messages
      .orderBy("timestamp")
      .reverse()
      .limit(1000)
      .toArray();
    $messages = loaded.reduce((acc, m) => {
      acc[m.txid] = m;
      return acc;
    }, {});
    // Object.assign(
    //   $messages,
    //   await db.messages
    //     .orderBy("timestamp")
    //     .reverse()
    //     .limit(1000)
    // );
  });
</script>

<div class="w-full flex flex-col h-screen bg-grey-900">
  <slot />
</div>
