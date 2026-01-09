const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { pathToFileURL } = require('url');
const fs = require("fs");
const preloadPath = path.resolve(__dirname, "preload.js");

let mainWindow;

// Configure auto-updater
autoUpdater.autoDownload = false; // Don't auto-download, ask user first
autoUpdater.autoInstallOnAppQuit = true;

function createWindow() {
  console.log("Preload path:", preloadPath);
  console.log("Exists:", fs.existsSync(preloadPath));

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.resolve(__dirname, preloadPath),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  mainWindow.webContents.openDevTools();

  // Load the local HTML file
  const indexPath = path.resolve(__dirname, 'index.html');
  const indexUrl = pathToFileURL(indexPath).toString();
  
  mainWindow.loadURL(indexUrl);

  // Check for updates after window loads
  mainWindow.webContents.once('did-finish-load', () => {
    // Check for updates 5 seconds after app starts
    setTimeout(() => {
      checkForUpdates();
    }, 5000);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Auto-Updater Event Handlers
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
  sendStatusToWindow('Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info);
  
  // Show dialog to user
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Available',
    message: `A new version (${info.version}) is available!`,
    detail: 'Do you want to download it now?',
    buttons: ['Download', 'Later'],
    defaultId: 0,
    cancelId: 1
  }).then((result) => {
    if (result.response === 0) {
      // User clicked "Download"
      autoUpdater.downloadUpdate();
      sendStatusToWindow('Downloading update...');
    }
  });
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Update not available:', info);
  sendStatusToWindow('App is up to date.');
});

autoUpdater.on('error', (err) => {
  console.error('Update error:', err);
  sendStatusToWindow('Error checking for updates: ' + err.message);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  
  console.log(log_message);
  sendStatusToWindow(log_message);
  
  // Send progress to renderer
  if (mainWindow) {
    mainWindow.webContents.send('download-progress', progressObj.percent);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info);
  
  // Show dialog to install now or later
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Ready',
    message: 'Update has been downloaded.',
    detail: 'The application will restart to install the update.',
    buttons: ['Restart Now', 'Restart Later'],
    defaultId: 0,
    cancelId: 1
  }).then((result) => {
    if (result.response === 0) {
      // User clicked "Restart Now"
      setImmediate(() => autoUpdater.quitAndInstall());
    }
  });
});

// Function to send status messages to renderer
function sendStatusToWindow(text) {
  console.log(text);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', text);
  }
}

// Function to manually check for updates
function checkForUpdates() {
  if (process.env.NODE_ENV === 'development') {
    console.log('Skipping update check in development mode');
    return;
  }
  autoUpdater.checkForUpdates();
}

// IPC Handlers
ipcMain.on('check-for-updates', () => {
  checkForUpdates();
});

ipcMain.on('print', (event, data) => {
  console.log('Print request received:', data);
  // Your print logic here
});

ipcMain.on('print-html-content', (event, htmlString, printername) => {
  console.log('Print HTML content:', htmlString, printername);
  // Your print HTML logic here
});

ipcMain.on('print-bytes', (event, bytes, printername) => {
  console.log('Print bytes:', printername);
  // Your print bytes logic here
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();

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