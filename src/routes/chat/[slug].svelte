<script context="module">
  export async function preload(page, session) {
    return page.params;
  }
</script>

<script>
  import allMessages from "../../messages";
  import { onMount, beforeUpdate, afterUpdate, tick } from "svelte";
  import Message from "../../components/Message.svelte";
  import Input from "../../components/Input.svelte";
  import Navbar from "../../components/Navbar.svelte";

  function randomMessage() {
    return allMessages[(Math.random() * allMessages.length) | 0];
  }

  export let slug;

  let messages = [];
  let input;
  let batchSize = 30;
  let threshold = 300;

  function loadMore() {
    loading = true;
    messages = [
      ...Array.from(Array(batchSize).keys()).map(e => {
        return {
          sendByMe: Boolean((Math.random() * 2) | 0),
          text: randomMessage()
        };
      }),
      ...messages
    ];
  }

  let scroller = {};
  let autoscroll = false;
  let heightBeforeUpdate = 0;
  let loading;

  let height;
  let lastHeight;
  $: {
    if (lastHeight) {
      scroller.scrollTop -= height - lastHeight;
    }
    lastHeight = height;
  }

  beforeUpdate(() => {
    if (scroller) {
      heightBeforeUpdate = scroller.scrollHeight;
      autoscroll =
        scroller.offsetHeight + scroller.scrollTop > scroller.scrollHeight - 20;
    } else {
      autoscroll = true;
    }
  });

  afterUpdate(() => {
    if (autoscroll) {
      scroller.scrollTo(0, scroller.scrollHeight);
    } else if (loading) {
      scroller.scrollTo(
        0,
        scroller.scrollTop + (scroller.scrollHeight - heightBeforeUpdate)
      );
    }
    loading = false;
  });

  function handleScroll(event) {
    if (event.target.scrollTop <= threshold) {
      loadMore();
    }
  }

  function handleSend(event) {
    messages = messages.concat({
      sendByMe: true,
      text: event.detail.text
    });
    setTimeout(() => {
      messages = messages.concat({
        sendByMe: false,
        text: randomMessage()
      });
    }, 200 + Math.random() * 200);
  }

  function handleResize() {
    scroller.console.log("tet");
  }

  onMount(async () => {
    await loadMore();
    scroller.scrollTop = scroller.scrollHeight;
  });
</script>

<style>
  .scroller {
    height: 100vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
</style>

<div bind:this={scroller} class="scroller flex-auto" on:scroll={handleScroll}>
  {#each messages as { sendByMe, text }, i}
    <div
      class="flex {sendByMe ? 'flex-row-reverse' : 'flex-row'}"
      style="margin: 0.5rem;">
      <!-- {#if i === 0 || messages[i - 1].sendByMe}
          <div class="w-8 h-8 bg-grey-200 rounded-full mt-auto flex-shrink-0" />
        {/if} -->
      <Message {sendByMe} {text} />
    </div>
  {/each}
</div>
<Input on:send={handleSend} />

<svelte:window bind:innerHeight={height} />
