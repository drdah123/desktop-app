const { ipcRenderer } = require('electron');
const connection = require('./connection');

let newNormal = document.querySelector('.todo--normal .add-new-task');

newNormal.addEventListener('click', function () {
  ipcRenderer.send('new-normal');
});

ipcRenderer.on('add-normal-task', function (e, task) {
  addNormalTask(task);
});

function addNormalTask(task) {
  connection
    .insert({
      into: 'tasks',
      values: [
        {
          note: task,
        },
      ],
    })
    .then(() => showNormal());
}

function updateTask(taskId, taskValue) {
  connection
    .update({
      in: 'tasks',
      where: {
        id: taskId,
      },
      set: {
        note: taskValue,
      },
    })
    .then(() => showNormal());
}

function deleteTask(tasksId) {
  return connection
    .remove({
      from: 'tasks',
      where: {
        id: tasksId,
      },
    })
    .then(() => showNormal());
}

function showNormal() {
  let clearNormalBtn = document.querySelector('.todo--normal .clear-all');
  let normalTasksList = document.querySelector('.todo--normal__list');
  normalTasksList.innerHTML = '';

  connection
    .select({
      from: 'tasks',
    })
    .then((tasks) => {
      if (tasks.length == 0) {
        clearNormalBtn.classList.remove('clear-all--show');
        normalTasksList.innerHTML =
          ' <li class="empty-list">لا توجد مهام</li> ';
      } else {
        clearNormalBtn.classList.add('clear-all--show');
        clearNormalBtn.addEventListener('click', function () {
          return connection
            .remove({
              from: 'tasks',
            })
            .then(() => showNormal());
        });
        for (let task of tasks) {
          let listItem = document.createElement('li'),
            taskInput = document.createElement('input'),
            buttonsHolder = document.createElement('div'),
            exportBTN = document.createElement('button'),
            deleteBTN = document.createElement('button'),
            updateBTN = document.createElement('button');

          buttonsHolder.classList.add('buttons-holder');
          deleteBTN.innerHTML = "حذف <i class='fas fa-trash-alt'></i>";
          updateBTN.innerHTML = "تحديث <i class='fas fa-cloud-upload-alt'></i>";
          exportBTN.innerHTML = "تصدير <i class='fas fa-file-export'></i>";

          taskInput.value = task.note;

          exportBTN.addEventListener('click', function () {
            ipcRenderer.send('create-txt', task.note);
          });

          deleteBTN.addEventListener('click', () => {
            deleteTask(task.id);
          });

          updateBTN.addEventListener('click', () => {
            updateTask(task.id, taskInput.value);
          });

          listItem.appendChild(taskInput);

          buttonsHolder.appendChild(deleteBTN);

          buttonsHolder.appendChild(updateBTN);

          buttonsHolder.appendChild(exportBTN);

          listItem.appendChild(buttonsHolder);

          normalTasksList.appendChild(listItem);
        }
      }
    });
}

showNormal();
