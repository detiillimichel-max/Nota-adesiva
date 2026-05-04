/* ════════════════════════════════════════════════════
   push.js — Serviço de lembretes e notificações
   Funciona offline via Service Worker.
   Chave VAPID pública (segura no frontend):
════════════════════════════════════════════════════ */

const PushService = (() => {

  const VAPID_PUBLIC_KEY = 'BLio_AlRpov6sxMjDwztnIgqMm7ENkkvnndhebAij6oIbaRXT1fQGXdu2eF72xEDahmDKL8uHHoV6ZmOt81ZW2Q';
  const REMINDERS_KEY    = 'notas_reminders_v1';

  /* ── Permissão ──────────────────────────────── */

  async function requestPermission() {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    const result = await Notification.requestPermission();
    return result;
  }

  function hasPermission() {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  /* ── Inscrição Web Push (para futura integração servidor) */

  async function subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) return existing;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: _urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      return sub;
    } catch (err) {
      console.warn('[PushService] Inscrição falhou:', err);
      return null;
    }
  }

  /* ── Salvar lembrete de uma nota ────────────── */

  function saveReminder(noteId, datetimeISO, noteTitle) {
    const reminders = _getReminders();
    reminders[noteId] = { noteId, datetimeISO, noteTitle, fired: false };
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    _scheduleLocalReminder(noteId, datetimeISO, noteTitle);
  }

  function removeReminder(noteId) {
    const reminders = _getReminders();
    delete reminders[noteId];
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  }

  /* ── Verifica lembretes pendentes ───────────── */
  /* Chamado ao abrir o app — mostra os que venceram offline */

  function checkPending() {
    if (!hasPermission()) return;
    const reminders = _getReminders();
    const now = Date.now();

    Object.values(reminders).forEach(r => {
      if (r.fired) return;
      const due = new Date(r.datetimeISO).getTime();

      if (due <= now) {
        _notify(r.noteTitle || 'Nota', 'Lembrete da sua nota!', r.noteId);
        reminders[r.noteId].fired = true;
      } else {
        /* Ainda no futuro — agenda no SW */
        _scheduleLocalReminder(r.noteId, r.datetimeISO, r.noteTitle);
      }
    });

    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  }

  /* ── Privadas ────────────────────────────────── */

  function _getReminders() {
    try {
      return JSON.parse(localStorage.getItem(REMINDERS_KEY) || '{}');
    } catch { return {}; }
  }

  /* Timer local — funciona enquanto o app está aberto */
  const _timers = {};

  function _scheduleLocalReminder(noteId, datetimeISO, noteTitle) {
    const ms = new Date(datetimeISO).getTime() - Date.now();
    if (ms <= 0) return;

    clearTimeout(_timers[noteId]);
    _timers[noteId] = setTimeout(() => {
      _notify(noteTitle || 'Nota', 'Lembrete da sua nota!', noteId);
      /* Marca como disparado */
      const reminders = _getReminders();
      if (reminders[noteId]) {
        reminders[noteId].fired = true;
        localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
      }
    }, ms);
  }

  function _notify(title, body, noteId) {
    if (!hasPermission()) return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body,
          icon:  '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag:   `nota-${noteId}`,
          data:  { noteId },
          vibrate: [200, 100, 200],
          actions: [
            { action: 'open',    title: 'Abrir nota' },
            { action: 'dismiss', title: 'Dispensar'  },
          ],
        });
      });
    } else {
      new Notification(title, { body, icon: '/icons/icon-192.png' });
    }
  }

  function _urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw     = window.atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
  }

  return { requestPermission, hasPermission, subscribe, saveReminder, removeReminder, checkPending };

})();
