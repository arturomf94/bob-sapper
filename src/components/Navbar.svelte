<script>
  import Icon from "fa-svelte";
  import { faArrowLeft, faEllipsisV } from "@fortawesome/free-solid-svg-icons";

  export let back = undefined;
  export let menu = undefined;
  let dropdown = false;
</script>

<header class="p-3 bg-grey-800 flex items-center text-white">
  {#if back}
    <a href={back} class="mr-2">
      <Icon icon={faArrowLeft} />
    </a>
  {/if}
  <slot>
    <div class="flex-grow" />
  </slot>
  {#if menu}
    <button
      class="px-2"
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
      {#each menu as item}
        {#if item.url}
          <a href={item.url} class="block px-3 py-1 text-gray-800">
            {item.title}
          </a>
        {:else}
          <button on:click={item.func} class="block px-3 py-1 text-gray-800">
            {item.title}
          </button>
        {/if}
      {/each}
    </div>
  </div>
{/if}
