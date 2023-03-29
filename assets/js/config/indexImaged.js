const { ipcRenderer } = require('electron');
const fs = require('fs');
const connection = require('./connection');

let newImaged = document.querySelector('.todo--images .add-new-task');

newImaged.addEventListener('click', function () {
  ipcRenderer.send('new-imaged');
});

ipcRenderer.on('add-imaged-task', function (e, note, imgURI) {
  addImagedTask(note, imgURI);
});

function addImagedTask(note, imgURI) {
  connection
    .insert({
      into: 'imaged',
      values: [
        {
          note: note,
          img_uri: imgURI,
        },
      ],
    })
    .then(() => showImaged());
}

function updateImagedTask(taskId, taskValue) {
  connection
    .update({
      in: 'imaged',
      where: {
        id: taskId,
      },
      set: {
        note: taskValue,
      },
    })
    .then(() => showImaged());
}

function deleteImagedTask(tasksId, imgPath) {
  if (imgPath) {
    fs.unlink(imgPath, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
  }
  return connection
    .remove({
      from: 'imaged',
      where: {
        id: tasksId,
      },
    })
    .then(() => showImaged());
}

function showImaged() {
  let clearImagedBtn = document.querySelector('.todo--images .clear-all');
  let imagedList = document.querySelector('.todo--images__list');
  imagedList.innerHTML = '';

  connection
    .select({
      from: 'imaged',
    })
    .then((tasks) => {
      if (tasks.length == 0) {
        clearImagedBtn.classList.remove('clear-all--show');

        imagedList.innerHTML = '<li class="empty-list">لا توجد مهام</li>';
      } else {
        clearImagedBtn.classList.add('clear-all--show');

        clearImagedBtn.addEventListener('click', function () {
          return connection
            .remove({
              from: 'imaged',
            })
            .then(() => showImaged());
        });
        for (let task of tasks) {
          let listItem = document.createElement('li'),
            imageHolder = document.createElement('div'),
            noteContentHolder = document.createElement('div'),
            taskInput = document.createElement('input'),
            buttonsHolder = document.createElement('div'),
            taskImage = document.createElement('img'),
            exportBTN = document.createElement('button'),
            deleteBTN = document.createElement('button'),
            updateBTN = document.createElement('button');

          buttonsHolder.classList.add('buttons-holder');

          deleteBTN.innerHTML = "حذف <i class='fas fa-trash-alt'></i>";
          updateBTN.innerHTML = "تحديث <i class='fas fa-cloud-upload-alt'></i>";
          exportBTN.innerHTML = "تصدير <i class='fas fa-file-export'></i>";

          taskInput.value = task.note;

          taskImage.setAttribute('src', task.img_uri);

          taskInput.setAttribute('id', task.id);

          exportBTN.addEventListener('click', function () {
            ipcRenderer.send('create-txt', task.note);
          });

          deleteBTN.addEventListener('click', () => {
            deleteImagedTask(task.id, task.img_uri);
          });

          updateBTN.addEventListener('click', () => {
            updateImagedTask(task.id, taskInput.value);
          });

          clearImagedBtn.addEventListener('click', function () {
            fs.unlink(task.img_uri, (err) => {
              if (err) {
                console.error(err);
                return;
              }
            });
          });

          //إرفاق عنصر الصورة إلى العنصر الحاوى
          imageHolder.appendChild(taskImage);

          buttonsHolder.appendChild(deleteBTN);

          buttonsHolder.appendChild(updateBTN);

          buttonsHolder.appendChild(exportBTN);

          noteContentHolder.appendChild(taskInput);

          noteContentHolder.appendChild(buttonsHolder);

          listItem.appendChild(noteContentHolder);
          listItem.appendChild(imageHolder);

          imagedList.appendChild(listItem);
        }
      }
    });
}

//استدعاء تابع اظهار المهام ذات صورة
showImaged();
