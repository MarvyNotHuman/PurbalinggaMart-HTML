/* ================================================================
   PURBALINGGA MART — Global Auth System
   auth.js · Reusable · Works on all pages
   ================================================================ */
(function () {
  'use strict';

  /* ── Keys ─────────────────────────────────────────────────── */
  const KEY_USERS  = 'pm_auth_users';
  const KEY_SESS   = 'pm_auth_session';
  const KEY_INIT   = 'pm_auth_initialized';
  const KEY_REDIR  = 'pm_auth_redirect';   // save intended page before login redirect

  /* ── Seed Data ────────────────────────────────────────────── */
  const SEED_USERS = [
    {
      id: 1, username: 'admin', password: 'admin123',
      role: 'admin', name: 'Administrator',
      email: 'admin@purbalinggamart.id',
      avatar: 'https://picsum.photos/seed/adminplg/80/80',
      createdAt: '2025-01-01'
    },
    {
      id: 2, username: 'seller1', password: 'seller123',
      role: 'seller', name: 'Pak Slamet',
      email: 'slamet@tokoberkah.id',
      storeName: 'Toko Berkah', storeId: 's1', category: 'makanan',
      location: 'Purbalingga Kota',
      avatar: 'https://picsum.photos/seed/seller1plg/80/80',
      createdAt: '2025-01-01'
    },
    {
      id: 3, username: 'seller2', password: 'seller123',
      role: 'seller', name: 'Bu Siti',
      email: 'siti@warungbusiti.id',
      storeName: 'Warung Bu Siti', storeId: 's2', category: 'makanan',
      location: 'Bojongsari',
      avatar: 'https://picsum.photos/seed/seller2plg/80/80',
      createdAt: '2025-01-02'
    },
    {
      id: 4, username: 'buyer', password: 'buyer123',
      role: 'buyer', name: 'Ahmad Fauzi',
      email: 'ahmad@gmail.com',
      avatar: 'https://picsum.photos/seed/buyerplg/80/80',
      createdAt: '2025-01-10'
    }
  ];

  /* ── Root path helper ─────────────────────────────────────── */
  function rootPath() {
    // If in a subfolder (seller/, admin/) return '../'
    const p = window.location.pathname;
    return (p.includes('/seller/') || p.includes('/admin/')) ? '../' : '';
  }

  /* ================================================================
     CORE AUTH OBJECT
     ================================================================ */
  const PM_AUTH = {

    /* ── Init ─────────────────────────────────────────────────── */
    init() {
      if (!localStorage.getItem(KEY_INIT)) {
        localStorage.setItem(KEY_USERS, JSON.stringify(SEED_USERS));
        localStorage.setItem(KEY_INIT, '1');
      }
      this._injectStyles();
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.updateNavbar());
      } else {
        this.updateNavbar();
      }
    },

    /* ── User CRUD ────────────────────────────────────────────── */
    getUsers()       { return JSON.parse(localStorage.getItem(KEY_USERS) || '[]'); },
    saveUsers(users) { localStorage.setItem(KEY_USERS, JSON.stringify(users)); },

    /* ── Session ──────────────────────────────────────────────── */
    getCurrentUser() {
      const raw = localStorage.getItem(KEY_SESS) || sessionStorage.getItem(KEY_SESS);
      try { return raw ? JSON.parse(raw) : null; } catch { return null; }
    },
    _setSession(user, remember) {
      const safe = {
        id: user.id, username: user.username, role: user.role,
        name: user.name, email: user.email, avatar: user.avatar,
        storeName: user.storeName || null, storeId: user.storeId || null,
        category: user.category || null, location: user.location || null,
      };
      (remember ? localStorage : sessionStorage).setItem(KEY_SESS, JSON.stringify(safe));
    },
    _clearSession() {
      localStorage.removeItem(KEY_SESS);
      sessionStorage.removeItem(KEY_SESS);
    },

    /* ── State ────────────────────────────────────────────────── */
    isLoggedIn() { return this.getCurrentUser() !== null; },
    hasRole(role) {
      const u = this.getCurrentUser();
      return !!(u && u.role === role);
    },

    /* ── Update profile info ──────────────────────────────────── */
    updateProfile({ name, email, avatar }) {
      const user = this.getCurrentUser();
      if (!user) return { ok: false, msg: 'Silakan login terlebih dahulu.' };
      if (!name || name.trim().length < 2) return { ok: false, msg: 'Nama terlalu pendek.' };
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, msg: 'Email tidak valid.' };

      const users = this.getUsers();
      const idx   = users.findIndex(u => u.id === user.id);
      if (idx === -1) return { ok: false, msg: 'Akun tidak ditemukan.' };

      // Check email uniqueness (exclude current user)
      const emailTaken = users.find((u, i) => i !== idx && u.email === email.trim().toLowerCase());
      if (emailTaken) return { ok: false, msg: 'Email sudah digunakan akun lain.' };

      users[idx].name   = name.trim();
      users[idx].email  = email.trim().toLowerCase();
      users[idx].avatar = avatar || users[idx].avatar || '';
      this.saveUsers(users);

      const remember = !!localStorage.getItem(KEY_SESS);
      this._setSession(users[idx], remember);
      return { ok: true, user: users[idx] };
    },

    /* ── Change password ──────────────────────────────────────── */
    changePassword(oldPass, newPass) {
      const user = this.getCurrentUser();
      if (!user) return { ok: false, msg: 'Silakan login terlebih dahulu.' };

      const users = this.getUsers();
      const idx   = users.findIndex(u => u.id === user.id);
      if (idx === -1) return { ok: false, msg: 'Akun tidak ditemukan.' };

      if (users[idx].password !== oldPass)
        return { ok: false, msg: 'Password saat ini salah.', field: 'old' };
      if (!newPass || newPass.length < 6)
        return { ok: false, msg: 'Password baru minimal 6 karakter.' };

      users[idx].password = newPass;
      this.saveUsers(users);
      return { ok: true };
    },

    /* ── Update store info (seller only) ──────────────────────── */
    updateStoreInfo({ storeName, category, location }) {
      const user = this.getCurrentUser();
      if (!user) return { ok: false, msg: 'Silakan login terlebih dahulu.' };
      if (user.role !== 'seller') return { ok: false, msg: 'Hanya seller yang dapat mengubah info toko.' };
      if (!storeName || storeName.trim().length < 3) return { ok: false, msg: 'Nama toko minimal 3 karakter.' };

      const users = this.getUsers();
      const idx   = users.findIndex(u => u.id === user.id);
      if (idx === -1) return { ok: false, msg: 'Akun tidak ditemukan.' };

      users[idx].storeName = storeName.trim();
      if (category)  users[idx].category = category;
      if (location)  users[idx].location = location;
      this.saveUsers(users);

      const remember = !!localStorage.getItem(KEY_SESS);
      this._setSession(users[idx], remember);
      return { ok: true, user: users[idx] };
    },

    /* ── Login ────────────────────────────────────────────────── */
    login(identifier, password, expectedRole, remember) {
      if (!identifier || !password)
        return { ok: false, msg: 'Username dan password wajib diisi.' };

      const users = this.getUsers();
      const user  = users.find(u =>
        (u.username === identifier.trim() || u.email === identifier.trim().toLowerCase())
      );

      if (!user)
        return { ok: false, msg: 'Akun tidak ditemukan. Periksa kembali username.' };
      if (user.password !== password)
        return { ok: false, msg: 'Password salah. Silakan coba lagi.' };
      if (expectedRole && user.role !== expectedRole)
        return { ok: false, msg: `Akun ini terdaftar sebagai <strong>${this._roleLabel(user.role)}</strong>, bukan ${this._roleLabel(expectedRole)}.` };

      this._setSession(user, remember);
      return { ok: true, user };
    },

    /* ── Logout ───────────────────────────────────────────────── */
    logout() {
      this._clearSession();
      this.toast('Berhasil logout. Sampai jumpa! 👋', 'ok');
      setTimeout(() => { window.location.href = rootPath() + 'index.html'; }, 800);
    },

    /* ── Register seller ──────────────────────────────────────── */
    registerSeller(data) {
      const { username, password, confirmPassword, ownerName, storeName, email, category, location } = data;
      if (!username || !password || !ownerName || !storeName || !email)
        return { ok: false, msg: 'Semua field wajib diisi.' };
      if (password.length < 6)
        return { ok: false, msg: 'Password minimal 6 karakter.' };
      if (password !== confirmPassword)
        return { ok: false, msg: 'Konfirmasi password tidak cocok.' };

      const users = this.getUsers();
      if (users.find(u => u.username === username.trim()))
        return { ok: false, msg: 'Username sudah digunakan, pilih yang lain.' };
      if (users.find(u => u.email === email.trim().toLowerCase()))
        return { ok: false, msg: 'Email sudah terdaftar.' };

      const newUser = {
        id: Math.max(0, ...users.map(u => u.id)) + 1,
        username: username.trim(),
        password,
        role: 'seller',
        name: ownerName.trim(),
        email: email.trim().toLowerCase(),
        storeName: storeName.trim(),
        storeId: 'store_' + Date.now(),
        category: category || 'makanan',
        location: location || 'Purbalingga Kota',
        avatar: `https://picsum.photos/seed/${username.trim()}/80/80`,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'active'
      };

      users.push(newUser);
      this.saveUsers(users);

      // Sync ke Supabase (async, tidak blokir proses register)
      if (typeof SB !== 'undefined') {
        setTimeout(() => {
          SB.post('pm_users', {
            id:            newUser.id,
            username:      newUser.username,
            password_hash: newUser.password,
            role:          'seller',
            name:          newUser.name,
            email:         newUser.email,
            phone:         null,
            avatar_url:    newUser.avatar,
            store_name:    newUser.storeName,
            store_id:      newUser.storeId,
            category:      newUser.category,
            location:      newUser.location,
            status:        'active',
            created_at:    new Date().toISOString(),
          }).catch(e => console.warn('[Auth] Sync seller ke Supabase gagal:', e.message));
        }, 200);
      }

      return { ok: true, user: newUser };
    },

    /* ── Register buyer (no store info needed) ────────────────── */
    registerBuyer(data) {
      const { username, password, confirmPassword, ownerName, email } = data;
      if (!username || !password || !ownerName || !email)
        return { ok: false, msg: 'Semua field wajib diisi.' };
      if (password.length < 6)
        return { ok: false, msg: 'Password minimal 6 karakter.' };
      if (password !== confirmPassword)
        return { ok: false, msg: 'Konfirmasi password tidak cocok.' };

      const users = this.getUsers();
      if (users.find(u => u.username === username.trim()))
        return { ok: false, msg: 'Username sudah digunakan, pilih yang lain.' };
      if (users.find(u => u.email === email.trim().toLowerCase()))
        return { ok: false, msg: 'Email sudah terdaftar.' };

      const newUser = {
        id: Math.max(0, ...users.map(u => u.id)) + 1,
        username: username.trim(),
        password,
        role: 'buyer',
        name: ownerName.trim(),
        email: email.trim().toLowerCase(),
        avatar: `https://picsum.photos/seed/${username.trim()}/80/80`,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'active'
      };

      users.push(newUser);
      this.saveUsers(users);

      // Sync ke Supabase (async, tidak blokir proses register)
      if (typeof SB !== 'undefined') {
        setTimeout(() => {
          SB.post('pm_users', {
            id:            newUser.id,
            username:      newUser.username,
            password_hash: newUser.password,
            role:          'buyer',
            name:          newUser.name,
            email:         newUser.email,
            phone:         null,
            avatar_url:    newUser.avatar,
            store_name:    null,
            store_id:      null,
            category:      null,
            location:      null,
            status:        'active',
            created_at:    new Date().toISOString(),
          }).catch(e => console.warn('[Auth] Sync buyer ke Supabase gagal:', e.message));
        }, 200);
      }

      return { ok: true, user: newUser };
    },

    /* ── Upgrade an existing buyer account to seller (Buka Toko) ── */
    upgradeToSeller(data) {
      const user = this.getCurrentUser();
      if (!user) return { ok: false, msg: 'Silakan login terlebih dahulu.' };
      if (user.role !== 'buyer') return { ok: false, msg: 'Hanya akun pembeli yang bisa membuka toko.' };

      const { storeName, category, location } = data;
      if (!storeName || storeName.trim().length < 3)
        return { ok: false, msg: 'Nama toko wajib diisi (min 3 karakter).' };
      if (!category)
        return { ok: false, msg: 'Pilih kategori toko.' };

      const users = this.getUsers();
      const idx = users.findIndex(u => u.id === user.id);
      if (idx === -1) return { ok: false, msg: 'Akun tidak ditemukan.' };

      users[idx].role      = 'seller';
      users[idx].storeName = storeName.trim();
      users[idx].storeId   = users[idx].storeId || ('store_' + Date.now());
      users[idx].category  = category;
      users[idx].location  = location || 'Purbalingga Kota';

      this.saveUsers(users);

      // Refresh the active session so the new role/store info takes effect immediately
      const remember = !!localStorage.getItem(KEY_SESS);
      this._setSession(users[idx], remember);

      return { ok: true, user: users[idx] };
    },

    /* ── Route protection ─────────────────────────────────────── */
    requireLogin(redirectTo) {
      if (!this.isLoggedIn()) {
        localStorage.setItem(KEY_REDIR, window.location.href);
        window.location.href = redirectTo || (rootPath() + 'login.html');
        return false;
      }
      return true;
    },

    requireRole(role, redirectTo) {
      const user = this.getCurrentUser();
      const base = redirectTo || (rootPath() + 'login.html');
      if (!user) {
        localStorage.setItem(KEY_REDIR, window.location.href);
        window.location.href = base + '?required=' + role;
        return false;
      }
      if (user.role !== role) {
        window.location.href = base + '?required=' + role + '&denied=1&current=' + user.role;
        return false;
      }
      return true;
    },

    /* ── Update navbar (homepage) ─────────────────────────────── */
    updateNavbar() {
      const nav = document.querySelector('.nav-acts');
      if (!nav) return;

      const user = this.getCurrentUser();
      const cartSVG = `<svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`;

      if (user) {
        nav.innerHTML = `
          <a href="orders.html" class="nav-btn nav-btn-ghost" id="nav-orders-btn" style="font-size:13px;position:relative">
            📋 Pesanan
            <span class="cart-dot" id="orders-pending-dot" style="display:none">0</span>
          </a>
          <button class="cart-btn" onclick="PM_AUTH._cartClick()" aria-label="Keranjang">
            ${cartSVG}<span class="cart-dot" id="cart-dot" style="display:none">0</span>
          </button>
          <div style="position:relative" id="pm-user-menu">
            <button class="pm-profile-btn" id="pm-profile-btn" onclick="PM_AUTH._toggleDrop()">
              <img src="${user.avatar||'https://picsum.photos/seed/def/80/80'}" alt="${user.name}"
                   onerror="this.src='https://picsum.photos/seed/default/80/80'">
              <div class="pm-profile-info">
                <span class="pm-pname">${user.name.split(' ')[0]}</span>
                <span class="pm-prole">${this._roleLabel(user.role)}</span>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6,9 12,15 18,9"/></svg>
            </button>
            <div class="pm-dropdown" id="pm-dropdown">
              ${this._menuItems(user)}
              <div style="border-top:1px solid #f1f5f9;margin:4px 0"></div>
              <button class="pm-dd-item pm-dd-logout" onclick="PM_AUTH.logout()">
                <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </button>
            </div>
          </div>`;

        document.addEventListener('click', e => {
          const d = document.getElementById('pm-dropdown');
          const b = document.getElementById('pm-profile-btn');
          if (d && b && !b.contains(e.target) && !d.contains(e.target))
            d.classList.remove('open');
        }, { passive: true });

        // Re-bind the new "Pesanan" button + badge (script.js)
        window.PM_SCRIPT?.initOrdersPanel?.();
        window.PM_SCRIPT?.updatePendingOrdersBadge?.();

      } else {
        nav.innerHTML = `
          <button class="cart-btn" onclick="PM_AUTH.showLoginModal()" aria-label="Keranjang">
            ${cartSVG}<span class="cart-dot" id="cart-dot" style="display:none">0</span>
          </button>
          <a href="login.html" class="nav-btn nav-btn-ghost">Masuk</a>
          <a href="register-store.html" class="nav-btn nav-btn-solid">Daftar Toko</a>`;
      }

      // Also update topbar links
      document.querySelectorAll('a.tb-link[href="#"]').forEach(a => {
        if (a.textContent.includes('Seller Panel') || a.textContent.includes('Daftar Toko')) {
          if (user && user.role === 'seller') a.href = 'seller.html';
          else if (user && user.role === 'admin') a.href = 'admin.html';
          else { a.href = 'login.html'; }
        }
      });

      // Hide "Daftar Toko" topbar link for sellers/admins (they already have a store)
      document.querySelectorAll('a.tb-link').forEach(a => {
        if (a.textContent.trim().includes('Daftar Toko')) {
          a.style.display = (user && (user.role === 'seller' || user.role === 'admin')) ? 'none' : '';
        }
      });
    },

    _toggleDrop() {
      document.getElementById('pm-dropdown')?.classList.toggle('open');
    },

    _cartClick() {
      if (!this.isLoggedIn()) { this.showLoginModal(); return; }
      this.toast('Fitur keranjang segera hadir! 🛒', 'info');
    },

    _menuItems(user) {
      if (user.role === 'admin') return `
        <a href="admin.html" class="pm-dd-item">
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Admin Dashboard
        </a>
        <a href="profile.html" class="pm-dd-item">
          <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Profil Saya
        </a>`;
      if (user.role === 'seller') return `
        <div class="pm-dd-store-info">
          <div class="pm-dd-store-name">${user.storeName || 'Toko Saya'}</div>
          <div class="pm-dd-store-cat">${user.category || ''} · ${user.location || ''}</div>
        </div>
        <a href="seller.html" class="pm-dd-item">
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Dashboard Seller
        </a>
        <a href="orders.html" class="pm-dd-item">
          <svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg>
          Pesanan Masuk
        </a>
        <a href="profile.html" class="pm-dd-item">
          <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Profil Saya
        </a>`;
      return `
        <div class="pm-dd-buyer-info">
          <div class="pm-dd-buyer-name">${user.name}</div>
          <div class="pm-dd-buyer-email">${user.email}</div>
        </div>
        <a href="profile.html" class="pm-dd-item">
          <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Profil Saya
        </a>
        <a href="orders.html" class="pm-dd-item">
          <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/></svg>
          Pesanan Saya
        </a>
        <a href="open-store.html" class="pm-dd-item">
          <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
          🏪 Buka Toko
        </a>`;
    },

    /* ── Login-required modal (homepage) ──────────────────────── */
    showLoginModal() {
      if (document.getElementById('pm-auth-modal')) return;
      const el = document.createElement('div');
      el.id = 'pm-auth-modal';
      el.className = 'pm-modal-overlay';
      el.innerHTML = `
        <div class="pm-modal-box">
          <div class="pm-modal-icon">🔐</div>
          <h3>Login Diperlukan</h3>
          <p>Silakan masuk ke akun Anda untuk melanjutkan transaksi di Purbalingga Mart.</p>
          <div class="pm-modal-acts">
            <button class="pm-btn-solid" onclick="window.location.href='login.html'">
              Masuk Sekarang
            </button>
            <button class="pm-btn-outline" onclick="document.getElementById('pm-auth-modal').remove()">
              Nanti Saja
            </button>
          </div>
          <a href="register-store.html" style="display:block;text-align:center;margin-top:14px;font-size:12.5px;color:#16a34a;font-weight:600">
            Belum punya akun? Daftar Seller →
          </a>
        </div>`;
      el.addEventListener('click', e => { if (e.target === el) el.remove(); });
      document.body.appendChild(el);
    },

    /* ── Guard for action buttons ─────────────────────────────── */
    guard(callback) {
      if (!this.isLoggedIn()) { this.showLoginModal(); return false; }
      if (callback) callback();
      return true;
    },

    /* ── Seller panel navbar update ───────────────────────────── */
    updateSellerNav() {
      const user = this.getCurrentUser();
      if (!user) return;
      document.querySelectorAll('.sb-store-name-text, .sb-store-av-img, .tb-profile-img, .tb-seller-name').forEach(el => {
        if (el.tagName === 'IMG') el.src = user.avatar || el.src;
        else if (el.classList.contains('sb-store-name-text')) el.textContent = user.storeName || 'Toko Saya';
        else if (el.classList.contains('tb-seller-name'))     el.textContent = user.name;
      });
    },

    /* ── Toast ────────────────────────────────────────────────── */
    toast(msg, type = '', dur = 3000) {
      let wrap = document.getElementById('pm-toast-wrap');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'pm-toast-wrap';
        wrap.style.cssText = 'position:fixed;bottom:22px;right:22px;z-index:99999;display:flex;flex-direction:column;gap:8px;align-items:flex-end;pointer-events:none';
        document.body.appendChild(wrap);
      }
      const colors = { ok: '#16a34a', err: '#ef4444', warn: '#f97316', info: '#3b82f6', '': '#1e293b' };
      const el = document.createElement('div');
      el.style.cssText = `background:${colors[type]||colors['']};color:#fff;padding:11px 18px;border-radius:10px;font-size:13px;font-weight:500;font-family:'Poppins',sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.15);pointer-events:auto;animation:pmTIn .25s ease;max-width:300px;display:flex;align-items:center;gap:8px`;
      el.innerHTML = msg;
      wrap.appendChild(el);
      setTimeout(() => { el.style.animation = 'pmTOut .25s ease forwards'; setTimeout(() => el.remove(), 250); }, dur);
    },

    /* ── Helper labels ────────────────────────────────────────── */
    _roleLabel(r) { return { admin:'👑 Admin', seller:'🏪 Seller', buyer:'🛒 Pembeli' }[r] || r; },

    /* ── Injected CSS for auth UI elements ────────────────────── */
    _injectStyles() {
      if (document.getElementById('pm-auth-style')) return;
      const s = document.createElement('style');
      s.id = 'pm-auth-style';
      s.textContent = `
        /* ── Profile button ── */
        .pm-profile-btn {
          display:flex;align-items:center;gap:8px;padding:4px 10px 4px 4px;
          border:1.5px solid #e2e8f0;border-radius:9999px;background:transparent;
          cursor:pointer;transition:all .2s;font-family:'Poppins',sans-serif;
        }
        .pm-profile-btn:hover{border-color:#16a34a;background:#f0fdf4}
        .pm-profile-btn img{width:28px;height:28px;border-radius:50%;object-fit:cover}
        .pm-profile-info{display:flex;flex-direction:column;line-height:1.15;text-align:left}
        .pm-pname{font-size:12.5px;font-weight:700;color:#1e293b}
        .pm-prole{font-size:10px;color:#16a34a;font-weight:600}

        /* ── Dropdown ── */
        .pm-dropdown {
          display:none;position:absolute;top:calc(100% + 10px);right:0;
          background:#fff;border:1px solid #e2e8f0;border-radius:12px;
          box-shadow:0 16px 40px rgba(0,0,0,.12);min-width:200px;
          padding:8px 0;z-index:9999;animation:pmDrop .18s ease;
        }
        .pm-dropdown.open{display:block}
        @keyframes pmDrop{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .pm-dd-item{
          display:flex;align-items:center;gap:10px;padding:10px 16px;
          font-size:13px;font-weight:500;color:#334155;transition:all .15s;
          background:none;border:none;cursor:pointer;font-family:'Poppins',sans-serif;
          width:100%;text-align:left;text-decoration:none;
        }
        .pm-dd-item svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2;flex-shrink:0}
        .pm-dd-item:hover{background:#f8fafc;color:#16a34a}
        .pm-dd-logout{color:#ef4444}.pm-dd-logout:hover{background:#fef2f2;color:#dc2626}
        .pm-dd-store-info{padding:10px 16px 6px;border-bottom:1px solid #f1f5f9;margin-bottom:4px}
        .pm-dd-store-name{font-size:13px;font-weight:700;color:#1e293b}
        .pm-dd-store-cat{font-size:11px;color:#94a3b8;margin-top:1px;text-transform:capitalize}
        .pm-dd-buyer-info{padding:10px 16px 6px;border-bottom:1px solid #f1f5f9;margin-bottom:4px}
        .pm-dd-buyer-name{font-size:13px;font-weight:700;color:#1e293b}
        .pm-dd-buyer-email{font-size:11px;color:#94a3b8;margin-top:1px}

        /* ── Login-required modal ── */
        .pm-modal-overlay {
          position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99998;
          display:grid;place-items:center;padding:20px;backdrop-filter:blur(4px);
          animation:pmFadeIn .2s ease;
        }
        @keyframes pmFadeIn{from{opacity:0}to{opacity:1}}
        .pm-modal-box {
          background:#fff;border-radius:16px;padding:32px;max-width:380px;width:100%;
          box-shadow:0 24px 60px rgba(0,0,0,.15);text-align:center;
          animation:pmScaleIn .22s ease;
        }
        @keyframes pmScaleIn{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
        .pm-modal-icon{font-size:48px;margin-bottom:14px}
        .pm-modal-box h3{font-size:18px;font-weight:800;color:#1e293b;margin-bottom:8px;font-family:'Poppins',sans-serif}
        .pm-modal-box p{font-size:13.5px;color:#64748b;margin-bottom:22px;line-height:1.6;font-family:'Poppins',sans-serif}
        .pm-modal-acts{display:flex;gap:10px}
        .pm-btn-solid{flex:1;padding:11px;background:#16a34a;color:#fff;border:none;border-radius:9px;font-size:13.5px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif;transition:all .2s}
        .pm-btn-solid:hover{background:#15803d}
        .pm-btn-outline{flex:1;padding:11px;background:#f1f5f9;color:#64748b;border:1.5px solid #e2e8f0;border-radius:9px;font-size:13.5px;font-weight:600;cursor:pointer;font-family:'Poppins',sans-serif;transition:all .2s}
        .pm-btn-outline:hover{background:#e2e8f0}

        /* ── Toast ── */
        @keyframes pmTIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
        @keyframes pmTOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(24px)}}

        /* ── Auth banner (redirect notice) ── */
        .pm-auth-banner {
          position:fixed;top:20px;left:50%;transform:translateX(-50%);
          background:#1e293b;color:#fff;padding:10px 22px;border-radius:10px;
          font-size:13px;font-weight:600;font-family:'Poppins',sans-serif;
          box-shadow:0 8px 28px rgba(0,0,0,.15);z-index:99999;
          animation:pmTIn .3s ease;white-space:nowrap;
        }
        .pm-auth-banner.warn{background:#f97316}
        .pm-auth-banner.err{background:#ef4444}
      `;
      document.head.appendChild(s);
    }
  };

  /* ── Expose globally ──────────────────────────────────────── */
  window.PM_AUTH = PM_AUTH;
  PM_AUTH.init();

})();
