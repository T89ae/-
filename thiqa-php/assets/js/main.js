/**
 * نظام ثقة — main.js
 * Global utilities used across all pages
 */

// ── CSRF ─────────────────────────────────────────────────────
const CSRF = document.getElementById('csrf-token')?.value || '';

// ── API Request ───────────────────────────────────────────────
async function api(url, data = {}, method = 'POST') {
  try {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': CSRF,
        'Accept': 'application/json',
      },
    };
    if (method !== 'GET') opts.body = JSON.stringify({ ...data, _csrf: CSRF });
    const res  = await fetch(url, opts);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'خطأ في الاتصال');
    return json;
  } catch (e) {
    showToast(e.message, 'error');
    throw e;
  }
}

async function apiGet(url) {
  return api(url, {}, 'GET');
}

async function apiPost(url, data = {}) {
  return api(url, data, 'POST');
}

// ── Toast Notifications ───────────────────────────────────────
function showToast(msg, type = 'success', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const item  = document.createElement('div');
  item.className = `toast-item toast-${type}`;
  // استخدام textContent بدلاً من innerHTML لمنع XSS
  const iconSpan = document.createElement('span');
  iconSpan.style.fontSize = '16px';
  iconSpan.textContent = icons[type] || '✅';
  const msgSpan = document.createElement('span');
  msgSpan.textContent = msg;
  item.appendChild(iconSpan);
  item.appendChild(msgSpan);
  container.appendChild(item);

  setTimeout(() => {
    item.classList.add('removing');
    setTimeout(() => item.remove(), 300);
  }, duration);
}

// ── Modal ─────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ── Sidebar ───────────────────────────────────────────────────
function toggleSidebar() {
  const sb   = document.getElementById('sidebar');
  const main = document.getElementById('main');
  if (window.innerWidth <= 768) {
    sb.classList.toggle('mobile-open');
  } else {
    sb.classList.toggle('collapsed');
    main.classList.toggle('expanded');
    localStorage.setItem('sidebar_collapsed', sb.classList.contains('collapsed') ? '1' : '0');
  }
}

// Restore sidebar state
(function () {
  if (window.innerWidth > 768 && localStorage.getItem('sidebar_collapsed') === '1') {
    document.getElementById('sidebar')?.classList.add('collapsed');
    document.getElementById('main')?.classList.add('expanded');
  }
})();

// ── Confirm Delete ────────────────────────────────────────────
function confirmDelete(url, msg = 'هل أنت متأكد من الحذف؟', redirect = '') {
  if (!confirm(msg)) return;
  api(url, { action: 'delete' })
    .then(() => {
      showToast('تم الحذف بنجاح', 'success');
      if (redirect) setTimeout(() => window.location.href = redirect, 800);
      else location.reload();
    })
    .catch(() => {});
}

// ── Format Helpers ────────────────────────────────────────────
function formatMoney(n) {
  return parseFloat(n || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 });
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ar-SA');
}

// ── Search Filter ─────────────────────────────────────────────
function filterTable(inputId, tableId) {
  const q = document.getElementById(inputId)?.value.toLowerCase() || '';
  document.querySelectorAll(`#${tableId} tbody tr`).forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

// ── Export Table to CSV ───────────────────────────────────────
function exportCSV(tableId, filename = 'export') {
  const table = document.getElementById(tableId);
  if (!table) return;
  const rows = Array.from(table.querySelectorAll('tr'));
  const csv  = rows.map(row =>
    Array.from(row.querySelectorAll('th,td'))
      .map(cell => '"' + cell.textContent.trim().replace(/"/g, '""') + '"')
      .join(',')
  ).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const a    = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: filename + '_' + new Date().toISOString().slice(0, 10) + '.csv',
  });
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('تم تصدير الملف بنجاح', 'success');
}

// ── Debounce ──────────────────────────────────────────────────
function debounce(fn, ms = 300) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}
