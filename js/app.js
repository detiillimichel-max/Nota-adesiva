(function initApp() {

  let _currentView = 'grid';
  let _searchQuery = '';

  document.addEventListener('DOMContentLoaded', async () => {

    /* Inicializa componentes */
    EditorMenu.init();

    /* Pede permissão de notificação e verifica lembretes pendentes */
    const perm = await PushService.requestPermission();
    if (perm === 'granted') {
      PushService.subscribe();
      PushService.checkPending();
    }

    _render();

    /* ── Eventos de nota ─────────────────────── */

    document.addEventListener('note:open', (e) => {
      const note = StorageService.getAll().find(n => n.id === e.detail.id);
      if (note) EditorMenu.open(note);
    });

    document.addEventListener('note:save', (e) => {
      const { id, title, content, color, photo, reminder } = e.detail;
      const saved = StorageService.save({ id, title, content, color, photo, reminder });

      /* Gerencia lembrete */
      if (reminder) {
        PushService.saveReminder(saved.id, reminder, title || content.slice(0,30) || 'Nota');
      } else {
        PushService.removeReminder(saved.id);
      }

      _render();
    });

    document.addEventListener('note:delete', (e) => {
      NoteCard.removeCard(e.detail.id);
      StorageService.delete(e.detail.id);
      PushService.removeReminder(e.detail.id);
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

    /* Restaura última vista */
    const savedView = localStorage.getItem('notas_view');
    if (savedView === 'list') _setView('list');

  });

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
    localStorage.setItem('notas_view', view);
  }

})();
