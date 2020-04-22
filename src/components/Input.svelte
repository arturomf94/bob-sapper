<script>
  import Icon from "fa-svelte";
  import { createEventDispatcher } from "svelte";
  import { onMount } from "svelte";
  import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";

  const dispatch = createEventDispatcher();

  let text;
  let div;

  function handleSend() {
    if (!text) return;

    dispatch("send", {
      text
    });

    text = "";
  }

  function handleKeydown(event) {
    if (event.which === 13) {
      event.preventDefault();

      handleSend();
    }
  }

  onMount(() => {
    div.focus();
  });
</script>

<div class="flex max-w-full ">
  <div
    contenteditable="true"
    bind:this={div}
    bind:innerHTML={text}
    class="flex-grow min-h-8 text-white p-2 bg-grey-800 focus:outline-none
    align-middle overflow-x-hidden"
    on:keydown={handleKeydown} />
  <button on:click={handleSend} class="w-16 flex-shrink-0 bg-grey-900">
    <Icon icon={faPaperPlane} class="text-grey" />
  </button>
</div>
