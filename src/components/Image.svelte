<script>
  import jazzicon from "jazzicon";
  import { onMount } from "svelte";

  export let address;
  let element;
  let px =
    2.5 * parseFloat(getComputedStyle(document.documentElement).fontSize);

  $: image = jazzicon(px, parseInt(address));

  onMount(() => {
    // console.log(address);
    element.appendChild(image);
  });
</script>

<div bind:this={element} class="w-10 h-10" />
