const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  Notification,
  dialog,
  Tray,
} = require('electron');
const path = require('path');
const fs = require('fs');
const appPath = app.getPath('userData');

let mainWindow, addTimedWindow, addImagedWindow, addWindow;
let tray = null;

app.on('ready', function () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('index.html');
  mainWindow.on('closed', function () {
    app.quit();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);

  Menu.setApplicationMenu(mainMenu);

  mainWindow.on('minimize', function (event) {
    event.preventDefault();
    mainWindow.hide();
    tray = createTray();
  });

  mainWindow.on('restore', function (event) {
    mainWindow.show();
    tray.destroy();
  });
});

function createTray() {
  let iconPath = path.join(__dirname, './assets/images/icon.png');
  let appIcon = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate(iconMenuTemplate);

  appIcon.on('double-click', function (event) {
    mainWindow.show();
  });

  appIcon.setToolTip('تطبيق إدارة المهام');

  appIcon.setContextMenu(contextMenu);

  return appIcon;
}

const iconMenuTemplate = [
  {
    label: 'فتح',
    click: function () {
      mainWindow.show();
    },
  },
  {
    label: 'إغلاق',
    click: function () {
      app.quit();
    },
  },
];

const mainMenuTemplate = [
  {
    label: 'القائمة',
    submenu: [
      {
        label: 'إضافة مهمة',
        click() {
          initAddWindow();
        },
      },
      {
        label: 'إضافة مهمة مؤقتة',
        click() {
          createTimedWindow();
        },
      },
      {
        label: 'إضافة مهمة مع صورة',
        click() {
          createImagedWindow();
        },
      },
      {
        label: 'خروج',
        //اختصار للقائمة
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click() {
          app.quit();
        },
      },
    ],
  },
];

if (process.platform === 'darwin') {
  mainMenuTemplate.unshift({});
}

ipcMain.on('create-txt', function (e, note) {
  let dest = Date.now() + '-Task.txt';
  dialog
    .showSaveDialog({
      title: 'اختار مكان حفظ الملف',
      defaultPath: path.join(__dirname, './' + dest),
      buttonLabel: 'Save',
      filters: [
        {
          name: 'Text Files',
          extensions: ['txt'],
        },
      ],
      properties: [],
    })
    .then((file) => {
      if (!file.canceled) {
        fs.writeFile(file.filePath.toString(), note, function (err) {
          if (err) throw err;
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

ipcMain.on('new-normal', function (e) {
  initAddWindow();
});

function initAddWindow() {
  addWindow = new BrowserWindow({
    width: 400,
    height: 250,
    title: 'إضافة مهمة جديدة',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  addWindow.loadFile(path.join(__dirname, './views/normalTask.html'));

  addWindow.on('closed', (e) => {
    e.preventDefault();
    addWindow = null;
  });

  addWindow.removeMenu();
}

//استقبال حدث اضافة مهمة عادية من العملية الفرعية
ipcMain.on('add-normal-task', function (e, item) {
  mainWindow.webContents.send('add-normal-task', item);

  addWindow.close();
});

ipcMain.on('new-timed', function (e) {
  createTimedWindow();
});

function createTimedWindow() {
  addTimedWindow = new BrowserWindow({
    width: 400,
    height: 400,
    title: 'إضافة مهمة جديدة',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  addTimedWindow.loadFile(path.join(__dirname, './views/timedTask.html'));

  addTimedWindow.on('closed', (e) => {
    e.preventDefault();
    addTimedWindow = null;
  });

  addTimedWindow.removeMenu();
}

ipcMain.on('add-timed-note', function (e, note, notificationTime) {
  mainWindow.webContents.send('add-timed-note', note, notificationTime);

  addTimedWindow.close();
});

ipcMain.on('notify', function (e, taskValue) {
  new Notification({
    title: 'لديك تنبية من مهامك',
    body: taskValue,
    icon: path.join(__dirname, './assets/images/icon.png'),
  }).show();
});

ipcMain.on('new-imaged', function (e) {
  createImagedWindow();
});

function createImagedWindow() {
  addImagedWindow = new BrowserWindow({
    width: 400,
    height: 420,
    title: 'إضافة مهمة جديدة',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  addImagedWindow.loadFile(path.join(__dirname, './views/imagedTask.html'));

  addImagedWindow.on('closed', (e) => {
    e.preventDefault();
    addImagedWindow = null;
  });

  addImagedWindow.removeMenu();
}

ipcMain.on('upload-image', function (event) {
  dialog
    .showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }],
    })
    .then((result) => {
      event.sender.send('open-file', result.filePaths, appPath);
    });
});

ipcMain.on('add-imaged-task', function (e, note, imgURI) {
  mainWindow.webContents.send('add-imaged-task', note, imgURI);

  addImagedWindow.close();
});

if (process.env.NODE_ENV !== 'production') {
  mainMenuTemplate.push({
    label: 'أدوات المطور',
    submenu: [
      {
        label: 'فتح وإغلاق أدوات المطور',
        accelerator: process.platform === 'darwin' ? 'Cmd+D' : 'Ctrl+D',
        click() {
          mainWindow.toggleDevTools();
        },
      },
      {
        label: 'إعادة تحميل التطبيق',
        role: 'reload',
      },
    ],
  });
}
