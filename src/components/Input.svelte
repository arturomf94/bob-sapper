<script>
  import Icon from "fa-svelte";
  import { createEventDispatcher } from "svelte";
  import { onMount } from "svelte";
  import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
  import textareaResize from "../utils/textarea-resize";

  const dispatch = createEventDispatcher();

  let text;
  let area;

  function handleSend() {
    if (!text) return;

    dispatch("send", {
      text
    });

    text = "";
    area.style.height = "auto";
  }

  function handleKeydown(event) {
    if (event.shiftKey === false && event.which === 13) {
      event.preventDefault();

      handleSend();
    }
  }

  onMount(() => {
    setTimeout(() => area.focus(), 0);
  });
</script>

<div class="flex max-w-full ">
  <textarea
    rows="1"
    placeholder="New message"
    bind:this={area}
    bind:value={text}
    on:keydown={handleKeydown}
    use:textareaResize
    class="flex-grow min-h-8 text-white p-2 bg-grey-800 focus:outline-none
    align-middle overflow-x-hidden resize-none placeholder-grey-600
    overflow-y-auto" />
  <button on:click={handleSend} class="w-16 flex-shrink-0 bg-grey-900">
    <Icon icon={faPaperPlane} class="text-grey" />
  </button>
</div>
