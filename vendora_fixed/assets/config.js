/* ============================================================
   Vendora-sn MARKETPLACE v2 — Configuration
   ============================================================ */
const CONFIG = {
  SHOP_NAME:          'Vendora-sn',
  SHOP_WHATSAPP:      '221774954868',
  SHOP_PHONE:         '+221 77 495 48 68',
  ADMIN_EMAIL:        'darkflowdkr@gmail.com',
  ADMIN_WHATSAPP:     '221774954868',
  EMAILJS_PUBLIC_KEY: '2xMDK4TqYQxfEHcks',
  EMAILJS_SERVICE_ID: 'service_tyaugdr',
  EMAILJS_TEMPLATE_ID:'template_bs6r24v',
  WAVE_URL:           'https://pay.wave.com/m/M_sn_LU6LK5p54bCQ/c/sn/',
  OM_NUMBER:          '+221 77 495 48 68',

  COMMISSION_PERCENT: 2.5,
  COMMISSION_TIERS: [
    {max:3000,     rate:0,   label:'0%'},
    {max:5000,     rate:1,   label:'1%'},
    {max:15000,    rate:1.5, label:'1.5%'},
    {max:30000,    rate:2,   label:'2%'},
    {max:Infinity, rate:2.5, label:'2.5%'},
  ],

  BOOST_PLANS: [
    {id:'boost_7',  days:7,  price:500,  label:'7 jours',  badge:'🔥 BOOST'},
    {id:'boost_14', days:14, price:800,  label:'14 jours', badge:'⚡ TOP'},
    {id:'boost_30', days:30, price:1500,  label:'30 jours', badge:'🚀 VEDETTE'},
  ],

  FIRST_PUBLICATION_FREE: true,

  getCommissionRate(price){
    for(const t of this.COMMISSION_TIERS) if(price<=t.max) return t.rate;
    return 2.5;
  },
  getCommissionAmount(price){
    return Math.round(price * this.getCommissionRate(price) / 100);
  },
  isFirstPublication(sellerId){
    const all=JSON.parse(localStorage.getItem('dfm_products')||'[]');
    return all.filter(p=>p.sellerId===sellerId).length===0;
  },
  isBoostActive(product){
    if(!product?.boostExpiry) return false;
    return new Date(product.boostExpiry) > new Date();
  },
  getBoostDaysLeft(product){
    if(!product?.boostExpiry) return 0;
    const diff=new Date(product.boostExpiry)-new Date();
    return Math.max(0,Math.ceil(diff/(1000*60*60*24)));
  }
};
