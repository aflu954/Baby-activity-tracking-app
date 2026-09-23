/** True in the single-file build hosted as a claude.ai artifact (no downloads, no service worker). */
export const IS_ARTIFACT = import.meta.env.VITE_TARGET === 'artifact';
