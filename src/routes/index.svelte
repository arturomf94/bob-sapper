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
  import Icon from "fa-svelte";
  import {
    faSearch,
    faArrowRight,
    faQrcode
  } from "@fortawesome/free-solid-svg-icons";

  let page = 0;
  let size = 50;
  // let showSearch = false;
  let search;
  let input;

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

  // function handleSearch() {
  //   showSearch = !showSearch;
  //   if (showSearch) input.focus();
  // }

  onMount(async () => {
    await privateKey.loaded;
    loadMore();
  });
</script>

<style>
  .cut-text {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
</style>

<svelte:head>
  <title>BOB Chats</title>
</svelte:head>

<Navbar {menu}>
  BOB
  <!-- {#if showSearch} -->
  <div class="flex-grow mx-5 h-6">
    <input
      class="w-full bg-grey-500 rounded h-auto placeholder-grey-700 px-2
      text-black"
      placeholder="Search"
      bind:value={search}
      bind:this={input} />
  </div>
  <!-- {:else}
    <div class="flex-grow" />
  {/if} -->
  <!-- <button class="px-2 h-full" on:click={handleSearch}>
    <Icon class="float-right" icon={faSearch} />
  </button> -->
  <a class="px-2 h-full" href="/fund">
    <Icon class="float-right" icon={faQrcode} />
  </a>
</Navbar>
<ul style="overflow-x: scroll;" class="scrolling-touch flex-auto px-3 py-2">
  {#if search}
    <li class="w-full py-2">
      <a href="/chat/{search}" class="border-solid text-white flex flex-row">
        <Icon icon={faArrowRight} class="w-10 h-10 mr-2 my-auto" />
        Message Address {search}
      </a>
    </li>
  {:else}
    {#each $chats as chat}
      <li class="w-full py-2">
        <a
          href="/chat/{chat.contact}"
          class="border-solid text-white flex flex-row overflow-x-hidden">
          <div
            class="w-10 h-10 bg-grey-200 rounded-full flex-shrink-0 mr-2 my-auto" />
          <ul style="min-width:0;">
            <li>{chat.contact === $address ? 'Storage' : chat.contact}</li>
            <li class="text-sm text-grey-400 cut-text">{chat.text}</li>
          </ul>
        </a>
      </li>
    {/each}
  {/if}
  <SvelteInfiniteScroll threshold={400} on:loadMore={loadMore} />
</ul>
