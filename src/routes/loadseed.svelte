<script>
  import { seed } from "../store/wallet";
  import Navbar from "../components/Navbar.svelte";

  let input;
  let loading = false;
  let success;

  async function saveSeed() {
    loading = true;
    $seed = input;
    input = "";
    success = true;
    loading = false;
  }
</script>

<Navbar back="/">
  Import seed
  <div class="flex-grow" />
</Navbar>
<div class="flex my-auto flex-col my-auto m-16">
  <h2 class="text-white font-bold text-2xl text-center p-3">
    Seed phrase import
  </h2>
  <div class="text-white text-center">
    Here you can import an existing seed phrase
  </div>
  <input
    class="w-full max-w-md mx-auto my-3 bg-grey-400 rounded p-2"
    bind:value={input} />
  <button
    class="text-white font-bold rounded p-2 mx-auto my-3 {loading ? 'spinner' : ''}
    bg-indigo-700"
    on:click={saveSeed}>
    {#if success}Success!{:else}Import seed phrase{/if}
  </button>
</div>
