(function initApp() {

  document.addEventListener('DOMContentLoaded', () => {

    EditorMenu.init();
    _refresh();

    document.addEventListener('note:open', (e) => {
      const note = StorageService.getAll().find(n => n.id === e.detail.id);
      if (note) EditorMenu.open(note);
    });

    document.addEventListener('note:save', (e) => {
      const { id, content, color } = e.detail;
      StorageService.save({ id, content, color });
      _refresh();
    });

    document.addEventListener('note:delete', (e) => {
      NoteCard.removeCard(e.detail.id);
      StorageService.delete(e.detail.id);
      setTimeout(_refreshCount, 300);
    });

  });

  function _refresh() {
    NoteCard.renderAll(StorageService.getAll());
  }

  function _refreshCount() {
    const notes     = StorageService.getAll();
    const noteCount = document.getElementById('noteCount');
    noteCount.textContent = notes.length === 0
      ? '0 notas'
      : notes.length === 1 ? '1 nota' : `${notes.length} notas`;
    if (notes.length === 0) _refresh();
  }

})();
