const StorageService = (() => {

  const STORAGE_KEY = 'notas_app_v1';

  function _generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function getAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (err) {
      console.warn('[StorageService] Falha ao ler:', err);
      return [];
    }
  }

  function _persist(notes) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (err) {
      console.error('[StorageService] Falha ao salvar:', err);
    }
  }

  function save(note) {
    const notes = getAll();
    const now   = Date.now();

    if (!note.id) {
      const newNote = {
        id:        _generateId(),
        title:     note.title   ?? '',
        content:   note.content ?? '',
        color:     note.color   ?? '--note-yellow',
        tilt:      note.tilt    ?? _randomTilt(),
        createdAt: now,
        updatedAt: now,
      };
      notes.push(newNote);
      _persist(notes);
      return newNote;
    } else {
      const index = notes.findIndex(n => n.id === note.id);
      if (index === -1) return note;
      const updated = { ...notes[index], ...note, updatedAt: now };
      notes[index] = updated;
      _persist(notes);
      return updated;
    }
  }

  function deleteNote(id) {
    _persist(getAll().filter(n => n.id !== id));
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function _randomTilt() {
    return parseFloat((Math.random() * 5 - 2.5).toFixed(2));
  }

  return { getAll, save, delete: deleteNote, clear };

})();
