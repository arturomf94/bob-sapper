import { writeable, derived } from "@svelte/store";
import Mnemonic from "bsv/mnemonic";

export const seed = writable(
  "armed visa shell domain among laugh bicycle smile matrix learn trumpet street"
);

export const xprivKey = derived(seed, ($seed) =>
  Mnemonic.fromString($seed).toHDPrivateKey()
);

export const privateKey = derived(xprivKey, ($xprivKey) =>
  $xprivKey.privateKey()
);
