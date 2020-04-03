<script>
  import { createEventDispatcher } from "svelte";
  import { onMount } from "svelte";

  const dispatch = createEventDispatcher();

  let text;
  let div;

  function handleKeydown(event) {
    if (event.which === 13) {
      event.preventDefault();

      if (!text) return;

      dispatch("send", {
        text
      });

      text = "";
    }
  }

  onMount(() => {
    div.focus();
  });
</script>

<div
  contenteditable="true"
  bind:this={div}
  bind:innerHTML={text}
  class="w-full min-h-8 text-white p-2 bg-grey-800 focus:outline-none
  align-middle"
  on:keydown={handleKeydown} />
