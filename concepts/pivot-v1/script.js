const openButton = document.querySelector('.human-note__open');
const closeButton = document.querySelector('.human-note__close');
const dialog = document.querySelector('.human-note');

openButton.addEventListener('click', () => dialog.showModal());
closeButton.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) {
    dialog.close();
  }
});
