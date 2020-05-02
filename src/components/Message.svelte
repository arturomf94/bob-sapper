<script>
  import Icon from "fa-svelte";
  import { faCheckDouble, faCheck } from "@fortawesome/free-solid-svg-icons";
  import { timeSince } from "../utils/time";
  import DOMPurify from "dompurify";
  import marked from "../utils/marked";

  export let text;
  export let sendByMe;
  export let mempool;
  export let broadcast;
  export let timestamp;
  export let block;

  $: datetime = timestamp
    ? // ? new Date(timestamp).toLocaleTimeString([], {
      //     hour: "2-digit",
      //     minute: "2-digit",
      //     hour12: false
      //   })
      timeSince(new Date(timestamp))
    : undefined;
</script>

<style>
  .pointer-right {
    border-right: 0.5rem solid transparent;
    border-top: 0.5rem solid transparent;
    border-left: 0.5rem solid #424242;
    border-bottom: 0.5rem solid #424242;
    right: -0.5rem;
  }

  .pointer-left {
    border-left: 0.5rem solid transparent;
    border-top: 0.5rem solid transparent;
    border-right: 0.5rem solid #424242;
    border-bottom: 0.5rem solid #424242;
    left: -0.5rem;
  }

  .bubble {
    padding: 0.5rem 0.75rem;
    min-width: 0;
  }

  .smoltext {
    font-size: 0.5rem;
  }
</style>

<div
  class="text-sm mx-3 bg-grey-800 max-w-md {sendByMe ? 'text-left float-right rounded-l-lg' : 'text-left float-left rounded-r-lg'}
  text-white rounded-t-lg relative break-words bubble">
  <div
    class="absolute bottom-0 {sendByMe ? 'pointer-right' : 'pointer-left'}" />
  <span
    class="{sendByMe ? (datetime ? 'mr-10' : 'mr-2') : datetime ? 'mr-6' : ''}
    markdown">
    {@html marked(DOMPurify.sanitize(text))}
  </span>
  <div class="absolute right-0 bottom-0 mr-2 mb-1 smoltext">
    {#if datetime}
      <span class="text-grey-300 smoltext">{datetime}</span>
    {/if}
    {#if sendByMe}
      {#if mempool}
        <Icon class="ml-1 text-grey smoltext" icon={faCheckDouble} />
      {:else if broadcast}
        <Icon class="ml-1 text-grey smoltext" icon={faCheck} />
      {/if}
    {/if}

  </div>

</div>
