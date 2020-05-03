<script>
  import Navbar from "../../components/Navbar.svelte";
  import { goto } from "@sapper/app";
  import { messages } from "../../store/messages";
  import { firstTx, lastTx } from "../../store/state";
  import db from "../../store/db";

  let loading = false;

  async function clear() {
    loading = true;
    await db.messages.clear();
    await db.state.clear();
    messages.reset();
    firstTx.reset();
    lastTx.reset();
    loading = false;
    await goto("/chat");
  }
</script>

<Navbar back="/chat">
  Settings
  <div class="flex-grow" />
</Navbar>
<div class="flex my-auto flex-col my-auto m-16">
  <h2 class="text-white font-bold text-2xl text-center p-3">Settings</h2>

  <button
    class="text-white font-bold rounded p-2 mx-auto my-3 {loading ? 'spinner' : ''}
    bg-indigo-700"
    on:click={clear}>
    Clear message storage
  </button>
</div>
