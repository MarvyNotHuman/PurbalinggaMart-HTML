/* ================================================================
   PURBALINGGA MART — open-store.js
   Handles halaman Buka Toko (upgrade buyer → seller)
   ================================================================ */
"use strict";

(function () {

  /* ── Helpers ─────────────────────────────────────────────── */
  const $ = id => document.getElementById(id);

  function showAlert(msg, type = 'err') {
    const box = $('os-alert');
    const txt = $('os-alert-msg');
    if (!box || !txt) return;
    txt.textContent = msg;
    box.style.display = 'flex';
    box.style.background = type === 'ok' ? '#f0fdf4' : '#fef2f2';
    box.style.borderColor = type === 'ok' ? '#bbf7d0' : '#fecaca';
    box.style.color       = type === 'ok' ? '#166534' : '#991b1b';
  }

  function hideAlert() {
    const box = $('os-alert');
    if (box) box.style.display = 'none';
  }

  function setErr(id, msg) {
    const el = $(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = msg ? 'block' : 'none';
  }

  function clearErrs() {
    ['os-storename', 'os-category'].forEach(id => {
      const inp = $(id);
      if (inp) inp.classList.remove('error');
    });
    setErr('os-storename-err', '');
    setErr('os-category-err', '');
    hideAlert();
  }

  /* ── Cek login saat halaman dibuka ──────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {

    // Redirect ke login jika belum login
    if (!PM_AUTH.isLoggedIn()) {
      localStorage.setItem('pm_redir_after_login', window.location.href);
      window.location.href = 'login.html';
      return;
    }

    // Jika sudah seller/admin, langsung ke seller panel
    const user = PM_AUTH.getCurrentUser();
    if (user && user.role === 'seller') {
      window.location.href = 'seller.html';
      return;
    }
    if (user && user.role === 'admin') {
      window.location.href = 'admin.html';
      return;
    }

    // Tampilkan nama user di halaman jika ada
    const sub = document.querySelector('.auth-card-sub');
    if (sub && user) {
      sub.textContent = `Halo, ${user.name}! Lengkapi informasi toko untuk mulai berjualan di Purbalingga Mart.`;
    }

    /* ── Handle submit ──────────────────────────────────────── */
    const btn = $('os-submit');
    if (!btn) return;

    btn.addEventListener('click', async function () {
      clearErrs();

      const storeName = ($('os-storename')?.value || '').trim();
      const category  = $('os-category')?.value || '';
      const location  = $('os-location')?.value || 'Purbalingga Kota';

      // Validasi
      let valid = true;

      if (storeName.length < 3) {
        setErr('os-storename-err', 'Nama toko wajib diisi (min 3 karakter).');
        $('os-storename')?.classList.add('error');
        valid = false;
      }

      if (!category) {
        setErr('os-category-err', 'Pilih kategori toko terlebih dahulu.');
        $('os-category')?.classList.add('error');
        valid = false;
      }

      if (!valid) return;

      // Disable tombol selama proses
      btn.disabled = true;
      btn.textContent = 'Memproses...';

      // Upgrade akun ke seller via PM_AUTH
      const result = PM_AUTH.upgradeToSeller({ storeName, category, location });

      if (!result.ok) {
        showAlert(result.msg, 'err');
        btn.disabled = false;
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#fff" stroke-width="2.5"><polyline points="20,6 9,17 4,12"/></svg> Buka Toko Sekarang`;
        return;
      }

      // Sync ke Supabase (opsional, tidak blokir jika gagal)
      try {
        if (window.SB) {
          await SB.post('pm_users', {
            id:           result.user.id,
            username:     result.user.username,
            password_hash: result.user.password,
            role:         'seller',
            name:         result.user.name,
            email:        result.user.email,
            phone:        result.user.phone || null,
            store_name:   storeName,
            store_id:     result.user.storeId,
            category:     category,
            location:     location,
            status:       'active',
          }).catch(() => {
            // Jika sudah ada (conflict), coba patch
            return SB.patch('pm_users', `?id=eq.${result.user.id}`, {
              role:       'seller',
              store_name: storeName,
              store_id:   result.user.storeId,
              category:   category,
              location:   location,
            }).catch(() => {});
          });
        }
      } catch (e) {
        console.warn('[OpenStore] Sync Supabase gagal (tersimpan lokal):', e.message);
      }

      // Sukses
      showAlert('🎉 Toko berhasil dibuka! Mengalihkan ke Seller Panel...', 'ok');

      setTimeout(() => {
        window.location.href = 'seller.html';
      }, 1500);
    });

  });

})();
