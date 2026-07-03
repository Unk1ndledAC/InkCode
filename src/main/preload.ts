const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('inkCodeAPI', {
  exportFile: (args: { type: 'image' | 'source'; content: string; filePath: string }) =>
    ipcRenderer.invoke('export-file', args),
  getTabletInfo: () => ipcRenderer.invoke('get-tablet-info')
});
