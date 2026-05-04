const EditorMenu = (() => {

  let overlay, panel, titleInput, textarea, btnClose, btnSave, btnDelete, colorsContainer;
  let btnCamera, btnGallery, photoPreview, btnRemovePhoto;
  let reminderInput, btnReminder, reminderDisplay, btnClearReminder;

  let _currentNoteId = null;
  let _currentColor  = '--note-yellow';
  let _currentPhoto  = null;   /* base64 ou null */
  let _currentReminder = null; /* ISO string ou null */

  const COLORS = [
    { key: '--note-yellow', label: 'Amarelo' },
    { key: '--note-pink',   label: 'Rosa'    },
    { key: '--note-green',  label: 'Verde'   },
    { key: '--note-blue',   label: 'Azul'    },
    { key: '--note-purple', label: 'Roxo'    },
    { key: '--note-orange', label: 'Laranja' },
  ];

  function init() {
    overlay          = document.getElementById('editorOverlay');
    panel            = overlay.querySelector('.editor-panel');
    titleInput       = document.getElementById('editorTitle');
    textarea         = document.getElementById('editorTextarea');
    btnClose         = document.getElementById('btnCloseEditor');
    btnSave          = document.getElementById('btnSaveNote');
    btnDelete        = document.getElementById('btnDeleteNote');
    colorsContainer  = document.getElementById('editorColors');

    /* Foto */
    btnCamera        = document.getElementById('btnCamera');
    btnGallery       = document.getElementById('btnGallery');
    photoPreview     = document.getElementById('photoPreview');
    btnRemovePhoto   = document.getElementById('btnRemovePhoto');

    /* Lembrete */
    reminderInput    = document.getElementById('reminderInput');
    reminderDisplay  = document.getElementById('reminderDisplay');
    btnClearReminder = document.getElementById('btnClearReminder');

    _buildColorSwatches();
    _bindPhotoEvents();
    _bindReminderEvents();

    document.getElementById('fabNew').addEventListener('click', () => open());
    btnClose.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
    });

    btnSave.addEventListener('click', _handleSave);
    [titleInput, textarea].forEach(el => {
      el.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') _handleSave();
      });
    });
    titleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') { e.preventDefault(); textarea.focus(); }
    });

    btnDelete.addEventListener('click', _handleDelete);
  }

  function open(note = null) {
    _currentNoteId   = note?.id    ?? null;
    _currentColor    = note?.color ?? '--note-yellow';
    _currentPhoto    = note?.photo ?? null;
    _currentReminder = note?.reminder ?? null;

    titleInput.value = note?.title   ?? '';
    textarea.value   = note?.content ?? '';

    _applyColor(_currentColor);
    _syncSwatchUI();
    _updatePhotoPreview();
    _updateReminderDisplay();

    btnDelete.style.display = _currentNoteId ? 'inline-flex' : 'none';
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');

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
      _currentPhoto    = null;
      _currentReminder = null;
    }, 350);
  }

  /* ── Foto ────────────────────────────────────── */

  function _bindPhotoEvents() {
    btnCamera.addEventListener('click', async () => {
      const photo = await PhotoService.pick('camera');
      if (photo) { _currentPhoto = photo; _updatePhotoPreview(); }
    });

    btnGallery.addEventListener('click', async () => {
      const photo = await PhotoService.pick('gallery');
      if (photo) { _currentPhoto = photo; _updatePhotoPreview(); }
    });

    btnRemovePhoto.addEventListener('click', () => {
      _currentPhoto = null;
      _updatePhotoPreview();
    });
  }

  function _updatePhotoPreview() {
    if (_currentPhoto) {
      photoPreview.src = _currentPhoto;
      photoPreview.style.display = 'block';
      btnRemovePhoto.style.display = 'flex';
      const kb = PhotoService.sizeKB(_currentPhoto);
      btnRemovePhoto.title = `Remover foto (${kb}KB)`;
    } else {
      photoPreview.style.display = 'none';
      btnRemovePhoto.style.display = 'none';
    }
  }

  /* ── Lembrete ────────────────────────────────── */

  function _bindReminderEvents() {
    /* Define mínimo como agora */
    reminderInput.addEventListener('focus', () => {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      reminderInput.min = now.toISOString().slice(0,16);
    });

    reminderInput.addEventListener('change', () => {
      _currentReminder = reminderInput.value
        ? new Date(reminderInput.value).toISOString()
        : null;
      _updateReminderDisplay();
    });

    btnClearReminder.addEventListener('click', () => {
      _currentReminder = null;
      reminderInput.value = '';
      _updateReminderDisplay();
    });
  }

  function _updateReminderDisplay() {
    if (_currentReminder) {
      const d = new Date(_currentReminder);
      reminderDisplay.textContent = `⏰ ${d.toLocaleDateString('pt-BR',{
        day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'
      })}`;
      reminderDisplay.style.display = 'inline-flex';
      btnClearReminder.style.display = 'inline-flex';
      /* Preenche o input */
      const local = new Date(d - d.getTimezoneOffset() * 60000)
        .toISOString().slice(0,16);
      reminderInput.value = local;
    } else {
      reminderDisplay.style.display = 'none';
      btnClearReminder.style.display = 'none';
      reminderInput.value = '';
    }
  }

  /* ── Salvar / Apagar ─────────────────────────── */

  function _handleSave() {
    const title   = titleInput.value.trim();
    const content = textarea.value.trim();

    if (!title && !content && !_currentPhoto) {
      textarea.focus();
      return;
    }

    overlay.dispatchEvent(new CustomEvent('note:save', {
      detail: {
        id:       _currentNoteId,
        title,
        content,
        color:    _currentColor,
        photo:    _currentPhoto,
        reminder: _currentReminder,
      },
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

  /* ── Swatches de cor ─────────────────────────── */

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
