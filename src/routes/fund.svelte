<script>
  import { address } from "../store/wallet";
  import Navbar from "../components/Navbar.svelte";
  import Qr from "../components/Qr.svelte";
  import { fetchUTXOs } from "../mattercloud";
  import { onMount } from "svelte";
  import { utxos, sats } from "../store/utxos";

  let loaded = false;

  onMount(async () => {
    await address.loaded;
    $utxos = await fetchUTXOs($address);
    loaded = true;
  });
</script>

<Navbar back="/">
  Wallet Funding
  <div class="flex-grow" />
</Navbar>
<div class="flex my-auto flex-col my-auto m-16">
  {#if address.loaded}
    <h2 class="text-white font-bold text-2xl text-center p-3">
      {#if loaded}Balance: {$sats / 1000000} bsv{:else}Fetching balance...{/if}
    </h2>
    <h2 class="text-white font-bold text-2xl text-center p-3">{$address}</h2>

    <Qr value={$address} />
  {:else}
    <h2 class="text-white font-bold text-2xl text-center p-3">loading...</h2>
  {/if}
</div>
