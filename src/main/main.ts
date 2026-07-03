const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow: any = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'InkCode — Handwriting IDE',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    icon: path.join(__dirname, '..', '..', 'assets', 'icon.svg')
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'workbench.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// IPC: Export file (image or source code)
ipcMain.handle('export-file', async (_event: any, args: { type: 'image' | 'source'; content: string; filePath: string }) => {
  const fs = require('fs');
  const { type, content, filePath } = args;

  if (type === 'image') {
    // content is base64 PNG data
    const buffer = Buffer.from(content, 'base64');
    fs.writeFileSync(filePath, buffer);
  } else {
    // content is plain text source code
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  return { success: true, filePath };
});

// IPC: Get tablet device info
ipcMain.handle('get-tablet-info', async () => {
  // Return tablet availability info from the main process
  return {
    available: true,
    platform: process.platform
  };
});
