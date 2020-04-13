<script>
  import SvelteInfiniteScroll from "svelte-infinite-scroll";
  import names from "../chats.js";

  let page = 0;
  let size = 50;
  let chats = [];

  function getRandomNames(page) {
    return Array.from(Array(size).keys()).map(
      e => names[(Math.random() * names.length) | 0]
    );
  }

  $: chats = [
    ...chats,
    ...getRandomNames(page) //.splice(size * page, size * (page + 1) - 1)
  ];
</script>

<svelte:head>
  <title>BOB Chats</title>
</svelte:head>

<ul style="overflow-x: scroll;" class="scrolling-touch flex-auto px-3 py-2">
  {#each chats as chat}
    <li class="w-full py-2">
      <a href="/chat/xxx" class="border-solid text-white flex flex-row">
        <div
          class="w-10 h-10 bg-grey-200 rounded-full flex-shrink-0 mr-2 my-auto" />
        <ul>
          <li>{chat}</li>
          <li class="text-sm text-grey-400">test</li>
        </ul>
      </a>
    </li>
  {/each}
  <SvelteInfiniteScroll threshold={400} on:loadMore={() => page++} />
</ul>
