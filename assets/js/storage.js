/* ================================================================
   PURBALINGGA MART — storage.js
   Central localStorage database engine
   ================================================================ */
'use strict';

(function () {

  /* ── Keys ──────────────────────────────────────────────────── */
  const KEYS = {
    PRODUCTS:     'pm_products',
    CART:         'pm_cart',
    TRANSACTIONS: 'pm_transactions',
    INIT:         'pm_db_initialized',
    NOTIFY:       'pm_notify_ts',   // cross-tab sync timestamp
  };

  /* ── Seed product data ────────────────────────────────────── */
  const SEED_PRODUCTS = [
    {
      id: 'p1', sellerId: 's1', sellerUsername: 'seller1',
      storeName: 'Toko Berkah', storeId: 's1',
      name: 'Nopia Asli Pak Slamet',
      category: 'makanan', location: 'Purbalingga Kota',
      price: 15000, originalPrice: 20000,
      stock: 15, sold: 234, rating: 4.8, ratingCount: 58,
      badge: 'BEST SELLER', promo: true, perishable: false,
      description: 'Nopia asli khas Purbalingga buatan turun-temurun. Tekstur renyah, isian manis gurih autentik. Cocok untuk oleh-oleh keluarga dan teman.',
      image: 'https://visitjawatengah.jatengprov.go.id/assets/images/c55b5229-9b76-4248-b4dd-07eb530d03b5.jpg',
      status: 'active',
      createdAt: new Date(Date.now() - 30*24*60*60*1000).toISOString(),
    },
    {
      id: 'p2', sellerId: 's2', sellerUsername: 'seller2',
      storeName: 'Warung Bu Siti', storeId: 's2',
      name: 'Tempe Mendoan Gurih',
      category: 'makanan', location: 'Bojongsari',
      price: 5000, originalPrice: 5000,
      stock: 50, sold: 512, rating: 4.7, ratingCount: 120,
      badge: 'TRENDING', promo: false, perishable: true,
      description: 'Tempe mendoan lembut dengan balutan tepung bumbu gurih khas Purbalingga. Cocok camilan atau lauk.',
      image: 'https://img-global.cpcdn.com/recipes/8b9b73c8e20e5239/680x781f0.5_0.5_1.0q80/tempe-mendoan-basah-devina-hermawan-foto-resep-utama.jpg',
      status: 'active',
      createdAt: new Date(Date.now() - 28*24*60*60*1000).toISOString(),
    },
    {
      id: 'p3', sellerId: 's2', sellerUsername: 'seller2',
      storeName: 'Warung Bu Siti', storeId: 's2',
      name: 'Soto Bancar Khas',
      category: 'makanan', location: 'Kertanegara',
      price: 20000, originalPrice: 25000,
      stock: 30, sold: 189, rating: 4.9, ratingCount: 45,
      badge: 'PROMO', promo: true, perishable: true,
      description: 'Soto Bancar kuah bening segar dengan mi soun, potongan daging, dan taoge pilihan.',
      image: 'https://radarbanyumas.disway.id/upload/aaceee7f24fef06f4ed186b2aa63b0ca.jpg',
      status: 'active',
      createdAt: new Date(Date.now() - 25*24*60*60*1000).toISOString(),
    },
    {
      id: 'p4', sellerId: 's1', sellerUsername: 'seller1',
      storeName: 'Toko Berkah', storeId: 's1',
      name: 'Gula Kelapa Organik',
      category: 'pertanian', location: 'Bukateja',
      price: 25000, originalPrice: 32000,
      stock: 40, sold: 98, rating: 4.6, ratingCount: 30,
      badge: 'PROMO', promo: true, perishable: false,
      description: 'Gula kelapa murni organik tanpa pengawet, aroma karamel alami cocok untuk memasak & baking.',
      image: 'https://id-test-11.slatic.net/p/7a4ddf2d5db40593517ad73ac9cb9267.jpg',
      status: 'active',
      createdAt: new Date(Date.now() - 20*24*60*60*1000).toISOString(),
    },
    {
      id: 'p5', sellerId: 's1', sellerUsername: 'seller1',
      storeName: 'Toko Berkah', storeId: 's1',
      name: 'Kripik Tempe Sagu',
      category: 'makanan', location: 'Mrebet',
      price: 12000, originalPrice: 12000,
      stock: 60, sold: 321, rating: 4.5, ratingCount: 78,
      badge: 'BEST SELLER', promo: false, perishable: false,
      description: 'Kripik tempe sagu renyah dengan bumbu krispy khas Purbalingga. Cocok sebagai oleh-oleh keluarga.',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmu70WiQv5I2neXmIkw_Oy32dOW-493Iy9HCdu1bR_z0IkUH8oilzkZZY&s=10',
      status: 'active',
      createdAt: new Date(Date.now() - 18*24*60*60*1000).toISOString(),
    },
    {
      id: 'p6', sellerId: 's2', sellerUsername: 'seller2',
      storeName: 'Warung Bu Siti', storeId: 's2',
      name: 'Batik Tulis Purbalingga',
      category: 'kerajinan', location: 'Purbalingga Kota',
      price: 185000, originalPrice: 220000,
      stock: 20, sold: 45, rating: 4.8, ratingCount: 18,
      badge: 'PROMO', promo: true, perishable: false,
      description: 'Batik tulis asli motif khas Banyumas, buatan pengrajin lokal berpengalaman lebih dari 20 tahun.',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUPK_Ct4yCRqZPffVOicLJWpL4-Ql1GUDYMgu0ESMvYZPSNyHFRGoiQNw&s=10',
      status: 'active',
      createdAt: new Date(Date.now() - 15*24*60*60*1000).toISOString(),
    },
    {
      id: 'p7', sellerId: 's1', sellerUsername: 'seller1',
      storeName: 'Toko Berkah', storeId: 's1',
      name: 'Bulu Mata Palsu Premium',
      category: 'fashion', location: 'Mrebet',
      price: 35000, originalPrice: 50000,
      stock: 200, sold: 876, rating: 4.9, ratingCount: 200,
      badge: 'BEST SELLER', promo: true, perishable: false,
      description: 'Bulu mata palsu premium buatan Purbalingga — sentra bulu mata terbesar Indonesia. Alami & tahan lama.',
      image: 'https://down-id.img.susercontent.com/file/id-11134207-7r98p-lqaexlqvlhfj98',
      status: 'active',
      createdAt: new Date(Date.now() - 12*24*60*60*1000).toISOString(),
    },
    {
      id: 'p8', sellerId: 's2', sellerUsername: 'seller2',
      storeName: 'Warung Bu Siti', storeId: 's2',
      name: 'Kopi Robusta Purbalingga',
      category: 'minuman', location: 'Kertanegara',
      price: 45000, originalPrice: 45000,
      stock: 35, sold: 167, rating: 4.7, ratingCount: 42,
      badge: 'BARU', promo: false, perishable: false,
      description: 'Kopi robusta pilihan lereng Slamet, petik manual, diproses natural. Aroma kuat, rasa bold.',
      image: 'https://vibiznews.com/wp-content/uploads/2022/07/coffe2022.jpg',
      status: 'active',
      createdAt: new Date(Date.now() - 8*24*60*60*1000).toISOString(),
    },
    {
      id: 'p9', sellerId: 's1', sellerUsername: 'seller1',
      storeName: 'Toko Berkah', storeId: 's1',
      name: 'Sambal Bawang Khas',
      category: 'makanan', location: 'Bukateja',
      price: 18000, originalPrice: 22000,
      stock: 8, sold: 243, rating: 4.6, ratingCount: 62,
      badge: 'PROMO', promo: true, perishable: false,
      description: 'Sambal bawang buatan tangan dengan bawang merah pilihan, cabai segar, dan bumbu rahasia.',
      image: 'https://storage.googleapis.com/bakingworld-web-production/uploads/media/content_banner/shutterstock_1977900539-1693325844536.jpg',
      status: 'active',
      createdAt: new Date(Date.now() - 5*24*60*60*1000).toISOString(),
    },
    {
      id: 'p10', sellerId: 's2', sellerUsername: 'seller2',
      storeName: 'Warung Bu Siti', storeId: 's2',
      name: 'Anyaman Tampah Bambu Premium',
      category: 'kerajinan', location: 'Bojongsari',
      price: 75000, originalPrice: 90000,
      stock: 18, sold: 67, rating: 4.5, ratingCount: 22,
      badge: 'BARU', promo: false, perishable: false,
      description: 'Anyaman bambu premium handmade khas Purbalingga. Tersedia tas, tempat buah, dan dekorasi rumah.',
      image: 'https://142999418.cdn6.editmysite.com/uploads/1/4/2/9/142999418/s907327392208814572_p1_i2_w700.jpeg',
      status: 'active',
      createdAt: new Date(Date.now() - 3*24*60*60*1000).toISOString(),
    },
    {
      id: 'p11', sellerId: 's1', sellerUsername: 'seller1',
      storeName: 'Toko Berkah', storeId: 's1',
      name: 'Getuk Goreng Sokaraja',
      category: 'makanan', location: 'Purbalingga Kota',
      price: 8000, originalPrice: 10000,
      stock: 45, sold: 410, rating: 4.6, ratingCount: 95,
      badge: 'TRENDING', promo: true, perishable: true,
      description: 'Getuk goreng khas Sokaraja, renyah di luar lembut di dalam dengan gula jawa yang legit.',
      image: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Getuk_goreng_Sokaraja.jpg',
      status: 'active',
      createdAt: new Date(Date.now() - 2*24*60*60*1000).toISOString(),
    },
    {
      id: 'p12', sellerId: 's2', sellerUsername: 'seller2',
      storeName: 'Warung Bu Siti', storeId: 's2',
      name: 'Tas Anyam Rotan',
      category: 'kerajinan', location: 'Karangreja',
      price: 120000, originalPrice: 150000,
      stock: 12, sold: 34, rating: 4.7, ratingCount: 11,
      badge: 'PROMO', promo: true, perishable: false,
      description: 'Tas anyaman rotan premium buatan perajin lokal Purbalingga. Cocok untuk daily use maupun hadiah.',
      image: 'https://down-id.img.susercontent.com/file/8ff071f4f1d77fd8fdaa17a90a38de0e',
      status: 'active',
      createdAt: new Date(Date.now() - 1*24*60*60*1000).toISOString(),
    },
  ];


  /* ── Seed transaction data ─────────────────────────────── */
  const SEED_TRANSACTIONS = [
    {
      transactionId: 'TRX-1704000001-DEMO',
      buyerId: 4, buyerName: 'Ahmad Fauzi', buyerEmail: 'ahmad@gmail.com',  // [FIX] 'u3' -> 4, nama disesuaikan SEED_USERS
      products: [
        { productId:'p1', name:'Nopia Asli Pak Slamet', price:15000, qty:2, image:'https://picsum.photos/seed/nopia/400/300', storeName:'Toko Berkah', sellerUsername:'seller1', location:'Purbalingga Kota', subtotal:30000 },
        { productId:'p5', name:'Kripik Tempe Sagu', price:12000, qty:3, image:'https://picsum.photos/seed/kripiktempe/400/300', storeName:'Toko Berkah', sellerUsername:'seller1', location:'Mrebet', subtotal:36000 },
      ],
      subtotal: 66000, shipping: 5000, shippingOriginal: 5000, discount: 0, serviceFee: 660,
      total: 71660, paymentMethod: 'cod',
      address: { name:'Ahmad Buyer', phone:'081234567890', province:'Jawa Tengah', city:'Purbalingga Kota', district:'Purbalingga', postalCode:'53311', detail:'Jl. Mawar No. 5 RT 02/03' },
      voucher: null, voucherLabel: null,
      status: 'diproses',
      statusHistory: [
        { status:'pending',  time: new Date(Date.now()-2*86400000).toISOString(), note:'Pesanan dibuat' },
        { status:'diproses', time: new Date(Date.now()-1*86400000).toISOString(), note:'Seller mengkonfirmasi pesanan' },
      ],
      createdAt: new Date(Date.now()-2*86400000).toISOString(),
      updatedAt: new Date(Date.now()-1*86400000).toISOString(),
    },
    {
      transactionId: 'TRX-1704000002-DEMO',
      buyerId: 4, buyerName: 'Ahmad Fauzi', buyerEmail: 'ahmad@gmail.com',  // [FIX] 'u3' -> 4
      products: [
        { productId:'p7', name:'Bulu Mata Palsu Premium', price:35000, qty:2, image:'https://picsum.photos/seed/bulumata/400/300', storeName:'Toko Berkah', sellerUsername:'seller1', location:'Mrebet', subtotal:70000 },
      ],
      subtotal: 70000, shipping: 5000, shippingOriginal: 5000, discount: 7000, serviceFee: 700,
      total: 68700, paymentMethod: 'transfer',
      address: { name:'Ahmad Buyer', phone:'081234567890', province:'Jawa Tengah', city:'Purbalingga Kota', district:'Purbalingga', postalCode:'53311', detail:'Jl. Melati No. 12 RT 01/02' },
      voucher: 'HEMAT10', voucherLabel: 'Diskon 10%',
      status: 'selesai',
      statusHistory: [
        { status:'pending',  time: new Date(Date.now()-5*86400000).toISOString(), note:'Pesanan dibuat' },
        { status:'diproses', time: new Date(Date.now()-4*86400000).toISOString(), note:'Seller mengkonfirmasi' },
        { status:'dikirim',  time: new Date(Date.now()-3*86400000).toISOString(), note:'Pesanan dikirim via kurir' },
        { status:'selesai',  time: new Date(Date.now()-1*86400000).toISOString(), note:'Pesanan diterima pembeli' },
      ],
      createdAt: new Date(Date.now()-5*86400000).toISOString(),
      updatedAt: new Date(Date.now()-1*86400000).toISOString(),
    },
  ];

  /* ================================================================
     PM_DB — Database engine
     ================================================================ */
  const PM_DB = {

    /* ── Init ────────────────────────────────────────────────── */
    init() {
      // [FIX] Gunakan versioning agar perubahan seed data diterapkan saat versi berubah
      const DB_VERSION = '3'; // Naikkan versi ini setiap kali seed data berubah
      const storedVersion = localStorage.getItem(KEYS.INIT);
      if (storedVersion !== DB_VERSION) {
        this.saveProducts(SEED_PRODUCTS);
        this.saveCart([]);
        this.saveTransactions(SEED_TRANSACTIONS);
        localStorage.setItem(KEYS.INIT, DB_VERSION);
      }
    },

    /* ── Notify (cross-tab) ──────────────────────────────────── */
    _notify() {
      localStorage.setItem(KEYS.NOTIFY, Date.now().toString());
    },

    /* ================================================================
       PRODUCTS
       ================================================================ */
    getProducts() {
      try {
        return JSON.parse(localStorage.getItem(KEYS.PRODUCTS) || '[]');
      } catch { return []; }
    },

    saveProducts(products) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
      this._notify();
    },

    getActiveProducts() {
      return this.getProducts().filter(p => p.status === 'active');
    },

    getProductById(id) {
      return this.getProducts().find(p => p.id === id) || null;
    },

    getProductsBySeller(sellerId) {
      return this.getProducts().filter(p => p.sellerId === sellerId || p.sellerUsername === sellerId);
    },

    addProduct(product) {
      const products = this.getProducts();
      const newP = {
        ...product,
        id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        sold: 0,
        rating: 0,
        ratingCount: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      products.push(newP);
      this.saveProducts(products);
      return newP;
    },

    updateProduct(id, updates) {
      const products = this.getProducts();
      const idx = products.findIndex(p => p.id === id);
      if (idx === -1) return null;
      products[idx] = { ...products[idx], ...updates, updatedAt: new Date().toISOString() };
      this.saveProducts(products);
      return products[idx];
    },

    deleteProduct(id) {
      const products = this.getProducts().filter(p => p.id !== id);
      this.saveProducts(products);
      this._notify();
    },

    suspendProduct(id) {
      return this.updateProduct(id, { status: 'suspended' });
    },

    activateProduct(id) {
      return this.updateProduct(id, { status: 'active' });
    },

    /* ── Product sections ────────────────────────────────────── */
    getLatest(limit = 8) {
      return this.getActiveProducts()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
    },

    getBestSellers(limit = 8) {
      return this.getActiveProducts()
        .sort((a, b) => b.sold - a.sold)
        .slice(0, limit);
    },

    getPromo(limit = 8) {
      return this.getActiveProducts()
        .filter(p => p.promo)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, limit);
    },

    getTrending(limit = 8) {
      return this.getActiveProducts()
        .sort((a, b) => b.rating - a.rating)
        .slice(0, limit);
    },

    /* ── Search & filter ─────────────────────────────────────── */
    search(query, filters = {}) {
      let products = this.getActiveProducts();
      const q = query.toLowerCase().trim();

      if (q) {
        products = products.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.storeName.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
        );
      }

      if (filters.category && filters.category !== 'semua') {
        products = products.filter(p => p.category === filters.category);
      }
      if (filters.location && filters.location !== 'semua') {
        products = products.filter(p => p.location === filters.location);
      }
      if (filters.minPrice) {
        products = products.filter(p => p.price >= Number(filters.minPrice));
      }
      if (filters.maxPrice) {
        products = products.filter(p => p.price <= Number(filters.maxPrice));
      }
      if (filters.minRating) {
        products = products.filter(p => p.rating >= Number(filters.minRating));
      }
      if (filters.promo) {
        products = products.filter(p => p.promo);
      }
      if (filters.inStock) {
        products = products.filter(p => p.stock > 0);
      }

      // Sort
      switch (filters.sort) {
        case 'newest':   products.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
        case 'oldest':   products.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
        case 'price_lo': products.sort((a,b) => a.price - b.price); break;
        case 'price_hi': products.sort((a,b) => b.price - a.price); break;
        case 'rating':   products.sort((a,b) => b.rating - a.rating); break;
        case 'sold':     products.sort((a,b) => b.sold - a.sold); break;
        default:         products.sort((a,b) => b.sold - a.sold); break;
      }

      return products;
    },

    /* ── Stats ───────────────────────────────────────────────── */
    getStats() {
      const all = this.getProducts();
      const active = all.filter(p => p.status === 'active');
      const sellers = [...new Set(all.map(p => p.sellerId))].length;
      const categories = [...new Set(active.map(p => p.category))].length;
      const locations = [...new Set(active.map(p => p.location))].length;
      return { total: all.length, active: active.length, sellers, categories, locations };
    },

    /* ================================================================
       CART
       ================================================================ */
    getCart() {
      try {
        return JSON.parse(localStorage.getItem(KEYS.CART) || '[]');
      } catch { return []; }
    },

    saveCart(cart) {
      localStorage.setItem(KEYS.CART, JSON.stringify(cart));
      this._notify();
    },

    addToCart(productId, qty = 1) {
      const product = this.getProductById(productId);
      if (!product) return { ok: false, msg: 'Produk tidak ditemukan.' };
      if (product.stock < qty) return { ok: false, msg: 'Stok tidak mencukupi.' };

      const cart = this.getCart();
      const existing = cart.find(item => item.productId === productId);
      if (existing) {
        if (existing.qty + qty > product.stock) return { ok: false, msg: 'Melebihi stok tersedia.' };
        existing.qty += qty;
      } else {
        cart.push({
          id: 'ci_' + Date.now(),
          productId,
          name: product.name,
          price: product.price,
          image: product.image,
          storeName: product.storeName,
          qty,
          addedAt: new Date().toISOString(),
        });
      }
      this.saveCart(cart);
      return { ok: true, cart };
    },

    removeFromCart(productId) {
      this.saveCart(this.getCart().filter(i => i.productId !== productId));
    },

    updateCartQty(productId, qty) {
      const cart = this.getCart();
      const item = cart.find(i => i.productId === productId);
      if (item) {
        if (qty <= 0) return this.removeFromCart(productId);
        item.qty = qty;
        this.saveCart(cart);
      }
    },

    clearCart() { this.saveCart([]); },

    getCartTotal() {
      return this.getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
    },

    getCartCount() {
      return this.getCart().reduce((sum, i) => sum + i.qty, 0);
    },

    /* ================================================================
       TRANSACTIONS
       ================================================================ */
    getTransactions() {
      try {
        return JSON.parse(localStorage.getItem(KEYS.TRANSACTIONS) || '[]');
      } catch { return []; }
    },

    saveTransactions(txns) {
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(txns));
    },
  };

  window.PM_DB = PM_DB;
  PM_DB.init();

})();
