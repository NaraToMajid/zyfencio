// =============================================
// ZYVENQO - Core App Logic
// =============================================

const SUPABASE_URL = 'https://mqonelsoqyvrasrzrzfl.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xb25lbHNvcXl2cmFzcnpyemZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NjEzOTQsImV4cCI6MjA4MTUzNzM5NH0.exHvN0BA3P71DcZbavZ0DMk8pUEpWQ6VCuH672wEdJ4';

// Supabase Client
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// ---- SESSION ----
let currentUser = null;

function saveSession(user) {
  localStorage.setItem('zyv_user', JSON.stringify(user));
  currentUser = user;
}
function loadSession() {
  try { currentUser = JSON.parse(localStorage.getItem('zyv_user')); } catch { currentUser = null; }
  return currentUser;
}
function clearSession() {
  localStorage.removeItem('zyv_user');
  currentUser = null;
}

// ---- TOAST ----
function toast(msg, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { info: 'fa-circle-info', success: 'fa-circle-check', error: 'fa-circle-xmark' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fa-solid ${icons[type] || 'fa-circle-info'}"></i><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(60px)'; t.style.transition = '0.3s'; setTimeout(() => t.remove(), 300); }, duration);
}

// ---- PASSWORD HASH (simple, not for prod) ----
async function hashPassword(pw) {
  const enc = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---- THEME ----
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme || 'dark');
  localStorage.setItem('zyv_theme', theme || 'dark');
}
function loadTheme() {
  const saved = localStorage.getItem('zyv_theme') || 'dark';
  applyTheme(saved);
}

// ---- AVATAR FALLBACK ----
function avatarHTML(user, size = 'md') {
  if (user?.avatar_url) return `<img class="avatar avatar-${size}" src="${user.avatar_url}" alt="${user.username}">`;
  const letter = (user?.display_name || user?.username || '?')[0].toUpperCase();
  return `<div class="avatar avatar-${size}">${letter}</div>`;
}

// ---- SIDEBAR TOGGLE ----
function initSidebar() {
  const btn = document.querySelector('.hamburger');
  const sidebar = document.querySelector('.sidebar');
  if (!btn || !sidebar) return;
  btn.addEventListener('click', () => sidebar.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !btn.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}

// ---- DROPDOWN ----
function initDropdowns() {
  document.querySelectorAll('[data-dropdown]').forEach(trigger => {
    const menuId = trigger.getAttribute('data-dropdown');
    const menu = document.getElementById(menuId);
    if (!menu) return;
    trigger.addEventListener('click', e => {
      e.stopPropagation();
      document.querySelectorAll('.dropdown-menu.open').forEach(m => { if (m !== menu) m.classList.remove('open'); });
      menu.classList.toggle('open');
    });
  });
  document.addEventListener('click', () => { document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open')); });
}

// ---- TABS ----
function initTabs(container) {
  const el = container || document;
  el.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.tabs')?.getAttribute('data-group') || 'default';
      const target = btn.getAttribute('data-tab');
      document.querySelectorAll(`.tab-btn[data-tab]`).forEach(b => {
        if ((b.closest('.tabs')?.getAttribute('data-group') || 'default') === group) b.classList.remove('active');
      });
      document.querySelectorAll(`.tab-panel`).forEach(p => {
        if ((p.getAttribute('data-group') || 'default') === group) p.classList.remove('active');
      });
      btn.classList.add('active');
      const panel = document.querySelector(`.tab-panel[data-tab="${target}"]`);
      if (panel) panel.classList.add('active');
    });
  });
}

// ---- SITE LOGO ----
async function loadSiteLogo() {
  const { data } = await sb.from('site_settings_Zyan').select('value').eq('key', 'logo_url').single();
  const logos = document.querySelectorAll('.site-logo-img');
  logos.forEach(el => {
    if (data?.value) { el.src = data.value; el.style.display = 'inline'; }
    else el.style.display = 'none';
  });
}

// ---- AUTH GUARD ----
function requireAuth(redirectTo = 'auth.html') {
  loadSession();
  if (!currentUser) { window.location.href = redirectTo; return null; }
  if (currentUser.status !== 'active') { window.location.href = redirectTo; return null; }
  return currentUser;
}
function requireAdmin() {
  loadSession();
  if (!currentUser || currentUser.role !== 'admin') { window.location.href = 'auth.html'; return null; }
  return currentUser;
}

// ---- FORMAT DATE ----
function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
function timeAgo(d) {
  const diff = (Date.now() - new Date(d)) / 1000;
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return `${Math.floor(diff/60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h lalu`;
  return `${Math.floor(diff/86400)}d lalu`;
}

// ---- LINKIFY ----
function linkify(text) {
  return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
}

// ---- FILE SIZE HUMAN ----
function fmtSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ---- CAPTCHA ----
let captchaAnswer = null;
function generateCaptcha(containerId) {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  captchaAnswer = a + b;
  const el = document.getElementById(containerId);
  if (el) el.textContent = `${a} + ${b} = ?`;
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  initSidebar();
  initDropdowns();
  initTabs();
  loadSiteLogo();
});
