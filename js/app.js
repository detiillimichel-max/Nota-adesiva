(function initApp() {

  /* Estado global do app */
  let _currentView  = 'grid';  /* 'grid' | 'list' */
  let _searchQuery  = '';

  document.addEventListener('DOMContentLoaded', () => {

    EditorMenu.init();
    _render();

    /* ── Eventos de nota ─────────────────────── */

    document.addEventListener('note:open', (e) => {
      const note = StorageService.getAll().find(n => n.id === e.detail.id);
      if (note) EditorMenu.open(note);
    });

    document.addEventListener('note:save', (e) => {
      const { id, title, content, color } = e.detail;
      StorageService.save({ id, title, content, color });
      _render();
    });

    document.addEventListener('note:delete', (e) => {
      NoteCard.removeCard(e.detail.id);
      StorageService.delete(e.detail.id);
      setTimeout(_render, 300);
    });

    /* ── Busca ───────────────────────────────── */

    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');

    searchInput.addEventListener('input', () => {
      _searchQuery = searchInput.value.trim();
      searchClear.classList.toggle('is-visible', _searchQuery.length > 0);
      _render();
    });

    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      _searchQuery = '';
      searchClear.classList.remove('is-visible');
      searchInput.focus();
      _render();
    });

    /* ── Toggle de vista ─────────────────────── */

    document.getElementById('btnGrid').addEventListener('click', () => _setView('grid'));
    document.getElementById('btnList').addEventListener('click', () => _setView('list'));

  });

  /* ── Funções internas ────────────────────────── */

  function _render() {
    const all      = StorageService.getAll();
    const filtered = _searchQuery
      ? all.filter(n =>
          (n.title   || '').toLowerCase().includes(_searchQuery.toLowerCase()) ||
          (n.content || '').toLowerCase().includes(_searchQuery.toLowerCase())
        )
      : all;

    NoteCard.renderAll(filtered, _searchQuery);
  }

  function _setView(view) {
    _currentView = view;
    const dashboard = document.getElementById('dashboard');

    dashboard.classList.toggle('view-list', view === 'list');

    document.getElementById('btnGrid').classList.toggle('is-active', view === 'grid');
    document.getElementById('btnList').classList.toggle('is-active', view === 'list');

    /* Persiste preferência */
    localStorage.setItem('notas_view', view);
  }

  /* Restaura última vista usada */
  (() => {
    const saved = localStorage.getItem('notas_view');
    if (saved === 'list') {
      document.addEventListener('DOMContentLoaded', () => _setView('list'));
    }
  })();

})();
