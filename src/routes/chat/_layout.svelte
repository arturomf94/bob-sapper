<script>
  // import Navbar from "../components/Navbar.svelte";
  import { onMount, onDestroy } from "svelte";
  import { address, pubKeyString } from "../../store/wallet";
  import { messages } from "../../store/messages";
  import { getMessage, fetchBitbus, fetchBitsocket } from "../../planaria";
  import db from "../../store/db";
  import { gt } from "../../utils/versions";
  import protocols from "../../protocols";
  import { firstTx, lastTx } from "../../store/state";
  import { readStream } from "../../utils/stream";
  import { goto } from "@sapper/app";

  import {
    isPushNotificationSupported,
    askUserPermission,
    registerServiceWorker,
    createNotificationSubscription,
    getUserSubscription,
    sendNotification
  } from "../../push-notifications";

  const versions = {
    protocol: "0.0.3"
  };

  const project = {
    blk: 1,
    "tx.h": 1,
    "out.s3": 1,
    "out.s4": 1,
    "out.s5": 1,
    "out.s6": 1,
    "out.s7": 1,
    "out.s8": 1,
    "out.o1": 1,
    "in.e": 1,
    timestamp: 1,
    i: 1
  };
  const sort = { "blk.i": -1, i: -1 };

  $: txFilter = {
    $or: [
      { "out.s3": $pubKeyString },
      {
        "out.s4": $pubKeyString
      }
    ]
  };

  let socket;

  async function fetchHistory() {
    await address.loaded;
    await messages.loaded;
    await firstTx.loaded;

    async function loadChunk() {
      let res;
      let blkBefore;
      let iBefore;

      if (!$firstTx) {
        const query = JSON.stringify({
          q: {
            find: {
              "out.s2": protocols.message,
              ...txFilter
            },
            sort,
            project
          }
        });

        res = await fetchBitbus(query);
      } else if ($firstTx.blk === 0 && $firstTx.i === 0) {
        return;
      } else {
        blkBefore = $firstTx.blk;
        iBefore = $firstTx.i;

        const query = JSON.stringify({
          q: {
            find: {
              "out.s2": protocols.message,
              $and: [
                {
                  $or: [
                    { "blk.i": { $lt: $firstTx.blk } },
                    {
                      "blk.i": $firstTx.blk,
                      i: { $lt: $firstTx.i }
                    }
                  ]
                },
                txFilter
              ]
            },
            sort,
            project
          }
        });

        res = await fetchBitbus(query);
      }

      await readStream(res, tx => messages.put(getMessage(tx)));

      if (blkBefore === $firstTx.blk && iBefore === $firstTx.i) {
        $firstTx = { blk: 0, i: 0 };
        console.log("Loaded all historic messages.");
        return;
      }

      loadChunk();
    }

    loadChunk();
  }

  async function fetchRecent() {
    await address.loaded;
    await messages.loaded;
    await lastTx.loaded;

    let loadedMessages = [];
    let firstLoadedBlk;
    let firstLoadedI;
    let lastLoadedBlk;
    let lastLoadedI;

    async function loadChunk() {
      let res;
      let firstLoadedBlkBefore = firstLoadedBlk;
      let firstLoadedIBefore = firstLoadedI;

      if (!$lastTx) return;

      let query = {
        q: {
          find: {
            "out.s2": protocols.message,
            $and: [
              {
                $or: [
                  { "blk.i": { $gt: $lastTx.blk } },
                  {
                    "blk.i": $lastTx.blk,
                    i: { $gt: $lastTx.i }
                  }
                ]
              },
              txFilter
            ]
          },
          sort,
          project
        }
      };

      if (firstLoadedBlk) {
        const loadedFilter = {
          $or: [
            { "blk.i": { $lt: firstLoadedBlk } },
            {
              "blk.i": firstLoadedBlk,
              i: { $lt: firstLoadedI }
            }
          ]
        };
        query.q.find.$and.push(loadedFilter);
      }

      res = await fetchBitbus(JSON.stringify(query));

      await readStream(res, tx => {
        const message = getMessage(tx);
        loadedMessages.push(message);

        if (
          !lastLoadedBlk ||
          message.blk > lastLoadedBlk ||
          (message.blk === lastLoadedBlk && message.i > lastLoadedI)
        ) {
          lastLoadedBlk = message.blk;
          lastLoadedI = message.i;
        }
        if (
          !firstLoadedBlk ||
          message.blk < firstLoadedBlk ||
          (message.blk === firstLoadedBlk && message.i < lastLoadedI)
        ) {
          firstLoadedBlk = message.blk;
          firstLoadedI = message.i;
        }
      });

      if (!firstLoadedBlk) return;

      if (
        firstLoadedBlkBefore === firstLoadedBlk &&
        firstLoadedIBefore === firstLoadedI
      ) {
        // if ($lastTx.blk === firstLoadedBlk && $lastTx.i === firstLoadedI) {
        await Promise.all(
          loadedMessages.map(async message => {
            await messages.put(message);
          })
        );

        $lastTx = { blk: lastLoadedBlk, i: lastLoadedI };

        console.log(`Found ${loadedMessages.length} new messages.`);
        return;
      }

      loadChunk();
    }

    loadChunk();
  }

  async function createSocket() {
    await pubKeyString.loaded;

    const query = JSON.stringify({
      q: {
        find: {
          "out.s2": protocols.message,
          ...txFilter
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
          message = getMessage(tx);
        } catch (e) {
          console.log("Failed to unpack message:", e);
          return;
        }
        console.log(message);
        messages.put(message);
        sendNotification(message.text);
      }
    };
    console.log("Socket listening");
  }

  async function fetchMempool() {
    const query = JSON.stringify({
      q: {
        find: {
          "out.s2": protocols.message,
          ...txFilter
        },
        sort,
        project
      }
    });
    const res = await fetchBitsocket(query);
    await readStream(res, tx => messages.put(getMessage(tx)));
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

    // await $lastTx.loaded;
    // await $firstTx.loaded;
    // $firstTx = { blk: 632739, i: 3763 };
    // $lastTx = { blk: 632739, i: 3763 };

    const pushNotificationSupported = isPushNotificationSupported();
    if (pushNotificationSupported) {
      askUserPermission();
      registerServiceWorker();
      getUserSubscription();
      askUserPermission();
      createNotificationSubscription();
    }

    fetchMempool();
    fetchHistory();
    fetchRecent();
    createSocket();
  });

  onDestroy(() => {
    if (socket) socket.close();
  });
</script>

<div class="w-full flex flex-col h-screen bg-grey-900">
  <slot />
</div>
