// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  print: (printerName, copies) => {
    console.log("printer Name", printerName, "Copies", copies);
    for (let i = 0; i < Number(copies); i++) {
      ipcRenderer.send('print', { printerName });
    }
  },
  
  homedir: "Method Called and Home DIR",
  
  printHtmlContent: (htmlString, printername) => {
    console.log("from preload method before: htmlString" + htmlString + " printername " + printername);
    ipcRenderer.send('print-html-content', htmlString, printername);
    console.log("from preload method called: htmlString" + htmlString + " printername " + printername);
  },
  
  printBytes: (bytes, printername) => {
    console.log("from preload method before: printername " + printername);
    ipcRenderer.send('print-bytes', bytes, printername);
    console.log("from preload method after: printername " + printername);
  },

  // Auto-update API
  checkForUpdates: () => {
    ipcRenderer.send('check-for-updates');
  },
  
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (event, message) => callback(message));
  },
  
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, percent) => callback(percent));
  }
});