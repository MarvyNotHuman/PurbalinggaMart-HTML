/* ================================================================
   PURBALINGGA MART — supabase-config.js
   Koneksi Supabase + Modul Fitur Baru:
   1. Foto QRIS di checkout
   2. Upload foto produk asli
   3. Notifikasi real-time
   4. Rating & ulasan produk
   5. Tracking pengiriman
   ================================================================ */
"use strict";

/* ============================================================
   🔧 KONFIGURASI — Ganti dengan URL & KEY Supabase kamu!
   ============================================================ */
const SUPABASE_URL  = 'https://idhjiixsjlxcfamwddgk.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkaGppaXhzamx4Y2ZhbXdkZGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2ODQ1NDIsImV4cCI6MjA5NzI2MDU0Mn0.f1m_2vS8H7h9hiDo8mwNn-oYHJBn8uxDqu4KpuS2jU8';

/* ── Supabase REST helper ─────────────────────────────────── */
const SB = {
  headers: {
    apikey: SUPABASE_ANON,
    Authorization: "Bearer " + SUPABASE_ANON,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },

  async get(table, query = "") {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
      headers: this.headers,
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  async post(table, body) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  async patch(table, query, body) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
      method: "PATCH",
      headers: { ...this.headers, Prefer: "return=representation" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  async delete(table, query) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
      method: "DELETE",
      headers: this.headers,
    });
    if (!r.ok) throw new Error(await r.text());
    return true;
  },

  /* Upload file ke Supabase Storage */
  async uploadFile(bucket, path, file) {
    const r = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: "Bearer " + SUPABASE_ANON,
          "Content-Type": file.type,
          "Cache-Control": "3600",
          "x-upsert": "true",
        },
        body: file,
      },
    );
    if (!r.ok) throw new Error(await r.text());
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  },

  /* Realtime subscribe via WebSocket */
  subscribe(table, event = "*", callback) {
    const wsUrl =
      SUPABASE_URL.replace("https://", "wss://") +
      "/realtime/v1/websocket?apikey=" +
      SUPABASE_ANON +
      "&vsn=1.0.0";
    const ws = new WebSocket(wsUrl);
    const channel = "realtime:public:" + table;
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          topic: channel,
          event: "phx_join",
          payload: {},
          ref: "1",
        }),
      );
    };
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (
        msg.event === "INSERT" ||
        msg.event === "UPDATE" ||
        msg.event === "DELETE"
      ) {
        if (event === "*" || msg.event === event) callback(msg.payload);
      }
    };
    ws.onerror = (err) => console.warn("[Realtime] WebSocket error:", err);
    return ws; // caller dapat .close()
  },
};

/* ============================================================
   ① FOTO QRIS — Ambil dari Supabase, tampil di checkout
   ============================================================ */
const PM_QRIS = {
  async getConfig() {
    try {
      const rows = await SB.get(
        "pm_payment_config",
        "?seller_id=eq.global&select=*",
      );
      return rows[0] || null;
    } catch (e) {
      console.warn("[QRIS] Gagal ambil config:", e.message);
      return null;
    }
  },

  /* Tampilkan QRIS foto di halaman checkout */
  async renderInCheckout() {
    const box = document.getElementById("ck-qris-box");
    if (!box) return;

    box.innerHTML = `<div style="text-align:center;padding:20px;color:#94a3b8">
      <div style="font-size:22px;margin-bottom:6px">⏳</div>
      <div style="font-size:12px">Memuat QRIS...</div>
    </div>`;

    const cfg = await this.getConfig();
    if (cfg?.qris_url) {
      box.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:8px 0">
          <img src="${cfg.qris_url}" alt="QRIS Purbalingga Mart"
               style="width:180px;height:180px;object-fit:contain;border-radius:10px;border:2px solid #dcfce7"
               onerror="this.parentElement.innerHTML='<div style=color:#ef4444;font-size:12px>❌ Gagal memuat QRIS</div>'">
          <div style="font-size:12px;color:#16a34a;font-weight:700">QRIS Purbalingga Mart</div>
          <div style="font-size:11.5px;color:#64748b;text-align:center">
            Scan dengan GoPay, OVO, Dana, ShopeePay, atau m-banking
          </div>
          <button onclick="PM_QRIS.downloadQRIS('${cfg.qris_url}')"
                  style="background:#f0fdf4;border:1.5px solid #16a34a;color:#16a34a;padding:6px 14px;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer">
            ⬇️ Download QRIS
          </button>
        </div>`;
    } else {
      box.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px;text-align:center">
          <div style="font-size:32px">📱</div>
          <div style="font-size:13px;font-weight:700;color:#1e293b">QRIS Purbalingga Mart</div>
          <div style="font-size:11.5px;color:#64748b">Hubungi seller via WhatsApp untuk minta QRIS</div>
        </div>`;
    }
  },

  downloadQRIS(url) {
    const a = document.createElement("a");
    a.href = url;
    a.download = "QRIS-PurbalinggaMart.png";
    a.target = "_blank";
    a.click();
  },

  /* Upload QRIS baru (dari admin panel) */
  async uploadQRIS(file) {
    const path = `qris/purbalingga-mart-${Date.now()}.png`;
    const url = await SB.uploadFile("qris-images", path, file);
    await SB.patch("pm_payment_config", "?seller_id=eq.global", {
      qris_url: url,
      updated_at: new Date().toISOString(),
    });
    return url;
  },
};

/* ============================================================
   ② UPLOAD FOTO PRODUK — ke Supabase Storage
   ============================================================ */
const PM_UPLOAD = {
  /* Upload gambar produk ke bucket Supabase */
  async uploadProductImage(file, productName) {
    if (!file) return null;
    if (file.size > 5 * 1024 * 1024)
      throw new Error("Ukuran gambar maksimal 5MB");

    const ext = file.name.split(".").pop().toLowerCase() || "jpg";
    const slug = (productName || "produk")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .slice(0, 30);
    const path = `products/${slug}-${Date.now()}.${ext}`;

    return await SB.uploadFile("product-images", path, file);
  },

  /* Buat preview lokal sementara sebelum upload */
  previewLocal(file, imgEl) {
    if (!file || !imgEl) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      imgEl.src = e.target.result;
      imgEl.style.display = "block";
    };
    reader.readAsDataURL(file);
  },

  /* Sync produk ke Supabase setelah disimpan ke localStorage */
  async syncProduct(product) {
    try {
      const row = {
        id: product.id,
        seller_id: product.sellerId || product.sellerUsername,
        seller_username: product.sellerUsername,
        store_name: product.storeName,
        store_id: product.storeId,
        name: product.name,
        category: product.category,
        location: product.location,
        price: product.price,
        original_price: product.originalPrice || product.price,
        stock: product.stock,
        sold: product.sold || 0,
        rating: product.rating || 0,
        rating_count: product.ratingCount || 0,
        badge: product.badge || null,
        promo: product.promo || false,
        perishable: product.perishable || false,
        description: product.description || "",
        image_url: product.image,
        status: product.status || "active",
        created_at: product.createdAt,
        updated_at: new Date().toISOString(),
      };
      /* Upsert: insert jika baru, update jika sudah ada (on conflict id) */
      const r = await fetch(`${SUPABASE_URL}/rest/v1/pm_products`, {
        method: "POST",
        headers: {
          ...SB.headers,
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(row),
      });
      if (!r.ok) {
        const err = await r.text();
        console.warn("[Upload] Sync produk gagal:", err);
      }
    } catch (e) {
      console.warn(
        "[Upload] Sync produk gagal (tetap tersimpan lokal):",
        e.message,
      );
    }
  },
};

/* ============================================================
   ③ NOTIFIKASI REAL-TIME
   ============================================================ */
const PM_NOTIFY = {
  _ws: null,
  _badge: null,

  /* Kirim notifikasi ke database (dipanggil saat order dibuat) */
  async send({ userId, type, title, body, data = {} }) {
    try {
      await SB.post("pm_notifications", {
        user_id: userId,
        type,
        title,
        body,
        data: JSON.stringify(data),
        read: false,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("[Notify] Gagal kirim:", e.message);
    }
  },

  /* Ambil notifikasi user */
  async getForUser(userId) {
    try {
      return await SB.get(
        "pm_notifications",
        `?user_id=eq.${userId}&order=created_at.desc&limit=30`,
      );
    } catch {
      return [];
    }
  },

  /* Tandai sudah dibaca */
  async markRead(notifId) {
    try {
      await SB.patch("pm_notifications", `?id=eq.${notifId}`, { read: true });
    } catch {}
  },

  async markAllRead(userId) {
    try {
      await SB.patch(
        "pm_notifications",
        `?user_id=eq.${userId}&read=eq.false`,
        { read: true },
      );
    } catch {}
  },

  /* Hitung notif belum dibaca */
  async getUnreadCount(userId) {
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/pm_notifications?user_id=eq.${userId}&read=eq.false&select=id`,
        { headers: SB.headers },
      );
      const rows = await r.json();
      return rows.length;
    } catch {
      return 0;
    }
  },

  /* Mulai listen realtime (untuk seller — pesanan baru) */
  startListen(userId, onNew) {
    if (this._ws) this._ws.close();
    // Fallback polling setiap 15 detik (lebih stabil dari WS)
    this._pollInterval = setInterval(async () => {
      const count = await this.getUnreadCount(userId);
      this._updateBadge(count);
      if (count > 0) onNew && onNew(count);
    }, 15000);

    // Cek sekali langsung
    this.getUnreadCount(userId).then((c) => this._updateBadge(c));
  },

  stopListen() {
    clearInterval(this._pollInterval);
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
  },

  _updateBadge(count) {
    const badge = document.getElementById("pm-notif-badge");
    if (!badge) return;
    badge.textContent = count;
    badge.style.display = count > 0 ? "inline-flex" : "none";
  },

  /* Render panel notifikasi */
  async renderPanel(userId) {
    const notifs = await this.getForUser(userId);
    await this.markAllRead(userId);
    this._updateBadge(0);

    const icons = {
      new_order: "🛒",
      status_update: "📦",
      review: "⭐",
      promo: "🎉",
    };
    if (!notifs.length)
      return '<div style="text-align:center;padding:30px;color:#94a3b8;font-size:13px">Belum ada notifikasi</div>';

    return notifs
      .map(
        (n) => `
      <div class="pm-notif-item ${n.read ? "" : "unread"}" onclick="PM_NOTIFY.markRead('${n.id}')">
        <div class="pm-notif-icon">${icons[n.type] || "🔔"}</div>
        <div class="pm-notif-body">
          <div class="pm-notif-title">${n.title}</div>
          <div class="pm-notif-msg">${n.body}</div>
          <div class="pm-notif-time">${PM_NOTIFY._relTime(n.created_at)}</div>
        </div>
      </div>`,
      )
      .join("");
  },

  _relTime(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Baru saja";
    if (m < 60) return m + " menit lalu";
    const h = Math.floor(m / 60);
    if (h < 24) return h + " jam lalu";
    return Math.floor(h / 24) + " hari lalu";
  },
};

/* ============================================================
   ④ RATING & ULASAN PRODUK
   ============================================================ */
const PM_RATING = {
  /* Ambil semua ulasan satu produk */
  async getProductReviews(productId) {
    try {
      return await SB.get(
        "pm_reviews",
        `?product_id=eq.${productId}&order=created_at.desc&limit=20`,
      );
    } catch {
      return [];
    }
  },

  /* Kirim ulasan baru */
  async submitReview({
    productId,
    transactionId,
    buyerId,
    buyerName,
    buyerAvatar,
    rating,
    review,
    imageUrls = [],
  }) {
    const data = {
      product_id: productId,
      transaction_id: transactionId,
      buyer_id: buyerId,
      buyer_name: buyerName,
      buyer_avatar: buyerAvatar || null,
      rating,
      review: review || null,
      image_urls: JSON.stringify(imageUrls),
      created_at: new Date().toISOString(),
    };
    const rows = await SB.post("pm_reviews", data);
    // Update rata-rata rating produk di localStorage
    await this._recalcRating(productId);
    return rows[0];
  },

  /* Recalculate rating rata-rata produk */
  async _recalcRating(productId) {
    try {
      const reviews = await this.getProductReviews(productId);
      if (!reviews.length) return;
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      // Update localStorage
      const product = PM_DB.getProductById(productId);
      if (product) {
        PM_DB.updateProduct(productId, {
          rating: parseFloat(avg.toFixed(1)),
          ratingCount: reviews.length,
        });
      }
      // Sync ke Supabase juga
      await SB.patch("pm_products", `?id=eq.${productId}`, {
        rating: parseFloat(avg.toFixed(1)),
        rating_count: reviews.length,
      }).catch(() => {});
    } catch {}
  },

  /* Cek apakah user sudah review transaksi ini */
  async hasReviewed(productId, transactionId, buyerId) {
    try {
      const rows = await SB.get(
        "pm_reviews",
        `?product_id=eq.${productId}&transaction_id=eq.${transactionId}&buyer_id=eq.${buyerId}&select=id`,
      );
      return rows.length > 0;
    } catch {
      return false;
    }
  },

  /* Render bintang HTML */
  starsHtml(rating, interactive = false, name = "rating") {
    if (interactive) {
      return [1, 2, 3, 4, 5]
        .map(
          (i) => `
        <label class="pm-star-label" for="star${i}">
          <input type="radio" name="${name}" id="star${i}" value="${i}" class="pm-star-input">
          <span class="pm-star ${i <= rating ? "filled" : ""}">★</span>
        </label>`,
        )
        .join("");
    }
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    return [1, 2, 3, 4, 5]
      .map((i) => {
        if (i <= full) return '<span class="pm-star filled">★</span>';
        if (i === full + 1 && half)
          return '<span class="pm-star half">★</span>';
        return '<span class="pm-star">☆</span>';
      })
      .join("");
  },

  /* Render daftar ulasan di halaman produk/modal */
  async renderReviews(productId, container) {
    if (!container) return;
    container.innerHTML = `<div style="text-align:center;padding:20px;color:#94a3b8;font-size:12px">Memuat ulasan...</div>`;

    const reviews = await this.getProductReviews(productId);
    if (!reviews.length) {
      container.innerHTML = `<div style="text-align:center;padding:24px;color:#94a3b8">
        <div style="font-size:28px;margin-bottom:6px">⭐</div>
        <div style="font-size:13px">Belum ada ulasan untuk produk ini</div>
      </div>`;
      return;
    }

    const avgRating =
      reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    container.innerHTML = `
      <div class="pm-review-summary">
        <div class="pm-review-avg">${avgRating.toFixed(1)}</div>
        <div class="pm-review-stars">${this.starsHtml(avgRating)}</div>
        <div class="pm-review-count">${reviews.length} ulasan</div>
      </div>
      <div class="pm-review-list">
        ${reviews
          .map(
            (r) => `
          <div class="pm-review-item">
            <div class="pm-review-head">
              <img class="pm-review-avatar" src="${r.buyer_avatar || "https://picsum.photos/seed/" + r.buyer_id + "/40/40"}"
                   onerror="this.src='https://picsum.photos/seed/default/40/40'" alt="${r.buyer_name}">
              <div>
                <div class="pm-review-name">${r.buyer_name}</div>
                <div class="pm-review-stars-row">${this.starsHtml(r.rating)}</div>
              </div>
              <div class="pm-review-date">${PM_NOTIFY._relTime(r.created_at)}</div>
            </div>
            ${r.review ? `<div class="pm-review-text">${r.review}</div>` : ""}
            ${r.seller_reply ? `<div class="pm-review-reply">💬 Seller: ${r.seller_reply}</div>` : ""}
          </div>`,
          )
          .join("")}
      </div>`;
  },

  /* Modal tulis ulasan */
  openModal({ productId, productName, transactionId, buyer }) {
    document.getElementById("pm-review-modal")?.remove();
    const modal = document.createElement("div");
    modal.id = "pm-review-modal";
    modal.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px";
    modal.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:28px;max-width:460px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.2)">
        <div style="font-size:17px;font-weight:800;color:#1e293b;margin-bottom:4px">⭐ Beri Ulasan</div>
        <div style="font-size:13px;color:#64748b;margin-bottom:18px">${productName}</div>
        <div style="display:flex;justify-content:center;gap:4px;margin-bottom:18px" id="pm-star-row">
          ${[1, 2, 3, 4, 5]
            .map(
              (i) => `
            <span class="pm-star-pick" data-val="${i}" onclick="PM_RATING._pickStar(${i})"
                  style="font-size:32px;cursor:pointer;color:#d1d5db;transition:color .1s">★</span>`,
            )
            .join("")}
        </div>
        <div style="text-align:center;font-size:12.5px;color:#94a3b8;margin-bottom:14px" id="pm-star-label">Klik bintang untuk memberi nilai</div>
        <textarea id="pm-review-text" placeholder="Tulis ulasan kamu... (opsional)"
          style="width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 12px;font-size:13px;font-family:'Poppins',sans-serif;resize:vertical;min-height:80px;box-sizing:border-box"></textarea>
        <div style="display:flex;gap:10px;margin-top:16px">
          <button onclick="document.getElementById('pm-review-modal').remove()"
                  style="flex:1;padding:10px;border:1.5px solid #e2e8f0;border-radius:9px;font-size:13.5px;font-weight:700;color:#64748b;background:#f8fafc;cursor:pointer">
            Batal
          </button>
          <button onclick="PM_RATING._submitModal('${productId}','${transactionId}',${JSON.stringify(buyer).replace(/"/g, "'")})"
                  style="flex:2;padding:10px;background:#16a34a;border:none;border-radius:9px;font-size:13.5px;font-weight:800;color:#fff;cursor:pointer">
            Kirim Ulasan
          </button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
  },

  _selectedStar: 0,

  _pickStar(val) {
    this._selectedStar = val;
    const labels = [
      "",
      "Jelek 😞",
      "Kurang 😐",
      "Oke 🙂",
      "Bagus 😊",
      "Luar Biasa! 🌟",
    ];
    const row = document.getElementById("pm-star-row");
    if (row) {
      row.querySelectorAll(".pm-star-pick").forEach((s) => {
        s.style.color = parseInt(s.dataset.val) <= val ? "#f59e0b" : "#d1d5db";
      });
    }
    const lbl = document.getElementById("pm-star-label");
    if (lbl) lbl.textContent = labels[val];
  },

  async _submitModal(productId, transactionId, buyer) {
    if (!this._selectedStar) {
      PM_AUTH.toast("Pilih bintang terlebih dahulu", "warn");
      return;
    }
    const review = document.getElementById("pm-review-text")?.value.trim();
    try {
      await this.submitReview({
        productId,
        transactionId,
        buyerId: buyer.id,
        buyerName: buyer.name,
        buyerAvatar: buyer.avatar,
        rating: this._selectedStar,
        review,
      });
      document.getElementById("pm-review-modal")?.remove();
      PM_AUTH.toast("✅ Ulasan berhasil dikirim! Terima kasih", "ok");
    } catch (e) {
      PM_AUTH.toast("Gagal mengirim ulasan: " + e.message, "err");
    }
  },
};

/* ============================================================
   ⑤ TRACKING PENGIRIMAN
   ============================================================ */
const PM_TRACK = {
  STATUS_CONFIG: {
    pending: {
      icon: "📋",
      label: "Pesanan Dibuat",
      color: "#f59e0b",
      bg: "#fef3c7",
    },
    diproses: {
      icon: "🏭",
      label: "Sedang Diproses",
      color: "#3b82f6",
      bg: "#dbeafe",
    },
    dikemas: {
      icon: "📦",
      label: "Sedang Dikemas",
      color: "#8b5cf6",
      bg: "#ede9fe",
    },
    dikirim: {
      icon: "🚚",
      label: "Dalam Pengiriman",
      color: "#f97316",
      bg: "#fed7aa",
    },
    tiba: {
      icon: "📍",
      label: "Tiba di Kota Tujuan",
      color: "#06b6d4",
      bg: "#cffafe",
    },
    diterima: {
      icon: "🤝",
      label: "Diterima Pembeli",
      color: "#22c55e",
      bg: "#dcfce7",
    },
    selesai: { icon: "✅", label: "Selesai", color: "#16a34a", bg: "#f0fdf4" },
    dibatalkan: {
      icon: "❌",
      label: "Dibatalkan",
      color: "#ef4444",
      bg: "#fee2e2",
    },
  },

  /* Tambah event tracking baru */
  async addEvent({
    transactionId,
    status,
    location,
    description,
    courier,
    resiNumber,
    createdBy,
  }) {
    const row = {
      transaction_id: transactionId,
      status,
      location: location || "",
      description,
      courier: courier || null,
      resi_number: resiNumber || null,
      created_by: createdBy || "",
      created_at: new Date().toISOString(),
    };
    const result = await SB.post("pm_tracking", row);

    // [FIX] Update status transaksi di localStorage untuk semua status relevan
    // (sebelumnya hanya 'dikirim','selesai','dibatalkan'; 'diterima' di-map ke 'selesai' secara salah)
    const statusesYangUpdateTx = ['diproses','dikemas','dikirim','tiba','diterima','selesai','dibatalkan'];
    if (statusesYangUpdateTx.includes(status)) {
      PM_TX.updateStatus(
        transactionId,
        status,  // [FIX] simpan 'diterima' apa adanya, tidak dikonversi ke 'selesai'
        description,
      );
    }

    // Kirim notifikasi ke buyer
    const tx = PM_TX.getById(transactionId);
    if (tx) {
      const cfg = this.STATUS_CONFIG[status] || {};
      await PM_NOTIFY.send({
        userId: tx.buyerId,
        type: "status_update",
        title: `${cfg.icon || "📦"} Pesanan ${transactionId.slice(-8)}`,
        body: `${cfg.label || status}: ${description}`,
        data: { transactionId, status },
      });
    }
    return result[0];
  },

  /* Ambil semua event tracking satu transaksi */
  async getEvents(transactionId) {
    try {
      return await SB.get(
        "pm_tracking",
        `?transaction_id=eq.${transactionId}&order=created_at.asc`,
      );
    } catch {
      return [];
    }
  },

  /* Render timeline tracking */
  async renderTimeline(transactionId, container) {
    if (!container) return;
    container.innerHTML = `<div style="padding:20px;text-align:center;color:#94a3b8;font-size:12px">
      <div style="font-size:20px;margin-bottom:6px">⏳</div>Memuat tracking...</div>`;

    const events = await this.getEvents(transactionId);
    const tx = PM_TX.getById(transactionId);
    const history = tx?.statusHistory || [];

    // Gabungkan tracking Supabase + history localStorage
    const allEvents = [
      ...history.map((h) => ({
        created_at: h.time,
        status: h.status,
        description: h.note || h.status,
        location: "",
        courier: null,
        resi_number: null,
        _source: "local",
      })),
      ...events,
    ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    if (!allEvents.length) {
      container.innerHTML = `<div style="padding:24px;text-align:center;color:#94a3b8;font-size:13px">
        Belum ada update tracking</div>`;
      return;
    }

    container.innerHTML = `
      <div class="pm-track-wrap">
        ${
          events[0]?.resi_number
            ? `
          <div class="pm-track-resi">
            🚚 No. Resi: <strong>${events[0].resi_number}</strong>
            <button onclick="navigator.clipboard.writeText('${events[0].resi_number}');PM_AUTH.toast('Resi disalin!','ok',1500)"
                    style="margin-left:8px;background:#f0fdf4;border:1px solid #16a34a;color:#16a34a;padding:2px 8px;border-radius:5px;font-size:11px;cursor:pointer">
              Salin
            </button>
          </div>`
            : ""
        }
        <div class="pm-track-timeline">
          ${allEvents
            .map((ev, i) => {
              const cfg = this.STATUS_CONFIG[ev.status] || {
                icon: "📋",
                label: ev.status,
                color: "#64748b",
                bg: "#f1f5f9",
              };
              const isLast = i === allEvents.length - 1;
              return `
              <div class="pm-track-event ${isLast ? "latest" : ""}">
                <div class="pm-track-dot" style="background:${cfg.bg};border:2px solid ${cfg.color}">
                  <span style="font-size:13px">${cfg.icon}</span>
                </div>
                <div class="pm-track-line"></div>
                <div class="pm-track-info">
                  <div class="pm-track-status" style="color:${cfg.color}">${cfg.label}</div>
                  <div class="pm-track-desc">${ev.description}</div>
                  ${ev.location ? `<div class="pm-track-loc">📍 ${ev.location}</div>` : ""}
                  ${ev.courier ? `<div class="pm-track-courier">🚚 ${ev.courier}</div>` : ""}
                  <div class="pm-track-time">${PM_NOTIFY._relTime(ev.created_at)}</div>
                </div>
              </div>`;
            })
            .join("")}
        </div>
      </div>`;
  },

  /* Tambah CSS tracking ke halaman */
  injectStyles() {
    if (document.getElementById("pm-track-styles")) return;
    const style = document.createElement("style");
    style.id = "pm-track-styles";
    style.textContent = `
      .pm-track-wrap    { padding:4px 0; }
      .pm-track-resi    { background:#f0fdf4;border:1px solid #dcfce7;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:13px;color:#166534; }
      .pm-track-timeline{ display:flex;flex-direction:column;gap:0; }
      .pm-track-event   { display:flex;gap:12px;position:relative;padding-bottom:18px; }
      .pm-track-event.latest .pm-track-line { display:none; }
      .pm-track-dot     { width:36px;height:36px;border-radius:50%;display:grid;place-items:center;flex-shrink:0;z-index:1; }
      .pm-track-line    { position:absolute;left:17px;top:36px;bottom:0;width:2px;background:#e2e8f0;z-index:0; }
      .pm-track-info    { flex:1;padding-top:6px; }
      .pm-track-status  { font-size:13.5px;font-weight:800;margin-bottom:2px; }
      .pm-track-desc    { font-size:12.5px;color:#475569;margin-bottom:2px; }
      .pm-track-loc,
      .pm-track-courier { font-size:11.5px;color:#94a3b8; }
      .pm-track-time    { font-size:11px;color:#cbd5e1;margin-top:3px; }

      /* Rating styles */
      .pm-review-summary{ display:flex;align-items:center;gap:10px;padding:14px 0;margin-bottom:12px;border-bottom:1px solid #f1f5f9; }
      .pm-review-avg    { font-size:36px;font-weight:900;color:#1e293b; }
      .pm-review-stars  { display:flex;flex-direction:column;gap:2px; }
      .pm-review-count  { font-size:12px;color:#64748b; }
      .pm-review-list   { display:flex;flex-direction:column;gap:14px; }
      .pm-review-item   { padding:14px;background:#fafafa;border-radius:10px; }
      .pm-review-head   { display:flex;align-items:center;gap:10px;margin-bottom:8px; }
      .pm-review-avatar { width:36px;height:36px;border-radius:50%;object-fit:cover; }
      .pm-review-name   { font-size:13px;font-weight:700;color:#1e293b; }
      .pm-review-date   { margin-left:auto;font-size:11px;color:#94a3b8; }
      .pm-review-stars-row { display:flex;gap:1px; }
      .pm-review-text   { font-size:13px;color:#475569; }
      .pm-review-reply  { margin-top:8px;background:#f0fdf4;border-left:3px solid #16a34a;padding:8px 10px;border-radius:0 6px 6px 0;font-size:12.5px;color:#15803d; }
      .pm-star          { font-size:16px;color:#d1d5db;transition:color .1s; }
      .pm-star.filled   { color:#f59e0b; }
      .pm-star.half     { color:#f59e0b;opacity:.6; }

      /* Notifikasi styles */
      .pm-notif-item    { display:flex;gap:12px;padding:12px 16px;border-bottom:1px solid #f1f5f9;cursor:pointer;transition:background .15s; }
      .pm-notif-item:hover{ background:#f8fafc; }
      .pm-notif-item.unread{ background:#f0fdf4; }
      .pm-notif-icon    { font-size:20px;flex-shrink:0;margin-top:2px; }
      .pm-notif-title   { font-size:13px;font-weight:700;color:#1e293b;margin-bottom:2px; }
      .pm-notif-msg     { font-size:12.5px;color:#64748b; }
      .pm-notif-time    { font-size:11px;color:#94a3b8;margin-top:3px; }
      #pm-notif-badge   { display:none;position:absolute;top:-5px;right:-6px;background:#ef4444;color:#fff;font-size:10px;font-weight:800;border-radius:50%;width:18px;height:18px;align-items:center;justify-content:center; }
    `;
    document.head.appendChild(style);
  },
};

/* ── Auto inject styles ──────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => PM_TRACK.injectStyles());

/* ── Expose globally ─────────────────────────────────────── */
window.SB = SB;
window.PM_QRIS = PM_QRIS;
window.PM_UPLOAD = PM_UPLOAD;
window.PM_NOTIFY = PM_NOTIFY;
window.PM_RATING = PM_RATING;
window.PM_TRACK = PM_TRACK;
