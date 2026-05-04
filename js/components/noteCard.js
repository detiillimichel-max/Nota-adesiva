const NoteCard = (() => {

  function create(note, index = 0) {
    const card = document.createElement('article');
    card.className = 'note-card';
    card.dataset.id = note.id;

    const hasTitle    = note.title   && note.title.trim()   !== '';
    const hasPhoto    = !!note.photo;
    const hasReminder = !!note.reminder;

    /* Estilos base */
    card.style.cssText = `
      background: var(--card-color, var(--note-yellow));
      border-radius: var(--radius-md);
      min-height: ${hasPhoto ? '0' : '140px'};
      cursor: pointer;
      box-shadow: var(--shadow-card);
      transform: rotate(var(--tilt, 0deg));
      transition: transform 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out);
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      user-select: none;
    `;
    card.style.setProperty('--card-color', `var(${note.color || '--note-yellow'})`);
    card.style.setProperty('--tilt',       `${note.tilt ?? 0}deg`);
    card.style.setProperty('--i',          index);

    /* ── Foto no topo ───────────────────────── */
    let photoHTML = '';
    if (hasPhoto) {
      photoHTML = `
        <div class="note-card__photo-wrap">
          <img class="note-card__photo" src="${note.photo}" alt="Foto da nota" loading="lazy" />
        </div>
      `;
    }

    /* ── Badge de lembrete ──────────────────── */
    let reminderBadge = '';
    if (hasReminder) {
      const due      = new Date(note.reminder);
      const isPast   = due < new Date();
      const label    = _formatReminderLabel(due);
      reminderBadge  = `
        <span class="note-card__reminder ${isPast ? 'is-past' : ''}">
          ⏰ ${label}
        </span>
      `;
    }

    /* ── Conteúdo ──────────────────────────── */
    card.innerHTML = `
      ${photoHTML}
      <div class="note-card__body">
        ${reminderBadge}
        ${hasTitle ? `<p class="note-card__title">${_escape(note.title)}</p>` : ''}
        <p class="note-card__text">${_formatPreview(note.content, hasTitle)}</p>
        <time class="note-card__date">${_formatDate(note.updatedAt)}</time>
      </div>
    `;

    /* Estilos internos */
    _applyBodyStyles(card, hasTitle, hasPhoto);

    /* Hover */
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'rotate(0deg) translateY(-4px)';
      card.style.boxShadow = '4px 8px 24px rgba(44,35,24,0.18)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = `rotate(${note.tilt ?? 0}deg)`;
      card.style.boxShadow = 'var(--shadow-card)';
    });

    /* Clique */
    card.addEventListener('click', () => {
      card.dispatchEvent(new CustomEvent('note:open', {
        detail: { id: note.id }, bubbles: true,
      }));
    });

    return card;
  }

  function renderAll(notes, query = '') {
    const dashboard = document.getElementById('dashboard');
    const noteCount = document.getElementById('noteCount');

    dashboard.innerHTML = '';

    const total = StorageService.getAll().length;
    noteCount.textContent = total === 0 ? '0 notas'
      : total === 1 ? '1 nota' : `${total} notas`;

    if (notes.length === 0) {
      _renderEmptyState(dashboard, query);
      return;
    }

    const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
    sorted.forEach((note, i) => {
      const card = create(note, i);
      if (query) _highlight(card, query);
      dashboard.appendChild(card);
    });
  }

  function removeCard(id) {
    const card = document.querySelector(`.note-card[data-id="${id}"]`);
    if (!card) return;
    card.classList.add('is-removing');
    card.addEventListener('animationend', () => card.remove(), { once: true });
    setTimeout(() => card.remove(), 300);
  }

  /* ── Privadas ─────────────────────────────────── */

  function _applyBodyStyles(card, hasTitle, hasPhoto) {
    const body = card.querySelector('.note-card__body');
    if (body) body.style.cssText = `
      padding: var(--space-md);
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    `;

    const title = card.querySelector('.note-card__title');
    if (title) title.style.cssText = `
      font-family: var(--font-note);
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--color-ink);
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-break: break-word;
    `;

    const text = card.querySelector('.note-card__text');
    if (text) text.style.cssText = `
      font-family: var(--font-note);
      font-size: 1rem;
      line-height: 1.45;
      color: var(--color-ink);
      flex: 1;
      display: -webkit-box;
      -webkit-line-clamp: ${hasPhoto ? 2 : hasTitle ? 4 : 7};
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-break: break-word;
      opacity: ${hasTitle ? '0.8' : '1'};
    `;

    const date = card.querySelector('.note-card__date');
    if (date) date.style.cssText = `
      font-family: var(--font-ui);
      font-size: 0.7rem;
      color: rgba(44,35,24,0.45);
      margin-top: auto;
    `;
  }

  function _escape(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function _formatPreview(content, hasTitle) {
    if (!content || content.trim() === '') {
      return hasTitle
        ? '<em style="opacity:0.35;font-size:0.9em">sem texto</em>'
        : '<em style="opacity:0.4">sem conteúdo</em>';
    }
    return _escape(content).replace(/\n/g,'<br>');
  }

  function _formatDate(ts) {
    const d     = new Date(ts);
    const hoje  = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    if (d.toDateString() === hoje.toDateString())
      return `hoje · ${d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`;
    if (d.toDateString() === ontem.toDateString())
      return `ontem · ${d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`;
    return d.toLocaleDateString('pt-BR',{day:'numeric',month:'short'});
  }

  function _formatReminderLabel(date) {
    const now  = new Date();
    const diff = date - now;
    if (diff < 0)
      return date.toLocaleDateString('pt-BR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
    if (diff < 60 * 60 * 1000)
      return `em ${Math.round(diff/60000)} min`;
    if (diff < 24 * 60 * 60 * 1000)
      return `hoje ${date.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`;
    return date.toLocaleDateString('pt-BR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  }

  function _highlight(card, query) {
    const targets = card.querySelectorAll('.note-card__title, .note-card__text');
    const regex   = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
    targets.forEach(el => { el.innerHTML = el.innerHTML.replace(regex,'<mark>$1</mark>'); });
  }

  function _renderEmptyState(container, query) {
    const isSearch = query && query.trim() !== '';
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state__icon">${isSearch ? '🔍' : '📝'}</div>
        <p class="empty-state__title">
          ${isSearch ? `Nenhum resultado para "${query}"` : 'Nenhuma nota ainda'}
        </p>
        <p class="empty-state__hint">
          ${isSearch ? 'Tente outro termo' : 'Toque em + para começar'}
        </p>
      </div>
    `;
  }

  return { create, renderAll, removeCard };

})();  
