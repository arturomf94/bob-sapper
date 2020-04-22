<script>
  import SvelteInfiniteScroll from "svelte-infinite-scroll";
  import names from "../chats.js";
  import { onMount } from "svelte";
  import dexie from "dexie";
  import { privateKey, address } from "../store/wallet";
  import db from "../store/db";
  import { chats, sorted, messages, putMessage } from "../store/messages";
  import { readStream } from "../utils/stream";
  import { fetchBitbus, fetchBitsocket, getMessage } from "../planaria";
  import Navbar from "../components/Navbar.svelte";

  let page = 0;
  let size = 50;

  let menu = [{ title: "Import seed", url: "/loadseed" }];

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

  async function loadMore() {
    await address.loaded;
    const socketRes = await fetchBitsocket(query);
    readStream(socketRes, tx => putMessage(getMessage(tx)));

    const bitbusRes = await fetchBitbus(query);
    readStream(bitbusRes, tx => putMessage(getMessage(tx)));
  }

  onMount(async () => {
    await privateKey.loaded;
    loadMore();
  });
</script>

<svelte:head>
  <title>BOB Chats</title>
</svelte:head>

<Navbar {menu}>BOB</Navbar>
<ul style="overflow-x: scroll;" class="scrolling-touch flex-auto px-3 py-2">
  {#each $chats as chat}
    <li class="w-full py-2">
      <a
        href="/chat/{chat.recipient}"
        class="border-solid text-white flex flex-row">
        <div
          class="w-10 h-10 bg-grey-200 rounded-full flex-shrink-0 mr-2 my-auto" />
        <ul>
          <li>{chat.recipient}</li>
          <li class="text-sm text-grey-400">{chat.text}</li>
        </ul>
      </a>
    </li>
  {/each}
  <SvelteInfiniteScroll threshold={400} on:loadMore={loadMore} />
</ul>
