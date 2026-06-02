const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    frame: false,
    title: "PT. Farika Riau Perkasa - Batching Plant",
    icon: path.join(__dirname, 'build/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    backgroundColor: '#070b13', // Matches the main SCADA / HMI theme color
    show: false // Show window gracefully once content is ready
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Turn off default system menu to mimic industrial touch/HMI screen style
  Menu.setApplicationMenu(null);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// IPC Handlers for industrial administrator tools
ipcMain.on('exit-fullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(false);
  }
});

ipcMain.on('enter-fullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(true);
  }
});

ipcMain.on('open-devtools', () => {
  if (mainWindow) {
    mainWindow.webContents.openDevTools();
  }
});

ipcMain.on('restart-app', () => {
  app.relaunch();
  app.exit(0);
});

ipcMain.on('shutdown-app', () => {
  app.quit();
});

app.on('ready', () => {
  // --- ARCHITECTURE PREPARED FOR WINDOWS AUTO-START ---
  // To enable automatic startup of this HMI application when Windows powers on,
  // simply uncomment the code block below:
  /*
  app.setLoginItemSettings({
    openAtLogin: true,
    path: app.getPath('exe'),
    args: ['--autostart']
  });
  */

  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
