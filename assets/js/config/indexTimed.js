const { ipcRenderer } = require('electron');
const connection = require('./connection');

let newTimed = document.querySelector('.todo--timed .add-new-task');

newTimed.addEventListener('click', function () {
  ipcRenderer.send('new-timed');
});

ipcRenderer.on('add-timed-note', function (e, note, notificationTime) {
  addTimedTask(note, notificationTime);
});

function addTimedTask(note, notificationTime) {
  connection
    .insert({
      into: 'timed',
      values: [
        {
          note: note,
          pick_status: 0,
          pick_time: notificationTime,
        },
      ],
    })
    .then(() => showTimed());
}

function updateTimedTask(taskId, taskValue) {
  connection
    .update({
      in: 'timed',
      where: {
        id: taskId,
      },
      set: {
        note: taskValue,
      },
    })
    .then(() => showTimed());
}

function deleteTimedTask(tasksId) {
  return connection
    .remove({
      from: 'timed',
      where: {
        id: tasksId,
      },
    })
    .then(() => showTimed());
}

function showTimed() {
  let clearTimedlBtn = document.querySelector('.todo--timed .clear-all');
  let timedList = document.querySelector('.todo--timed__list');
  timedList.innerHTML = '';

  connection
    .select({
      from: 'timed',
    })
    .then((tasks) => {
      if (tasks.length == 0) {
        clearTimedlBtn.classList.remove('clear-all--show');
        timedList.innerHTML = '<li class="empty-list">لا توجد مهام</li>';
      } else {
        clearTimedlBtn.classList.add('clear-all--show');
        clearTimedlBtn.addEventListener('click', function () {
          return connection
            .remove({
              from: 'timed',
            })
            .then(() => showTimed());
        });
        for (let task of tasks) {
          let listItem = document.createElement('li'),
            taskInput = document.createElement('input'),
            buttonsHolder = document.createElement('div'),
            timeHolder = document.createElement('div'),
            exportBTN = document.createElement('button'),
            deleteBTN = document.createElement('button'),
            updateBTN = document.createElement('button');

          deleteBTN.innerHTML = "حذف <i class='fas fa-trash-alt'></i>";
          updateBTN.innerHTML = "تحديث <i class='fas fa-cloud-upload-alt'></i>";
          exportBTN.innerHTML = "تصدير <i class='fas fa-file-export'></i>";
          timeHolder.classList.add('time-holder');

          buttonsHolder.classList.add('buttons-holder');

          taskInput.value = task.note;

          if (task.pick_status === 1) {
            timeHolder.innerHTML =
              'جرى التنبيه فى الساعة ' + task.pick_time.toLocaleTimeString();
          } else {
            timeHolder.innerHTML =
              'يتم التنبيه فى الساعة ' + task.pick_time.toLocaleTimeString();
          }

          let checkInterval = setInterval(function () {
            let currentDate = new Date();

            if (task.pick_time.toString() === currentDate.toString()) {
              ipcRenderer.send('notify', task.note);

              connection
                .update({
                  in: 'timed',
                  where: {
                    id: task.id,
                  },
                  set: {
                    pick_status: 1,
                  },
                })
                .then(() => showTimed());

              clearInterval(checkInterval);
            }
          }, 1000);

          exportBTN.addEventListener('click', function () {
            ipcRenderer.send('create-txt', task.note);
          });

          deleteBTN.addEventListener('click', () => {
            deleteTimedTask(task.id);
          });

          updateBTN.addEventListener('click', () => {
            updateTimedTask(task.id, taskInput.value);
          });

          listItem.appendChild(taskInput);

          listItem.appendChild(timeHolder);

          buttonsHolder.appendChild(deleteBTN);

          buttonsHolder.appendChild(updateBTN);

          buttonsHolder.appendChild(exportBTN);

          listItem.appendChild(buttonsHolder);

          timedList.appendChild(listItem);
        }
      }
    });
}

showTimed();
