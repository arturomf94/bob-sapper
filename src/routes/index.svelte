<script>
  import { onMount } from "svelte";
  import { address } from "../store/wallet";
  import { goto } from "@sapper/app";
  onMount(async () => {
    await address.loaded;
    if ($address) goto("/chat");
  });
</script>

<div class="flex my-auto flex-col my-auto m-16">
  Welcome to BOB!
  <a href="setup/loadseed">
    <button class="text-white font-bold rounded p-2 mx-auto my-3 bg-indigo-700">
      Setup
    </button>
  </a>
  <a href="setup/loadseed">
    <button class="text-white font-bold rounded p-2 mx-auto my-3 bg-indigo-700">
      Login
    </button>
  </a>
</div>
