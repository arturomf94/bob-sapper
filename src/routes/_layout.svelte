<script>
  import Navbar from "../components/Navbar.svelte";

  export let segment;
</script>

<div class="w-full flex flex-col h-screen bg-grey-900">
  <Navbar {segment} />
  <slot />
</div>
