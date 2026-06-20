/**
 * Shared type for the bridge exposed by `preload/index.ts` via
 * `contextBridge.exposeInMainWorld('electronAPI', …)`.
 *
 * Add new methods here as you grow the preload surface so every framework
 * variant gets the same typed `window.electronAPI`.
 */
export {}

declare global {
  interface Window {
    electronAPI: {
      platform: string
      versions: {
        node: string
        chrome: string
        electron: string
      }
    }
  }
}
