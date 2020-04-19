import { writable as sWritable, derived as sDerived } from "svelte/store"

export function writable(getter, setter) {
  const { subscribe, set } = sWritable()

  async function load() {
    set(await getter())
    return true
  }

  let loaded = typeof window !== "undefined" ? load() : false // SSR server will try to run this

  return {
    subscribe,
    set: (seed) => {
      set(seed)
      setter(seed)
    },
    get loaded() {
      return loaded
    }
  }
}

export function derived(value, ...opts) {
  return {
    ...sDerived(value, ...opts),
    get loaded() {
      return value.loaded
    }
  }
}
