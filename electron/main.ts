import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { initializeDatabase } from './db/client';
import { registerIPCHandlers } from './ipc-handlers';
import { OllamaManager } from './ollama-manager';

let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
if (isDev) process.env.NODE_ENV = 'development';

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        backgroundColor: '#0f172a', // Tailwind slate-900
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#0f172a',
            symbolColor: '#e2e8f0', // slate-200
            height: 40
        },
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        },
        icon: path.join(__dirname, '../resources/icon.ico')
    });

    // Load React app
    if (isDev) {
        // Development: Load from Vite dev server (Next.js)
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    } else {
        // Production: Load from built files
        const indexPath = path.join(__dirname, '../../dashboard-ui/out/index.html');
        mainWindow.loadFile(indexPath);
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// App lifecycle
app.whenReady().then(async () => {
    try {
        // Initialize database
        const dbPath = path.join(app.getPath('userData'), 'meta-analysis.db');
        console.log(`📊 Initializing database at: ${dbPath}`);
        await initializeDatabase(dbPath);

        // Initialize Ollama manager
        const ollama = OllamaManager.getInstance();
        try {
            await ollama.checkConnection();
        } catch (e) {
            console.warn('⚠️ Could not connect to Ollama on startup. Local AI features may be disabled.');
        }

        // Register IPC handlers
        registerIPCHandlers();

        // Create window
        createWindow();
    } catch (error: any) {
        console.error('❌ Failed to initialize application:', error);
        app.whenReady().then(() => {
            dialog.showErrorBox(
                'Initialization Error',
                `Failed to start the application:\n\n${error.message}`
            );
        });
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);

    if (mainWindow) {
        dialog.showErrorBox(
            'Application Error',
            `An unexpected error occurred:\n\n${error.message}\n\nThe application will continue running, but some features may not work correctly.`
        );
    }
});

// Auto-updater (future enhancement)
/* 
import { autoUpdater } from 'electron-updater';

app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify();
});
*/
