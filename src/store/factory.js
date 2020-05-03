import { writable as sWritable, derived as sDerived } from "svelte/store"

export function writable(getter, setter, init = undefined) {
  const { subscribe, set, update } = sWritable(init)

  async function load() {
    set(await getter())
    return true
  }

  let loaded = typeof window !== "undefined" ? load() : false // SSR server will try to run this

  return {
    subscribe,
    set: async (value) => {
      set(value)
      await setter(value)
    },
    update,
    get loaded() {
      return loaded
    },
    load,
    reset: () => set(init)
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
