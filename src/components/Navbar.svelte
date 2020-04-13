<script>
  import Icon from "fa-svelte";
  import { faArrowLeft, faEllipsisV } from "@fortawesome/free-solid-svg-icons";

  export let segment;
  let dropdown = false;
</script>

<header class="p-3 bg-grey-800 flex items-center text-white">
  {#if segment}
    <a href="/" class="mr-2">
      <Icon icon={faArrowLeft} />
    </a>
  {/if}
  {segment || 'BOB'}
  <div class="flex-grow" />
  {#if !segment}
    <button
      class=""
      on:click={() => {
        dropdown = true;
      }}>
      <Icon icon={faEllipsisV} />
    </button>
  {/if}
</header>
{#if dropdown}
  <div
    class="absolute w-full h-full bg-transparent"
    on:click={() => {
      dropdown = false;
    }}>
    <div
      class="absolute right-0 mx-2 mt-10 py-1 w-40 bg-grey-700 text-white
      rounded shadow-xl">
      <a href="/loadseed" class="block px-3 py-1 text-gray-800">Import seed</a>
    </div>
  </div>
{/if}
