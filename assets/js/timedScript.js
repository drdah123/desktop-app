const { ipcRenderer } = require('electron');
const form = document.querySelector('form');

form.addEventListener('submit', function (e) {
  e.preventDefault();
  let note = document.querySelector('.note').value;
  let pickedHours = document.querySelector('.pick-hours').value * 3600000;
  let pickedMinutes = document.querySelector('.pick-minutes').value * 60000;
  let notificationTime = Date.now();
  notificationTime += pickedHours + pickedMinutes;
  notificationTime = new Date(notificationTime);

  ipcRenderer.send('add-timed-note', note, notificationTime);
});
