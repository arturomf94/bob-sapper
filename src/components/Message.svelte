<script>
  import Icon from "fa-svelte";
  import { faCheckDouble, faCheck } from "@fortawesome/free-solid-svg-icons";

  export let text;
  export let sendByMe;
  export let mempool;
  export let broadcast;
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
</style>

<div
  class="text-sm mx-3 bg-grey-800 max-w-md {sendByMe ? 'text-right float-right rounded-l-lg' : 'text-left float-left rounded-r-lg'}
  text-white rounded-t-lg relative"
  style="padding: 0.5rem 0.75rem;">
  <div
    class="absolute bottom-0 {sendByMe ? 'pointer-right' : 'pointer-left'}" />
  {text}
  {#if mempool}
    <Icon class="ml-1 text-grey text-xs" icon={faCheckDouble} />
  {:else if broadcast}
    <Icon class="ml-1 text-grey text-xs" icon={faCheck} />
  {/if}
</div>
