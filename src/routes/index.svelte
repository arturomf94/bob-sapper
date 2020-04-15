<script>
  import SvelteInfiniteScroll from "svelte-infinite-scroll";
  import names from "../chats.js";
  import { onMount } from "svelte";
  import dexie from "dexie";
  import { privateKey } from "../store/wallet.js";

  let page = 0;
  let size = 50;
  let chats = [{ name: "self", address: $privateKey.toAddress() }];

  async function getRandomNames(page) {
    return Array.from(Array(size).keys()).map(e => {
      return {
        name: names[(Math.random() * names.length) | 0],
        address: "xxx"
      };
    });
  }

  async function loadMore() {
    // dexie.messages.where();
    page += 1;
    chats = [
      ...chats,
      ...(await getRandomNames(page)) //.splice(size * page, size * (page + 1) - 1)
    ];
  }

  onMount(async () => {
    loadMore();
  });
</script>

<svelte:head>
  <title>BOB Chats</title>
</svelte:head>

<ul style="overflow-x: scroll;" class="scrolling-touch flex-auto px-3 py-2">
  {#each chats as chat}
    <li class="w-full py-2">
      <a
        href="/chat/{chat.address}"
        class="border-solid text-white flex flex-row">
        <div
          class="w-10 h-10 bg-grey-200 rounded-full flex-shrink-0 mr-2 my-auto" />
        <ul>
          <li>{chat.name}</li>
          <li class="text-sm text-grey-400">test</li>
        </ul>
      </a>
    </li>
  {/each}
  <SvelteInfiniteScroll threshold={400} on:loadMore={loadMore} />
</ul>
