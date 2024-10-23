const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  console.time('Creación de ventana');
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
  win.webContents.openDevTools();

  win.webContents.on('did-finish-load', () => {
    console.timeEnd('Creación de ventana');
  });
}

app.whenReady().then(() => {
  console.time('Inicio de la aplicación');
  createWindow();
  console.timeEnd('Inicio de la aplicación');
});

app.on('window-all-closed', () => {
  console.log('Todas las ventanas cerradas');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('Activando aplicación');
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
