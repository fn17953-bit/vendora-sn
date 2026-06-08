/* ============================================================
   Vendora-sn — Base de données Firebase Firestore
   ============================================================ */

const _fbApp = firebase.initializeApp({
  apiKey: "AIzaSyAUqRT2OP9_Ma789x5gvitymeLWl1-YeEs",
  authDomain: "vendora-sn.firebaseapp.com",
  projectId: "vendora-sn",
  storageBucket: "vendora-sn.firebasestorage.app",
  messagingSenderId: "157908184464",
  appId: "1:157908184464:web:6b660f3ad668aa98439715"
});
const _db = firebase.firestore();

const INITIAL_ADMIN = {
  id:'admin', email:'admin@vendora-sn.com', password:'vendora-sn2025',
  name:'Admin Vendora-sn', role:'admin', phone:'+221774954868',
  createdAt: new Date().toISOString()
};

async function _initAdmin(){
  try{
    const ref = _db.collection('users').doc('admin');
    const snap = await ref.get();
    if(!snap.exists) await ref.set(INITIAL_ADMIN);
  }catch(e){}
}
_initAdmin();

const K = { CART:'dfm_cart', CURRENT_USER:'dfm_current_user' };

const DB = (()=>{

  /* ── CACHE LOCAL ── */
  const cache = {
    products: JSON.parse(localStorage.getItem('fb_products_cache')||'[]'),
    users:    JSON.parse(localStorage.getItem('fb_users_cache')||'[]'),
    orders:   JSON.parse(localStorage.getItem('fb_orders_cache')||'[]'),
  };
  function saveCache(key){ localStorage.setItem('fb_'+key+'_cache', JSON.stringify(cache[key])); }

  /* ── LOAD FROM FIRESTORE ── */
  async function loadProducts(){
    try{
      const snap = await _db.collection('products').get();
      cache.products = snap.docs.map(d=>({...d.data(),id:d.id}));
      saveCache('products');
    }catch(e){}
    return cache.products;
  }
  async function loadUsers(){
    try{
      const snap = await _db.collection('users').get();
      cache.users = snap.docs.map(d=>({...d.data(),id:d.id}));
      saveCache('users');
    }catch(e){}
    return cache.users;
  }
  async function loadOrders(){
    try{
      const snap = await _db.collection('orders').get();
      cache.orders = snap.docs.map(d=>({...d.data(),id:d.id}));
      saveCache('orders');
    }catch(e){}
    return cache.orders;
  }

  /* ════ PRODUCTS ════ */
  function getProducts(f='approved'){
    if(f==='all') return cache.products;
    if(f==='approved') return cache.products.filter(p=>p.status==='approved');
    return cache.products.filter(p=>p.status===f);
  }
  function getAllProducts(){ return cache.products; }
  function getProduct(id){ return cache.products.find(p=>p.id===id||p.id===String(id)||p.id===parseInt(id)); }
  function getProductsBySeller(sid){ return cache.products.filter(p=>p.sellerId===sid); }
  function incrementViews(id){ const p=getProduct(id); if(p) updateProduct(id,{views:(p.views||0)+1}); }

  async function addProduct(data){
    const sellerProds = cache.products.filter(p=>p.sellerId===data.sellerId);
    const isFirstPub = sellerProds.length===0;
    const price = parseInt(data.price)||0;
    const commissionRate = CONFIG.getCommissionRate(price);
    const commissionAmount = CONFIG.getCommissionAmount(price);
    const commissionPaid = isFirstPub||commissionAmount===0;
    const product = {
      ...data, status: commissionPaid?'approved':'pending_payment',
      views:0, isFirstPub, commissionRate, commissionAmount, commissionPaid,
      negotiable:data.negotiable||false,
      boostExpiry:null,boostPlan:null,boostPaid:false,
      boostTransactionCode:'',transactionCode:'',
      createdAt:new Date().toISOString()
    };
    const ref = await _db.collection('products').add(product);
    product.id = ref.id;
    cache.products.push(product);
    saveCache('products');
    return product;
  }

  async function updateProduct(id, data){
    try{
      await _db.collection('products').doc(String(id)).update(data);
    }catch(e){}
    const i = cache.products.findIndex(p=>p.id===id||p.id===String(id));
    if(i!==-1){ cache.products[i]={...cache.products[i],...data}; saveCache('products'); return cache.products[i]; }
  }

  async function deleteProduct(id){
    try{ await _db.collection('products').doc(String(id)).delete(); }catch(e){}
    cache.products = cache.products.filter(p=>p.id!==id&&p.id!==String(id));
    saveCache('products');
  }

  /* ════ USERS ════ */
  function getUsers(){ return cache.users; }
  function getUserByEmail(email){ return cache.users.find(u=>u.email&&u.email.toLowerCase()===email.toLowerCase()); }
  function getUser(id){ return cache.users.find(u=>u.id===id); }
  function getSellers(){ return cache.users.filter(u=>u.role==='seller'); }

  async function createSeller(data){
    if(getUserByEmail(data.email)) return {error:'Un compte avec cet email existe déjà.'};
    const id = 'seller_'+Date.now();
    const seller = {...data,id,role:'seller',status:'active',rating:0,totalSales:0,createdAt:new Date().toISOString()};
    try{
      await _db.collection('users').doc(id).set(seller);
      cache.users.push(seller);
      saveCache('users');
      return seller;
    }catch(e){ return {error:'Erreur création compte. Réessayez.'}; }
  }

  async function updateUser(id, data){
    try{ await _db.collection('users').doc(String(id)).update(data); }catch(e){}
    const i = cache.users.findIndex(u=>u.id===id);
    if(i!==-1){ cache.users[i]={...cache.users[i],...data}; saveCache('users'); return cache.users[i]; }
  }

  /* ════ ORDERS ════ */
  function getOrders(){ return cache.orders; }
  function getOrdersBySeller(sid){ return cache.orders.filter(o=>o.sellerId===sid); }

  async function createOrder(data){
    const ref = 'DFM-'+Date.now().toString(36).toUpperCase().slice(-6);
    const order = {...data,ref,status:'pending',createdAt:new Date().toISOString()};
    try{
      const docRef = await _db.collection('orders').add(order);
      order.id = docRef.id;
    }catch(e){}
    cache.orders.push(order);
    saveCache('orders');
    return order;
  }

  async function updateOrder(ref, data){
    try{
      const snap = await _db.collection('orders').where('ref','==',ref).get();
      if(!snap.empty) await snap.docs[0].ref.update(data);
    }catch(e){}
    const i = cache.orders.findIndex(o=>o.ref===ref);
    if(i!==-1){ cache.orders[i]={...cache.orders[i],...data}; saveCache('orders'); return cache.orders[i]; }
  }

  /* ════ CART ════ */
  function getCart(){ return JSON.parse(localStorage.getItem(K.CART)||'[]'); }
  function saveCart(c){ localStorage.setItem(K.CART,JSON.stringify(c)); }
  function addToCart(productId){
    const cart=getCart(); const key=String(productId);
    if(cart.find(i=>i.key===key)) return {error:'Article déjà dans le panier'};
    const p=getProduct(productId); if(!p) return {error:'Article introuvable'};
    const seller=getUser(p.sellerId);
    cart.push({key,id:productId,name:p.name,price:p.price,photo:p.photos?.[0]?.url||null,
      sellerId:p.sellerId,sellerName:seller?.name||'Vendeur',
      sellerWhatsapp:seller?.whatsapp||seller?.phone||'',
      sellerPayments:seller?.paymentMethods||[],
      sellerWave:seller?.waveNumber||'',sellerOrange:seller?.orangeNumber||''
    });
    saveCart(cart); return cart;
  }
  function removeFromCart(key){ saveCart(getCart().filter(i=>i.key!==key)); return getCart(); }
  function clearCart(){ saveCart([]); }
  function getCartTotal(){ return getCart().reduce((s,i)=>s+i.price,0); }
  function getCartCount(){ return getCart().length; }

  /* ════ NOTIFICATIONS ════ */
  function getNotifications(userId){ return JSON.parse(localStorage.getItem('dfm_notifs')||'[]').filter(n=>n.userId===userId); }
  function addNotification(userId,msg,type='order'){
    const notifs=JSON.parse(localStorage.getItem('dfm_notifs')||'[]');
    notifs.push({id:Date.now(),userId,msg,type,read:false,createdAt:new Date().toISOString()});
    localStorage.setItem('dfm_notifs',JSON.stringify(notifs));
    _db.collection('notifications').add({userId,msg,type,read:false,createdAt:new Date().toISOString()}).catch(()=>{});
  }
  function markNotifRead(id){
    const notifs=JSON.parse(localStorage.getItem('dfm_notifs')||'[]');
    const i=notifs.findIndex(n=>n.id===id);
    if(i!==-1){notifs[i].read=true;localStorage.setItem('dfm_notifs',JSON.stringify(notifs));}
  }

  /* ════ REVIEWS ════ */
  function getReviews(){ return JSON.parse(localStorage.getItem('dfm_reviews')||'[]'); }
  function getReviewsByProduct(pid){ return getReviews().filter(r=>r.productId===parseInt(pid)||r.productId===pid); }
  function getReviewsBySeller(sid){ return getReviews().filter(r=>r.sellerId===sid); }
  async function addReview(data){
    const reviews=getReviews();
    if(reviews.find(r=>r.productId===data.productId&&r.buyerName===data.buyerName)) return {error:'Vous avez déjà laissé un avis.'};
    const review={id:Date.now(),...data,createdAt:new Date().toISOString()};
    reviews.push(review);
    localStorage.setItem('dfm_reviews',JSON.stringify(reviews));
    await _db.collection('reviews').add(review).catch(()=>{});
    const sellerReviews=reviews.filter(r=>r.sellerId===data.sellerId);
    const avg=sellerReviews.reduce((s,r)=>s+r.rating,0)/sellerReviews.length;
    await updateUser(data.sellerId,{rating:Math.round(avg*10)/10});
    return review;
  }

  /* ════ BOOST ════ */
  async function applyBoost(productId,plan){
    const product=getProduct(productId); if(!product) return null;
    const expiry=new Date(); expiry.setDate(expiry.getDate()+plan.days);
    return updateProduct(productId,{boostPlan:plan.id,boostExpiry:expiry.toISOString(),boostPaid:false,featured:true,status:'pending_boost'});
  }
  async function confirmBoostPaid(productId){
    return updateProduct(productId,{boostPaid:true,status:'approved',featured:true});
  }

  /* ════ AUTH ════ */
  function getCurrentUser(){ const u=localStorage.getItem(K.CURRENT_USER); return u?JSON.parse(u):null; }
  function setCurrentUser(u){ localStorage.setItem(K.CURRENT_USER,JSON.stringify(u)); }
  function logout(){ localStorage.removeItem(K.CURRENT_USER); }

  /* ════ INIT ════ */
  Promise.all([loadUsers(),loadProducts(),loadOrders()]);

  return {
    getProducts,getAllProducts,getProduct,addProduct,updateProduct,deleteProduct,
    getProductsBySeller,incrementViews,loadProducts,
    getUsers,getUserByEmail,getUser,getSellers,createSeller,updateUser,loadUsers,
    getOrders,createOrder,updateOrder,getOrdersBySeller,loadOrders,
    getCart,addToCart,removeFromCart,clearCart,getCartTotal,getCartCount,
    getNotifications,addNotification,markNotifRead,
    getReviews,getReviewsByProduct,getReviewsBySeller,addReview,
    applyBoost,confirmBoostPaid,
    getCurrentUser,setCurrentUser,logout
  };
})();
