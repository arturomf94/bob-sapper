<script>
  import { onMount, onDestroy } from "svelte";
  import { address, pubKeyString, decryptECIES } from "../../store/wallet";
  import { messages } from "../../store/messages";
  import { getMessage, sort, project } from "../../planaria";
  import db from "../../store/db";
  import { gt } from "../../utils/versions";
  import protocols from "../../protocols";
  import { goto } from "@sapper/app";

  const versions = {
    protocol: "0.0.3"
  };

  let socket;

  async function createSocket() {
    await pubKeyString.loaded;

    const query = JSON.stringify({
      q: {
        find: {
          "out.s2": protocols.message,
          $or: [
            { "out.s3": $pubKeyString },
            {
              "out.s4": $pubKeyString
            }
          ]
        },
        sort,
        project
      }
    });

    socket = new EventSource("https://txo.bitsocket.network/s/" + btoa(query));

    socket.onmessage = async event => {
      const data = JSON.parse(event.data);
      await messages.loaded;

      for (const tx of data.data) {
        console.log(tx);
        let message;
        try {
          message = await getMessage(tx, $pubKeyString, $decryptECIES);
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
    console.log("start");
    await address.loaded;
    if (!$address) await goto("/");

    const prevVersion = await db.versions.get("protocol");
    if (!prevVersion || gt(versions.protocol, prevVersion.version)) {
      console.log("New version found, resetting storage");
      db.messages.clear();
    }
    db.versions.put({ module: "protocol", version: versions.protocol });

    const bitbusWorker = await import("../../workers/bitbus.worker");
    const mempoolWorker = await import("../../workers/mempool.worker");
    const bitbus = new bitbusWorker.default();
    const mempool = new mempoolWorker.default();

    createSocket();
  });

  onDestroy(() => {
    if (socket) socket.close();
  });
</script>

<div class="w-full flex flex-col h-screen bg-grey-900">
  <slot />
</div>
