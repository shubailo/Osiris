/**
 * Global TypeScript declarations for Electron renderer process
 * Extends Window interface with electron API
 */

import type { ElectronAPI } from '../electron/preload';

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}

export { };
