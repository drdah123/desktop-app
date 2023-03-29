const { ipcRenderer } = require('electron');
const form = document.querySelector('form');
const fs = require('fs');
const path = require('path');

let fileName, filePath, imagePath;

let btn = document.querySelector('.img-upload');
let urlImg = document.querySelector('.url-image__input');

btn.addEventListener('click', function () {
  if (urlImg.value.length == 0) {
    ipcRenderer.send('upload-image');
  }
});

ipcRenderer.on('open-file', (event, arg, appPath) => {
  if (urlImg.value.length == 0) {
    imagePath = arg[0];
    fileName = path.basename(imagePath);
    filePath =
      process.platform === 'win32'
        ? appPath + '\\' + fileName
        : appPath + fileName;
  }
});

form.addEventListener('submit', function (e) {
  e.preventDefault();
  const input = document.querySelector('.note').value;
  const urlImgPath = urlImg.value;
  if (urlImg.value.length == 0) {
    fs.copyFile(imagePath, filePath, (err) => {
      if (err) throw err;
    });
    ipcRenderer.send('add-imaged-task', input, filePath);
  } else if (urlImg.value.length !== 0) {
    ipcRenderer.send('add-imaged-task', input, urlImgPath);
  }
});
