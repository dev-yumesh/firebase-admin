/** Stable unique ids for storage object paths (works in browser and Node). */
export const ID = {
  unique(): string {
    if (typeof globalThis.crypto?.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
    return `id_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  },
};
