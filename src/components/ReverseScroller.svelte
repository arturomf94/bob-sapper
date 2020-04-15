<script>
  import { onMount, beforeUpdate, afterUpdate, tick } from "svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  let scroller = {};
  let autoscroll = false;
  let heightBeforeUpdate = 0;
  let loading;
  let threshold = 300;
  let height;
  let lastHeight;
  $: {
    if (lastHeight) {
      scroller.scrollTop -= height - lastHeight;
    }
    lastHeight = height;
  }

  beforeUpdate(() => {
    if (scroller) {
      heightBeforeUpdate = scroller.scrollHeight;
      autoscroll =
        scroller.offsetHeight + scroller.scrollTop > scroller.scrollHeight - 20;
    } else {
      autoscroll = true;
    }
  });

  afterUpdate(() => {
    if (autoscroll) {
      scroller.scrollTo(0, scroller.scrollHeight);
    } else if (loading) {
      scroller.scrollTo(
        0,
        scroller.scrollTop + (scroller.scrollHeight - heightBeforeUpdate)
      );
    }
    loading = false;
  });

  function handleScroll(event) {
    if (event.target.scrollTop <= threshold) {
      loading = true;
      dispatch("loadMore");
    }
  }

  onMount(async () => {
    scroller.scrollTop = scroller.scrollHeight;
  });
</script>

<style>
  .scroller {
    height: 100vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
</style>

<div bind:this={scroller} class="scroller flex-auto" on:scroll={handleScroll}>
  <slot />
</div>
<svelte:window bind:innerHeight={height} />
