<script>
  import Icon from "fa-svelte";
  import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

  export let segment;
</script>

<header class="p-3 bg-grey-800 flex items-center text-white">
  {#if segment}
    <a href="/" class="mr-2">
      <Icon icon={faArrowLeft} />
    </a>
  {/if}
  {segment || 'BOB'}
</header>
