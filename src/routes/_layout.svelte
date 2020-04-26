<script>
  // import Navbar from "../components/Navbar.svelte";
  import { onMount } from "svelte";
  import { address } from "../store/wallet";
  import { messages } from "../store/messages";
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
    socket.onmessage = async event => {
      const data = JSON.parse(event.data);
      await messages.loaded;

      for (const tx of data.data) {
        console.log(tx);
        let message;
        try {
          message = getMessage(tx);
        } catch (e) {
          console.log("Failed to unpack message:", e);
          return;
        }
        console.log(message);
        messages.put(message);
      }
    };
    console.log("Socket listening");
  }

  onMount(async () => {
    createSocket();
  });
</script>

<div class="w-full flex flex-col h-screen bg-grey-900">
  <slot />
</div>
