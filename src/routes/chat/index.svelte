<script>
  import SvelteInfiniteScroll from "svelte-infinite-scroll";
  import { onMount } from "svelte";
  import { address, pubKeyString, seed } from "../../store/wallet";
  import { chats, messages } from "../../store/messages";
  import { firstTx, lastTx } from "../../store/state";
  import Navbar from "../../components/Navbar.svelte";
  import Icon from "fa-svelte";
  import db from "../../store/db";
  import { goto } from "@sapper/app";
  import protocols from "../../protocols";
  import {
    faSearch,
    faArrowRight,
    faQrcode
  } from "@fortawesome/free-solid-svg-icons";

  let Image;
  let page = 0;
  let size = 50;
  // let showSearch = false;
  let search;
  let input;

  let menu = [
    { title: "Logout", func: logout },
    { title: "Settings", url: "/chat/settings" }
  ];

  // function handleSearch() {
  //   showSearch = !showSearch;
  //   if (showSearch) input.focus();
  // }

  async function loadMore() {}

  async function logout() {
    await db.wallet.clear();
    await db.messages.clear();
    await db.state.clear();
    seed.reset();
    messages.reset();
    firstTx.reset();
    lastTx.reset();

    goto("/");
  }

  onMount(async () => {
    const imageModule = await import("../../components/Image.svelte");
    Image = imageModule.default;
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
  <a class="px-2 h-full" href="/chat/fund">
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
            class="w-10 h-10 bg-grey-200 rounded-full flex-shrink-0 mr-2 my-auto
            overflow-hidden">
            <svelte:component this={Image} pubKey={chat.contact} />
          </div>
          <ul style="min-width:0;">
            <li>{chat.contact === $pubKeyString ? 'Storage' : chat.contact}</li>
            <li class="text-sm text-grey-400 cut-text">{chat.text}</li>
          </ul>
        </a>
      </li>
    {/each}
  {/if}
  <SvelteInfiniteScroll threshold={400} on:loadMore={loadMore} />
</ul>
