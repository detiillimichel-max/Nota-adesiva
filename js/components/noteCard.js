const NoteCard = (() => {

  const CARD_BASE_STYLE = `
    background: var(--card-color, var(--note-yellow));
    border-radius: var(--radius-md);
    padding: var(--space-md);
    min-height: 140px;
    cursor: pointer;
    box-shadow: var(--shadow-card);
    transform: rotate(var(--tilt, 0deg));
    transition: transform 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out);
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    overflow: hidden;
    user-select: none;
  `;

  function create(note, index = 0) {
    const card = document.createElement('article');
    card.className = 'note-card';
    card.dataset.id = note.id;
    card.style.cssText = CARD_BASE_STYLE;
    card.style.setProperty('--card-color', `var(${note.color || '--note-yellow'})`);
    card.style.setProperty('--tilt', `${note.tilt ?? 0}deg`);
    card.style.setProperty('--i', index);

    card.innerHTML = `
      <p class="note-card__text">${_formatPreview(note.content)}</p>
      <time class="note-card__date" datetime="${new Date(note.updatedAt).toISOString()}">
        ${_formatDate(note.updatedAt)}
      </time>
    `;

    const text = card.querySelector('.note-card__text');
    text.style.cssText = `
      font-family: var(--font-note);
      font-size: 1.1rem;
      line-height: 1.5;
      color: var(--color-ink);
      flex: 1;
      word-break: break-word;
      display: -webkit-box;
      -webkit-line-clamp: 7;
      -webkit-box-orient: vertical;
      overflow: hidden;
    `;

    const date = card.querySelector('.note-card__date');
    date.style.cssText = `
      font-family: var(--font-ui);
      font-size: 0.7rem;
      color: rgba(44,35,24,0.45);
      margin-top: auto;
    `;

    card.addEventListener('mouseenter', () => {
      card.style.transform = 'rotate(0deg) translateY(-4px)';
      card.style.boxShadow = '4px 8px 24px rgba(44,35,24,0.18)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = `rotate(${note.tilt ?? 0}deg)`;
      card.style.boxShadow = 'var(--shadow-card)';
    });

    card.addEventListener('click', () => {
      const event = new CustomEvent('note:open', { detail: { id: note.id }, bubbles: true });
      card.dispatchEvent(event);
    });

    return card;
  }

  function renderAll(notes) {
    const dashboard = document.getElementById('dashboard');
    const noteCount = document.getElementById('noteCount');

    dashboard.innerHTML = '';

    noteCount.textContent = notes.length === 0
      ? '0 notas'
      : notes.length === 1
        ? '1 nota'
        : `${notes.length} notas`;

    if (notes.length === 0) {
      _renderEmptyState(dashboard);
      return;
    }

    const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
    sorted.forEach((note, i) => dashboard.appendChild(create(note, i)));
  }

  function removeCard(id) {
    const card = document.querySelector(`.note-card[data-id="${id}"]`);
    if (!card) return;
    card.classList.add('is-removing');
    card.addEventListener('animationend', () => card.remove(), { once: true });
    setTimeout(() => card.remove(), 300);
  }

  function _formatPreview(content) {
    if (!content || content.trim() === '') {
      return '<em style="opacity:0.4">sem conteúdo</em>';
    }
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }

  function _formatDate(ts) {
    const d    = new Date(ts);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);

    if (d.toDateString() === hoje.toDateString()) {
      return `hoje · ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (d.toDateString() === ontem.toDateString()) {
      return `ontem · ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  }

  function _renderEmptyState(container) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1">
        <div class="empty-state__icon">📝</div>
        <p class="empty-state__title">Nenhuma nota ainda</p>
        <p class="empty-state__hint">Toque em <strong>+</strong> para começar</p>
      </div>
    `;
  }

  return { create, renderAll, removeCard };

})();
