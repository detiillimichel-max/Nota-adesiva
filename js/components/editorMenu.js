const EditorMenu = (() => {

  let overlay, panel, titleInput, textarea, btnClose, btnSave, btnDelete, colorsContainer;
  let _currentNoteId = null;
  let _currentColor  = '--note-yellow';

  const COLORS = [
    { key: '--note-yellow', label: 'Amarelo' },
    { key: '--note-pink',   label: 'Rosa'    },
    { key: '--note-green',  label: 'Verde'   },
    { key: '--note-blue',   label: 'Azul'    },
    { key: '--note-purple', label: 'Roxo'    },
    { key: '--note-orange', label: 'Laranja' },
  ];

  function init() {
    overlay         = document.getElementById('editorOverlay');
    panel           = overlay.querySelector('.editor-panel');
    titleInput      = document.getElementById('editorTitle');
    textarea        = document.getElementById('editorTextarea');
    btnClose        = document.getElementById('btnCloseEditor');
    btnSave         = document.getElementById('btnSaveNote');
    btnDelete       = document.getElementById('btnDeleteNote');
    colorsContainer = document.getElementById('editorColors');

    _buildColorSwatches();

    document.getElementById('fabNew').addEventListener('click', () => open());
    btnClose.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
    });

    btnSave.addEventListener('click', _handleSave);

    /* Ctrl/Cmd + Enter salva */
    [titleInput, textarea].forEach(el => {
      el.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') _handleSave();
      });
    });

    /* Tab no título pula para o textarea */
    titleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        textarea.focus();
      }
    });

    btnDelete.addEventListener('click', _handleDelete);
  }

  function open(note = null) {
    _currentNoteId = note ? note.id : null;
    _currentColor  = note ? (note.color || '--note-yellow') : '--note-yellow';

    titleInput.value = note ? (note.title   || '') : '';
    textarea.value   = note ? (note.content || '') : '';

    _applyColor(_currentColor);
    _syncSwatchUI();

    btnDelete.style.display = _currentNoteId ? 'inline-flex' : 'none';
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');

    /* Foca no título se vazio, senão no textarea */
    setTimeout(() => {
      titleInput.value === '' ? titleInput.focus() : textarea.focus();
    }, 60);
  }

  function close() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      titleInput.value = '';
      textarea.value   = '';
      _currentNoteId   = null;
    }, 350);
  }

  function _handleSave() {
    const title   = titleInput.value.trim();
    const content = textarea.value.trim();

    /* Precisa de pelo menos um campo preenchido */
    if (!title && !content) {
      textarea.focus();
      return;
    }

    overlay.dispatchEvent(new CustomEvent('note:save', {
      detail: { id: _currentNoteId, title, content, color: _currentColor },
      bubbles: true,
    }));
    close();
  }

  function _handleDelete() {
    if (!_currentNoteId) return;
    overlay.dispatchEvent(new CustomEvent('note:delete', {
      detail: { id: _currentNoteId },
      bubbles: true,
    }));
    close();
  }

  function _buildColorSwatches() {
    colorsContainer.innerHTML = '';
    COLORS.forEach(({ key, label }) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-swatch';
      btn.setAttribute('aria-label', label);
      btn.dataset.colorKey = key;
      btn.style.background = `var(${key})`;
      btn.addEventListener('click', () => {
        _currentColor = key;
        _applyColor(key);
        _syncSwatchUI();
      });
      colorsContainer.appendChild(btn);
    });
  }

  function _applyColor(colorKey) {
    panel.style.setProperty('--panel-color', `var(${colorKey})`);
  }

  function _syncSwatchUI() {
    colorsContainer.querySelectorAll('.color-swatch').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.colorKey === _currentColor);
    });
  }

  return { init, open, close };

})();
