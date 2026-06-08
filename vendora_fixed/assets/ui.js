/* ── THEME ── */
function initTheme(){
  const saved=localStorage.getItem('dfm_theme')||'dark';
  document.documentElement.setAttribute('data-theme',saved);
  document.querySelectorAll('.theme-toggle').forEach(b=>{b.textContent=saved==='dark'?'☀️':'🌙';});
}
function toggleTheme(){
  const current=document.documentElement.getAttribute('data-theme')||'dark';
  const next=current==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',next);
  localStorage.setItem('dfm_theme',next);
  document.querySelectorAll('.theme-toggle').forEach(b=>{b.textContent=next==='dark'?'☀️':'🌙';});
}

/* ============================================================
   Vendora-sn MARKETPLACE — UI partagé
   ============================================================ */
function formatPrice(p){return parseInt(p).toLocaleString('fr-FR')+' FCFA';}
function truncate(s,n){return s&&s.length>n?s.slice(0,n)+'…':s;}
function escHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function timeAgo(dateStr){
  const diff=(Date.now()-new Date(dateStr))/1000;
  if(diff<60)return 'À l\'instant';
  if(diff<3600)return Math.floor(diff/60)+'min';
  if(diff<86400)return Math.floor(diff/3600)+'h';
  if(diff<604800)return Math.floor(diff/86400)+'j';
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

function showToast(msg,type='success'){
  const tc=document.getElementById('toast-container');if(!tc)return;
  const t=document.createElement('div');t.className=`toast toast-${type}`;t.innerHTML=`<span>${msg}</span>`;
  tc.appendChild(t);requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),400);},3200);
}

function conditionClass(c){
  const m={'Neuf':'cond-new','Quasi neuf':'cond-like-new','Très bon état':'cond-like-new','Bon état':'cond-good','État correct':'cond-fair'};
  return m[c]||'cond-good';
}

/* ── Product Card ── */
function productCard(p){
  const photo=p.photos?.[0]?.url||null;
  const seller=DB.getUser(p.sellerId);
  const initials=seller?.name?seller.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2):'?';
  const isSold=p.status==='sold';
  const base=window.location.pathname.includes('/vendor/')||window.location.pathname.includes('/admin/')?'../':'';
  return `<div class="prod-card" onclick="${isSold?'':` window.location='${base}produit.html?id=${p.id}'`}">
    <div class="prod-card-img">
      ${photo
        ?`<img src="${photo}" alt="${escHtml(p.name)}" loading="lazy" onerror="this.parentNode.innerHTML='<div class=no-photo><div class=no-photo-icon>📦</div></div>'">`
        :`<div class="no-photo"><div class="no-photo-icon">📦</div></div>`}
      ${p.condition?`<span class="prod-condition ${conditionClass(p.condition)}">${p.condition}</span>`:''}
      ${CONFIG.isBoostActive(p)?`<span class="prod-badge-boost">⚡ BOOSTÉ</span>`:''}
      ${isSold?`<div class="prod-sold-overlay"><span>VENDU</span></div>`:''}
    </div>
    <div class="prod-card-body">
      <div class="prod-seller">
        <div class="prod-seller-avatar">${initials}</div>
        <span class="prod-seller-name">${seller?.name||'Vendeur'}${seller?.verified?'<span class="badge-verified" title="Vendeur vérifié">✓</span>':''}${seller?.rating>0?`<span style="font-size:.58rem;color:var(--gold);margin-left:.3rem">★${seller.rating}</span>`:''}</span>
      </div>
      <p class="prod-cat">${escHtml(p.category)}${p.subcategory?' · '+p.subcategory:''}</p>
      <h3 class="prod-name">${escHtml(p.name)}</h3>
      <p class="prod-desc-short">${escHtml(truncate(p.description,65))}</p>
      <div class="prod-footer">
        <div class="prod-price-block">
          <p class="prod-price">${formatPrice(p.price)}</p>
          ${p.negotiable&&!isSold?`<span class="prod-badge-neg">🏷️ Négociable</span>`:''}
        </div>
        ${!isSold?`<div class="prod-actions">
          ${p.negotiable?`<button class="prod-offer-btn" onclick="event.stopPropagation();openOfferModal(${p.id})" title="Faire une offre">💬</button>`:''}
          <button class="prod-add-btn" onclick="event.stopPropagation();addToCartUI(${p.id})">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Panier
          </button>
        </div>`:''}
      </div>
    </div>
  </div>`;
}

/* ── OFFER / NEGOTIATE MODAL ── */
function openOfferModal(productId){
  const p=DB.getProduct(productId);if(!p)return;
  const seller=DB.getUser(p.sellerId)||{name:'Vendeur',whatsapp:'',phone:''};
  const sellerNum=(seller.whatsapp||seller.phone||'').replace(/\D/g,'');
  document.getElementById('offerModalInner')?.remove();
  const modal=document.createElement('div');
  modal.id='offerModalInner';
  modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:400;display:flex;align-items:flex-end;justify-content:center;padding:1rem';
  modal.innerHTML=`
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px 12px 0 0;max-width:480px;width:100%;padding:2rem;box-shadow:var(--shadow2)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.25rem">
        <div>
          <p style="font-size:.6rem;letter-spacing:.22em;text-transform:uppercase;color:var(--red);margin-bottom:.22rem;font-family:var(--fs)">Faire une offre</p>
          <h3 style="font-family:var(--fs);font-size:1.15rem;font-weight:700;color:var(--text)">${p.name}</h3>
          <p style="font-family:var(--fd);font-size:1.35rem;color:var(--red);letter-spacing:.04em">${formatPrice(p.price)}</p>
        </div>
        <button onclick="document.getElementById('offerModalInner').remove()" style="background:none;border:none;color:var(--text3);font-size:1.2rem;cursor:pointer">✕</button>
      </div>
      <div style="margin-bottom:1.1rem">
        <label style="font-size:.58rem;letter-spacing:.22em;text-transform:uppercase;color:var(--text3);display:block;margin-bottom:.45rem;font-family:var(--fs)">Ton prix proposé (FCFA)</label>
        <input type="number" id="offerPrice" class="form-input" placeholder="ex: 12000" min="0" style="font-size:1.1rem">
      </div>
      <div style="margin-bottom:1.35rem">
        <label style="font-size:.58rem;letter-spacing:.22em;text-transform:uppercase;color:var(--text3);display:block;margin-bottom:.45rem;font-family:var(--fs)">Message (optionnel)</label>
        <textarea id="offerMsg" class="form-input" rows="2" placeholder="Pourquoi ce prix ? Présente-toi..."></textarea>
      </div>
      <a id="offerWaBtn" href="#" target="_blank" class="btn-green" style="width:100%;text-align:center;justify-content:center;display:flex;gap:.5rem;padding:1rem;font-size:.72rem">
        📲 Envoyer l'offre via WhatsApp
      </a>
      <p style="font-size:.7rem;color:var(--text3);text-align:center;margin-top:.75rem;line-height:1.6">L'offre sera envoyée directement au vendeur sur WhatsApp. C'est lui qui décide d'accepter ou non.</p>
    </div>`;
  modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
  document.body.appendChild(modal);
  function updateWaLink(){
    const price=document.getElementById('offerPrice').value;
    const msg=document.getElementById('offerMsg').value;
    const text='Bonjour '+seller.name+', je suis intéressé(e) par votre article "'+p.name+'" affiché à '+formatPrice(p.price)+'.'+(price?' Je vous propose '+formatPrice(parseInt(price))+'.':'')+(msg?' '+msg:'');
    const btn=document.getElementById('offerWaBtn');
    if(btn){
      btn.href=sellerNum?'https://wa.me/'+sellerNum+'?text='+encodeURIComponent(text):'#';
      btn.style.opacity=sellerNum?'1':'.5';
    }
  }
  document.getElementById('offerPrice')?.addEventListener('input',updateWaLink);
  document.getElementById('offerMsg')?.addEventListener('input',updateWaLink);
  updateWaLink();
}

function addToCartUI(id){
  const r=DB.addToCart(id);
  if(r?.error){showToast(r.error,'error');return;}
  updateCartBadge();
  showToast('Article ajouté au panier ✓','success');
  /* Animation sac -> panier (définie dans animations.js) */
  if(typeof playAddToCartAnimation==='function'){
    const btn=window._lastCartBtn||null;
    window._lastCartBtn=null;
    playAddToCartAnimation(btn);
  }
}

function updateCartBadge(){
  const c=DB.getCartCount();
  document.querySelectorAll('.cart-badge').forEach(el=>{el.textContent=c;el.style.display=c>0?'flex':'none';});
}

/* ── CLOUDINARY UPLOAD UNIVERSEL ── */
async function uploadToCloudinary(file){
  /* Envoi direct en FormData + blob — compatible Safari iOS (pas de FileReader/base64) */
  const fd=new FormData();
  fd.append('file',file);
  fd.append('upload_preset','vendora_upload');
  const res=await fetch('https://api.cloudinary.com/v1_1/drnedgivi/image/upload',{method:'POST',body:fd});
  const data=await res.json();
  if(data.error)throw new Error(data.error.message);
  return data.secure_url;
}

/* ── PHOTO UPLOAD WIDGET — approche AutoSmart, compatible iPhone/Safari iOS ──
   Principe : les <input type="file"> sont créés une seule fois via createElement
   et restent dans le DOM (hors écran). L'aperçu utilise URL.createObjectURL()
   (instantané, supporte HEIC). L'upload Cloudinary n'a lieu qu'au clic "Publier".
   font-size:16px sur l'input évite le zoom automatique de Safari. ── */
function createPhotoWidget(containerId,photos,photoTabs,onUpdate){

  /* Fichiers en attente d'upload : {file, preview} ou {url} si déjà uploadé */
  if(!createPhotoWidget._pending)createPhotoWidget._pending={};
  const _pending=createPhotoWidget._pending[containerId]=createPhotoWidget._pending[containerId]||[];

  /* Crée les <input file> hors écran une seule fois — ils survivent aux re-renders */
  function ensureInputs(){
    photos.forEach((_,i)=>{
      const id=`${containerId}_file${i}`;
      if(document.getElementById(id))return;
      const inp=document.createElement('input');
      inp.type='file';
      inp.id=id;
      inp.accept='image/*,image/heic,image/heif';
      /* font-size:16px : empêche Safari iOS de zoomer la page à l'ouverture */
      inp.style.cssText='position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;font-size:16px;';
      inp.addEventListener('change',()=>handleFileChange(i,inp));
      document.body.appendChild(inp);
    });
  }

  /* Appelé quand l'utilisateur choisit un fichier */
  function handleFileChange(i,inp){
    const file=inp.files&&inp.files[0];
    if(!file)return;
    /* Vérification type : image/* + HEIC/HEIF par extension */
    const ok=file.type.startsWith('image/')||/\.(heic|heif|jpg|jpeg|png|gif|webp)$/i.test(file.name);
    if(!ok){showToast('Fichier non supporté','error');inp.value='';return;}
    if(file.size>10*1024*1024){showToast('Image trop lourde. Max 10Mo','error');inp.value='';return;}
    /* Aperçu instantané via createObjectURL — pas de FileReader, supporte HEIC */
    const preview=URL.createObjectURL(file);
    _pending[i]={file,preview};
    photos[i]={url:preview,label:photos[i].label};
    inp.value='';
    render();
    showToast('Photo prête ✓ — appuie sur Publier','success');
  }

  function render(){
    const container=document.getElementById(containerId);if(!container)return;
    container.innerHTML=photos.map((ph,i)=>`
      <div>
        <div class="photo-tab-btns">
          <button class="photo-tab-btn${photoTabs[i]==='upload'?' active':''}" onclick="ptSwitch_${containerId}(${i},'upload')">📁 Upload</button>
          <button class="photo-tab-btn${photoTabs[i]==='url'?' active':''}" onclick="ptSwitch_${containerId}(${i},'url')">🔗 Lien URL</button>
        </div>
        <div class="photo-slot${ph.url?' has-photo':''}" id="${containerId}_slot${i}"
             style="position:relative;overflow:hidden;cursor:${photoTabs[i]==='url'?'default':'pointer'};"
             ${photoTabs[i]==='upload'&&!ph.url?`onclick="ptTrigger_${containerId}(${i})"`:''}>
          ${ph.url?`<img src="${ph.url}" alt="${ph.label}" style="pointer-events:none;width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">`:'' }
          ${!ph.url?`<div class="photo-slot-icon" style="pointer-events:none">📷</div>`:''}
          <div class="photo-slot-label" style="pointer-events:none">${ph.label}${i===0?' *':''}</div>
          ${ph.url?`<button class="photo-remove" style="position:absolute;top:4px;right:4px;z-index:30" onclick="ptClear_${containerId}(event,${i})">✕</button>`:''}
        </div>
        ${photoTabs[i]==='url'
          ?`<input type="text" class="photo-url-input" placeholder="https://... ou GIF" value="${ph.url&&!ph.url.startsWith('blob:')?ph.url:''}" oninput="ptSetUrl_${containerId}(${i},this.value)" onblur="ptPreview_${containerId}(${i},this.value)">`
          :ph.url
            ?`<button onclick="ptTrigger_${containerId}(${i})" style="display:block;width:100%;margin-top:.4rem;padding:.45rem;font-size:.65rem;letter-spacing:.15em;font-family:var(--font-sub);background:transparent;border:1px solid var(--border-n);color:var(--muted);border-radius:3px;cursor:pointer;">🔄 CHANGER LA PHOTO</button>`
            :`<button onclick="ptTrigger_${containerId}(${i})" style="display:block;width:100%;margin-top:.4rem;padding:.55rem;font-size:.68rem;letter-spacing:.15em;font-family:var(--font-sub);background:var(--accent,var(--red));color:#fff;border:none;border-radius:3px;cursor:pointer;">📷 CHOISIR UNE PHOTO</button>
               <p style="font-size:.6rem;color:var(--muted);text-align:center;margin-top:.3rem;font-family:var(--font-sub)">JPG · PNG · GIF · HEIC · Max 10Mo</p>`
        }
      </div>`).join('');
    ensureInputs();
    if(onUpdate)onUpdate(photos);
  }

  /* Déclenche l'input caché — clic JS direct, fonctionne dans Safari iOS */
  window[`ptTrigger_${containerId}`]=(i)=>{
    const inp=document.getElementById(`${containerId}_file${i}`);
    if(inp){inp.value='';inp.click();}
  };
  window[`ptSwitch_${containerId}`]=(i,tab)=>{photoTabs[i]=tab;render();};
  window[`ptSetUrl_${containerId}`]=(i,val)=>{_pending[i]=null;photos[i]={url:val.trim(),label:photos[i].label};};
  window[`ptPreview_${containerId}`]=(i,val)=>{if(val.trim()){_pending[i]=null;photos[i]={url:val.trim(),label:photos[i].label};render();}};
  window[`ptClear_${containerId}`]=(e,i)=>{e.stopPropagation();_pending[i]=null;photos[i]={url:'',label:photos[i].label};render();};

  /* Upload vers Cloudinary tous les fichiers en attente — appelé par submitArticle() */
  window[`ptFlush_${containerId}`]=async()=>{
    for(let i=0;i<photos.length;i++){
      if(_pending[i]&&_pending[i].file){
        const url=await uploadToCloudinary(_pending[i].file);
        photos[i]={url,label:photos[i].label};
        _pending[i]=null;
      }
    }
    return photos.filter(ph=>ph.url);
  };

  render();
  return {getPhotos:()=>photos,flush:window[`ptFlush_${containerId}`]};
}

/* ── NAV ── */
function loadNav(){
  const el=document.getElementById('nav-placeholder');if(!el)return;
  const user=Auth.getCurrentUser();
  const cartCount=DB.getCartCount();
  const notifCount=user?DB.getNotifications(user.id).filter(n=>!n.read).length:0;
  const inSub=window.location.pathname.includes('/vendor/')||window.location.pathname.includes('/admin/');
  const r=inSub?'../':'';
  el.innerHTML=`
  <nav class="main-nav" id="mainNav">
    <div class="nav-inner">
      <a href="${r}index.html" class="nav-logo">
       <img src="assets/images/vendora-logo" alt="Vendora-sn" style="height:100px;width:auto;object-fit:contain;display:block;">
      </a>
      <button class="nav-toggle" onclick="toggleMobileNav()" id="navToggle">☰</button>
      <ul class="nav-links" id="navLinks">
        <li><a href="${r}boutique.html">Explorer</a></li>
        <li><a href="${r}boutique.html?cat=Vêtements">Mode</a></li>
        <li><a href="${r}boutique.html?cat=Électronique">Électronique</a></li>
        <li><a href="${r}boutique.html?cat=Maison & Décoration">Maison</a></li>
        <li><a href="${r}boutique.html?cat=Vaisselle">Vaisselle</a></li>
        ${user?.role==='admin'?`<li><a href="${r}admin/dashboard.html" style="color:var(--accent)">Admin</a></li>`:''}
      </ul>
      <div class="nav-actions">
        ${user?.role==='seller'||user?.role==='admin'
          ?`<a href="${r}${user.role==='admin'?'admin/dashboard.html':'vendor/dashboard.html'}" class="nav-user-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              ${user.name.split(' ')[0]}
            </a>
            <button class="nav-notif-btn" onclick="toggleNotifPanel()" title="Notifications">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
              <span class="notif-live-badge" style="position:absolute;top:-5px;right:-5px;background:var(--accent);color:#fff;border-radius:50%;width:15px;height:15px;font-size:.5rem;display:${notifCount>0?'flex':'none'};align-items:center;justify-content:center">${notifCount}</span>
            </button>
            <a href="${r}${user.role==='admin'?'admin/dashboard.html':'vendor/dashboard.html'}" class="nav-sell-btn" style="background:transparent;border:1px solid var(--border2);color:var(--text3)">Mon espace</a>`
          :`<a href="${r}connexion-vendeur.html" class="nav-sell-btn">Vendre</a>
            <a href="${r}connexion-vendeur.html" class="nav-user-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            </a>`}
        <button class="theme-toggle" onclick="toggleTheme()" title="Changer le thème">🌙</button>
        <button class="nav-cart-btn" onclick="openCartDrawer()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          <span class="cart-badge" style="display:${cartCount>0?'flex':'none'}">${cartCount}</span>
        </button>
      </div>
    </div>
  </nav>`;
  window.addEventListener('scroll',()=>document.getElementById('mainNav')?.classList.toggle('scrolled',window.scrollY>60));
  initTheme();
  if(!document.getElementById('scrollTopBtn')){
    const btn=document.createElement('button');
    btn.id='scrollTopBtn';btn.className='scroll-top-btn';btn.innerHTML='↑';btn.title='Retour en haut';
    btn.onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
    document.body.appendChild(btn);
    window.addEventListener('scroll',()=>{btn.classList.toggle('visible',window.scrollY>400);});
  }
  if(user){
    function refreshNotifBadge(){
      const count=DB.getNotifications(user.id).filter(n=>!n.read).length;
      document.querySelectorAll('.notif-live-badge').forEach(el=>{
        el.textContent=count;
        el.style.display=count>0?'flex':'none';
      });
    }
    refreshNotifBadge();
    setInterval(refreshNotifBadge,8000);
  }
}

function toggleNotifPanel(){
  let panel=document.getElementById('notifPanel');
  if(!panel){
    panel=document.createElement('div');
    panel.id='notifPanel';panel.className='notif-panel';
    document.body.appendChild(panel);
    document.addEventListener('click',e=>{if(!panel.contains(e.target)&&!e.target.closest('.nav-notif-btn'))panel.classList.remove('open');});
  }
  const user=Auth.getCurrentUser();
  const notifs=user?DB.getNotifications(user.id).slice().reverse().slice(0,8):[];
  panel.innerHTML=`
    <div class="notif-panel-header">
      <span>Notifications</span>
      ${notifs.some(n=>!n.read)?`<button onclick="markAllRead()" style="font-size:.6rem;color:var(--accent);background:none;border:none;cursor:pointer;font-family:var(--font-sub);letter-spacing:.08em">Tout lire</button>`:''}
    </div>
    ${notifs.length?notifs.map(n=>`
      <div class="notif-item${n.read?' read':''}" onclick="markOneRead(${n.id})">
        <span class="notif-dot" style="${n.read?'background:var(--muted)':'background:var(--accent)'}"></span>
        <div>
          <p class="notif-msg">${n.msg}</p>
          <p class="notif-time">${timeAgo(n.createdAt)}</p>
        </div>
      </div>`).join('')
    :'<p style="padding:1.5rem;text-align:center;font-size:.78rem;color:var(--muted)">Aucune notification</p>'}
  `;
  panel.classList.toggle('open');
}

function markAllRead(){
  const user=Auth.getCurrentUser();if(!user)return;
  DB.getNotifications(user.id).forEach(n=>DB.markNotifRead(n.id));
  document.querySelectorAll('.notif-live-badge').forEach(b=>b.style.display='none');
  toggleNotifPanel();toggleNotifPanel();
}

function markOneRead(id){
  DB.markNotifRead(id);
  const user=Auth.getCurrentUser();if(!user)return;
  const count=DB.getNotifications(user.id).filter(n=>!n.read).length;
  document.querySelectorAll('.notif-live-badge').forEach(b=>{b.textContent=count;b.style.display=count>0?'flex':'none';});
  toggleNotifPanel();toggleNotifPanel();
}

function toggleMobileNav(){
  const links=document.getElementById('navLinks');
  const toggle=document.getElementById('navToggle');
  const isOpen=links?.classList.toggle('open');
  if(toggle)toggle.textContent=isOpen?'✕':'☰';
  document.body.style.overflow=isOpen?'hidden':'';
}

document.addEventListener('click',e=>{
  if(e.target.closest('#navLinks a')){
    document.getElementById('navLinks')?.classList.remove('open');
    const toggle=document.getElementById('navToggle');
    if(toggle)toggle.textContent='☰';
    document.body.style.overflow='';
  }
});

/* ── FOOTER ── */
function loadFooter(){
  const el=document.getElementById('footer-placeholder');if(!el)return;
  el.innerHTML=`
  <footer class="main-footer">
    <div class="footer-inner">
      <div>
        <div style="font-family:var(--font-display);font-size:1.8rem;letter-spacing:.06em">Vendora<span style="color:var(--accent)">-sn</span></div>
        <p>La marketplace streetwear & vintage du Sénégal.<br>Achetez et vendez en toute confiance.</p>
        <div class="footer-social">
          <a href="https://wa.me/221774954868" target="_blank" class="social-link">WA</a>
          <a href="#" class="social-link">IG</a>
          <a href="#" class="social-link">FB</a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Explorer</h4>
        <a href="boutique.html?cat=Vêtements">Vêtements</a>
        <a href="boutique.html?cat=Chaussures">Chaussures</a>
        <a href="boutique.html?cat=Vintage">Vintage</a>
        <a href="boutique.html?cat=Montres">Montres & Bijoux</a>
        <a href="boutique.html">Tout voir</a>
      </div>
      <div class="footer-col">
        <h4>Vendeurs</h4>
        <a href="inscription-vendeur.html">Créer un compte</a>
        <a href="connexion-vendeur.html">Se connecter</a>
        <a href="vendor/dashboard.html">Mon espace</a>
        <a href="faq.html">Comment vendre ?</a>
      </div>
      <div class="footer-col">
        <h4>Informations</h4>
        <a href="about.html">À propos</a>
        <a href="contact.html">Contact</a>
        <a href="faq.html">FAQ</a>
        <a href="#">Conditions</a>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-creator">Site créé par <strong>Sabastou Consulting</strong> · Développeur Web &amp; Designer X Transitaire</div>
      <div class="footer-contacts">
        <a href="mailto:vendora-sndkr@gmail.com">📧 vendora-sndkr@gmail.com</a>
        <a href="https://wa.me/221774954868" target="_blank">📱 +221 77 495 48 68</a>
        <span>📍 Dakar, Sénégal</span>
      </div>
      <div class="footer-legal">
        <p>© 2026 Vendora-sn · Tous droits réservés</p>
        <div><a href="#">Mentions légales</a><a href="#">CGV</a></div>
      </div>
    </div>
  </footer>`;
}

/* ── CART DRAWER ── */
function loadCart(){
  const el=document.getElementById('cart-placeholder');if(!el)return;
  el.innerHTML=`
  <div class="cart-overlay" id="cartOverlay" onclick="closeCartDrawer()"></div>
  <div class="cart-drawer" id="cartDrawer">
    <div class="cd-header"><h2>PANIER</h2><button class="cd-close" onclick="closeCartDrawer()">✕</button></div>
    <div class="cd-items" id="cdItems"></div>
    <div class="cd-footer" id="cdFooter"></div>
  </div>`;
  renderCartDrawer();updateCartBadge();
}

function openCartDrawer(){renderCartDrawer();document.getElementById('cartOverlay')?.classList.add('open');document.getElementById('cartDrawer')?.classList.add('open');document.body.style.overflow='hidden';}
function closeCartDrawer(){document.getElementById('cartOverlay')?.classList.remove('open');document.getElementById('cartDrawer')?.classList.remove('open');document.body.style.overflow='';}

function renderCartDrawer(){
  const items=DB.getCart();const total=DB.getCartTotal();
  const itemsEl=document.getElementById('cdItems');const footerEl=document.getElementById('cdFooter');if(!itemsEl)return;
  if(!items.length){
    itemsEl.innerHTML=`<div class="cd-empty"><div class="cd-empty-icon">🛒</div><p>PANIER <span>VIDE</span></p><a href="boutique.html" class="btn-outline" onclick="closeCartDrawer()">Explorer</a></div>`;
    footerEl.innerHTML='';return;
  }
  const bySeller={};
  items.forEach(i=>{if(!bySeller[i.sellerId])bySeller[i.sellerId]=[];bySeller[i.sellerId].push(i);});
  itemsEl.innerHTML=Object.entries(bySeller).map(([sid,sitems])=>`
    <div style="margin-bottom:.75rem">
      <p style="font-size:.58rem;letter-spacing:.2em;text-transform:uppercase;color:var(--red);margin-bottom:.45rem;font-family:var(--font-sub)">Vendeur : ${sitems[0].sellerName}</p>
      ${sitems.map(item=>`
        <div class="cd-item">
          <div class="cd-item-img">
            ${item.photo?`<img src="${item.photo}" alt="${escHtml(item.name)}" onerror="this.style.display='none'">`:`<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:1.5rem;opacity:.2">📦</div>`}
          </div>
          <div class="cd-item-info">
            <p class="cd-name">${escHtml(item.name)}</p>
            <p class="cd-price">${formatPrice(item.price)}</p>
            <button class="cd-remove" onclick="cdRemove('${item.key}')">✕ Retirer</button>
          </div>
        </div>`).join('')}
    </div>`).join('');
  footerEl.innerHTML=`
    <div class="cd-total"><span>Total</span><span>${formatPrice(total)}</span></div>
    <p class="cd-note">Paiement direct au vendeur · Commission Vendora-sn ${CONFIG.COMMISSION_PERCENT}% incluse</p>
    <a href="commande.html" class="btn-red cd-checkout" onclick="closeCartDrawer()">Commander — ${formatPrice(total)}</a>
    <a href="boutique.html" class="btn-ghost cd-continue" onclick="closeCartDrawer()">Continuer</a>`;
}

function cdRemove(key){DB.removeFromCart(key);updateCartBadge();renderCartDrawer();}

/* ═══════════════════════════════════════════════
   NOUVELLES FONCTIONNALITÉS
═══════════════════════════════════════════════ */

/* ── RECENTLY VIEWED ── */
const RV_KEY='vd_recently_viewed';
function rvAdd(productId){
  let rv=JSON.parse(localStorage.getItem(RV_KEY)||'[]');
  rv=rv.filter(id=>id!==productId);
  rv.unshift(productId);
  rv=rv.slice(0,12);
  localStorage.setItem(RV_KEY,JSON.stringify(rv));
}
function rvGet(){return JSON.parse(localStorage.getItem(RV_KEY)||'[]');}
function renderRecentlyViewed(containerId){
  const el=document.getElementById(containerId);if(!el)return;
  const ids=rvGet();
  const products=ids.map(id=>DB.getProduct(id)).filter(Boolean).filter(p=>p.status==='approved');
  if(!products.length){el.closest('.recently-viewed-section')?.remove();return;}
  const base=window.location.pathname.includes('/vendor/')||window.location.pathname.includes('/admin/')?'../':'';
  el.innerHTML=products.map(p=>{
    const photo=p.photos?.[0]?.url||null;
    return `<div class="rv-card" onclick="window.location='${base}produit.html?id=${p.id}'">
      <div class="rv-card-img">${photo?`<img src="${photo}" alt="${escHtml(p.name)}" loading="lazy">`:`<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:1.8rem;opacity:.2">📦</div>`}</div>
      <div class="rv-card-body">
        <div class="rv-card-name">${escHtml(p.name)}</div>
        <div class="rv-card-price">${formatPrice(p.price)}</div>
      </div>
    </div>`;
  }).join('');
}

/* ── SKELETON LOADING ── */
function renderSkeletons(containerId,count=4){
  const el=document.getElementById(containerId);if(!el)return;
  el.innerHTML=Array(count).fill(0).map(()=>`
    <div class="prod-card-skeleton">
      <div class="skeleton skel-img"></div>
      <div class="skel-body">
        <div class="skeleton skel-line" style="width:40%;height:9px;margin-bottom:8px;"></div>
        <div class="skeleton skel-line" style="width:80%;height:13px;margin-bottom:6px;"></div>
        <div class="skeleton skel-line short" style="height:10px;margin-bottom:14px;"></div>
        <div class="skeleton skel-line xshort" style="height:16px;"></div>
      </div>
    </div>`).join('');
}

/* ── FADE-IN AU SCROLL ── */
function initFadeInCards(){
  const observer=new IntersectionObserver((entries)=>{
    entries.forEach((entry,i)=>{
      if(entry.isIntersecting){
        setTimeout(()=>entry.target.classList.add('visible'),i*60);
        observer.unobserve(entry.target);
      }
    });
  },{threshold:0.1});
  document.querySelectorAll('.prod-card').forEach(card=>{
    card.classList.add('fade-in-card');
    observer.observe(card);
  });
}

/* ── BADGE NOUVEAU (< 48h) ── */
function isNew(createdAt){
  return createdAt&&(Date.now()-new Date(createdAt))<48*3600*1000;
}

/* ── COMPTEUR DE VUES ── */
function getViews(productId){
  const key='vd_views_'+productId;
  let v=parseInt(localStorage.getItem(key)||'0');
  if(!v){v=Math.floor(Math.random()*80)+5;localStorage.setItem(key,v);}
  localStorage.setItem(key,v+1);
  return v;
}

/* ── PRODUCT CARD V2 ── */
function productCardV2(p){
  const photo=p.photos?.[0]?.url||null;
  const photo2=p.photos?.[1]?.url||null;
  const seller=DB.getUser(p.sellerId);
  const initials=seller?.name?seller.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2):'?';
  const isSold=p.status==='sold';
  const isNewBadge=isNew(p.createdAt);
  const views=getViews(p.id);
  const base=window.location.pathname.includes('/vendor/')||window.location.pathname.includes('/admin/')?'../':'';
  const url=`${base}produit.html?id=${p.id}`;
  return `<div class="prod-card fade-in-card" data-id="${p.id}" onclick="${isSold?'':` window.location='${url}'`}" style="cursor:${isSold?'default':'pointer'}">
    <div class="prod-card-img">
      ${photo?`<img src="${photo}" alt="${escHtml(p.name)}" loading="lazy" onerror="this.parentNode.innerHTML='<div class=no-photo><div class=no-photo-icon>📦</div></div>'">
        ${photo2?`<img class="img-hover" src="${photo2}" alt="${escHtml(p.name)}" loading="lazy">`:''}`:
        `<div class="no-photo"><div class="no-photo-icon">📦</div></div>`}
      ${p.condition?`<span class="prod-condition ${conditionClass(p.condition)}">${p.condition}</span>`:''}
      ${isNewBadge&&!isSold?`<span class="badge-new">Nouveau</span>`:''}
      ${isSold?`<div class="prod-sold-overlay"><span>VENDU</span></div>`:''}
    </div>
    <div class="prod-card-body">
      <div class="prod-meta-row">
        <span class="prod-timer">🕐 ${timeAgo(p.createdAt)}</span>
        <span class="prod-views">👁 ${views}</span>
      </div>
      <div class="prod-seller">
        <div class="prod-seller-avatar">${initials}</div>
        <span class="prod-seller-name">${seller?.name||'Vendeur'}${seller?.verified?'<span class="badge-verified" title="Vendeur vérifié">✓</span>':''}</span>
      </div>
      <p class="prod-cat">${escHtml(p.category)}</p>
      <h3 class="prod-name">${escHtml(p.name)}</h3>
      <p class="prod-desc-short">${escHtml(truncate(p.description,65))}</p>
      <div class="prod-footer">
        <div class="prod-price-block">
          <p class="prod-price">${formatPrice(p.price)}</p>
          ${p.negotiable&&!isSold?`<span class="prod-badge-neg">🏷️ Négociable</span>`:''}
        </div>
        ${!isSold?`<div class="prod-actions">
          <button class="prod-add-btn" onclick="event.stopPropagation();addToCartUI(${p.id})">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Panier
          </button>
        </div>`:''}
      </div>
    </div>
  </div>`;
}

/* ── QUICK VIEW MODAL ── */
function initQuickView(){
  if(document.getElementById('quickviewOverlay'))return;
  const overlay=document.createElement('div');
  overlay.id='quickviewOverlay';
  overlay.className='quickview-overlay';
  overlay.innerHTML=`<div class="quickview-modal" id="quickviewModal">
    <button class="qv-close" onclick="closeQuickView()">✕</button>
    <div class="qv-body">
      <div class="qv-img" id="qvImg"></div>
      <div class="qv-info" id="qvInfo"></div>
    </div>
  </div>`;
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeQuickView();});
  document.body.appendChild(overlay);
}

function openQuickView(productId){
  initQuickView();
  const p=DB.getProduct(productId);if(!p)return;
  const photo=p.photos?.[0]?.url||null;
  const seller=DB.getUser(p.sellerId);
  const sellerNum=(seller?.whatsapp||seller?.phone||'').replace(/\D/g,'');
  const base=window.location.pathname.includes('/vendor/')||window.location.pathname.includes('/admin/')?'../':'';
  document.getElementById('qvImg').innerHTML=photo
    ?`<img src="${photo}" alt="${escHtml(p.name)}" style="width:100%;height:100%;object-fit:cover;">`
    :`<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:3rem;opacity:.2">📦</div>`;
  document.getElementById('qvInfo').innerHTML=`
    <p class="qv-cat">${escHtml(p.category)}</p>
    <h2 class="qv-name">${escHtml(p.name)}</h2>
    <p class="qv-price">${formatPrice(p.price)}</p>
    <p class="qv-desc">${escHtml(truncate(p.description,180))}</p>
    <div class="qv-actions">
      <button class="btn-red" onclick="addToCartUI(${p.id});showToast('Ajouté au panier ✓');">🛒 Ajouter au panier</button>
      ${sellerNum?`<a class="wa-share-btn" href="https://wa.me/${sellerNum}?text=${encodeURIComponent('Bonjour, je suis intéressé(e) par votre article "'+p.name+'" sur Vendora-sn.')}" target="_blank">
        <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.556 4.126 1.528 5.862L.057 23.93l6.225-1.452A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.88 0-3.645-.5-5.17-1.373l-.371-.22-3.693.862.927-3.584-.242-.38A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
        Contacter via WhatsApp
      </a>`:''}
      <a href="${base}produit.html?id=${p.id}" class="btn-ghost" style="text-align:center">Voir la page complète →</a>
    </div>`;
  document.getElementById('quickviewOverlay').classList.add('open');
  document.body.style.overflow='hidden';
}

function closeQuickView(){
  document.getElementById('quickviewOverlay')?.classList.remove('open');
  document.body.style.overflow='';
}

/* ── SWIPE COUP DE CŒUR ── */
let swipeProducts=[],swipeIndex=0,swipeLiked=[];
let isDragging=false,startX=0,startY=0,curX=0;

function openSwipeMode(){
  swipeProducts=DB.getProducts('approved').sort(()=>Math.random()-0.5).slice(0,20);
  swipeIndex=0;swipeLiked=[];
  let overlay=document.getElementById('swipeOverlay');
  if(!overlay){
    overlay=document.createElement('div');
    overlay.id='swipeOverlay';
    overlay.className='swipe-overlay';
    overlay.innerHTML=`
      <div class="swipe-header">
        <div class="swipe-logo">Vendora<span>-sn</span></div>
        <span class="swipe-counter" id="swipeCounter"></span>
        <button class="swipe-close" onclick="closeSwipeMode()">✕</button>
      </div>
      <div class="swipe-card-stack" id="swipeStack"></div>
      <div class="swipe-liked-count" id="swipeLikedCount">❤️ 0 coup(s) de cœur</div>
      <div class="swipe-btns">
        <button class="swipe-btn nope" onclick="swipeAction('left')" title="Pas intéressé">✕</button>
        <button class="swipe-btn like" onclick="swipeAction('right')" title="Coup de cœur">❤️</button>
      </div>
      <p class="swipe-hint">← Non · Oui →</p>`;
    document.body.appendChild(overlay);
  }
  overlay.classList.add('open');
  document.body.style.overflow='hidden';
  renderSwipeCard();
}

function closeSwipeMode(){
  document.getElementById('swipeOverlay')?.classList.remove('open');
  document.body.style.overflow='';
  if(swipeLiked.length)showToast(`❤️ ${swipeLiked.length} article(s) ajouté(s) au panier !`,'success');
}

function renderSwipeCard(){
  const stack=document.getElementById('swipeStack');if(!stack)return;
  document.getElementById('swipeCounter').textContent=`${swipeIndex+1} / ${swipeProducts.length}`;
  stack.innerHTML='';
  for(let i=Math.min(swipeIndex+2,swipeProducts.length-1);i>=swipeIndex;i--){
    const p=swipeProducts[i];
    const photo=p.photos?.[0]?.url||null;
    const card=document.createElement('div');
    card.className='swipe-card';
    card.style.zIndex=i===swipeIndex?10:5;
    card.style.transform=i===swipeIndex?'scale(1)':'scale(0.95) translateY(12px)';
    card.innerHTML=`
      <div class="swipe-stamp like" id="stampLike">❤️ OUI</div>
      <div class="swipe-stamp nope" id="stampNope">✕ NON</div>
      ${photo?`<img class="swipe-card-img" src="${photo}" alt="${escHtml(p.name)}" draggable="false">`:`<div class="swipe-card-img-placeholder">📦</div>`}
      <div class="swipe-card-body">
        <div class="swipe-card-cat">${escHtml(p.category)}</div>
        <div class="swipe-card-name">${escHtml(p.name)}</div>
        <div class="swipe-card-price">${formatPrice(p.price)}</div>
      </div>`;
    if(i===swipeIndex){
      card.addEventListener('mousedown',swipeDragStart);
      card.addEventListener('touchstart',swipeDragStart,{passive:true});
    }
    stack.appendChild(card);
  }
}

function swipeDragStart(e){
  isDragging=true;
  startX=e.touches?e.touches[0].clientX:e.clientX;
  startY=e.touches?e.touches[0].clientY:e.clientY;
  const card=e.currentTarget;
  const onMove=ev=>{
    if(!isDragging)return;
    curX=(ev.touches?ev.touches[0].clientX:ev.clientX)-startX;
    const rot=curX*0.08;
    card.style.transform=`translateX(${curX}px) rotate(${rot}deg)`;
    const like=card.querySelector('#stampLike');
    const nope=card.querySelector('#stampNope');
    if(like)like.style.opacity=Math.max(0,curX/80);
    if(nope)nope.style.opacity=Math.max(0,-curX/80);
  };
  const onEnd=()=>{
    isDragging=false;
    document.removeEventListener('mousemove',onMove);
    document.removeEventListener('mouseup',onEnd);
    document.removeEventListener('touchmove',onMove);
    document.removeEventListener('touchend',onEnd);
    if(Math.abs(curX)>80){
      swipeAction(curX>0?'right':'left');
    }else{
      card.style.transform='scale(1)';
      card.style.transition='transform .3s';
      const like=card.querySelector('#stampLike');
      const nope=card.querySelector('#stampNope');
      if(like)like.style.opacity=0;
      if(nope)nope.style.opacity=0;
    }
    curX=0;
  };
  document.addEventListener('mousemove',onMove);
  document.addEventListener('mouseup',onEnd);
  document.addEventListener('touchmove',onMove,{passive:true});
  document.addEventListener('touchend',onEnd);
}

function swipeAction(dir){
  const p=swipeProducts[swipeIndex];if(!p)return;
  if(dir==='right'){
    swipeLiked.push(p.id);
    DB.addToCart(p.id);
    updateCartBadge();
    document.getElementById('swipeLikedCount').textContent=`❤️ ${swipeLiked.length} coup(s) de cœur`;
  }
  swipeIndex++;
  if(swipeIndex>=swipeProducts.length){
    document.getElementById('swipeStack').innerHTML=`<div style="text-align:center;color:rgba(255,255,255,.6);font-family:var(--font-sub);font-size:.85rem;padding:2rem;">Vous avez tout vu !<br><br>❤️ ${swipeLiked.length} coup(s) de cœur ajouté(s) au panier.</div>`;
    document.getElementById('swipeCounter').textContent='Terminé !';
    return;
  }
  renderSwipeCard();
}

/* ── RECHERCHE EN TEMPS RÉEL ── */
function initSearchBar(inputId,suggestionsId){
  const input=document.getElementById(inputId);
  const sugg=document.getElementById(suggestionsId);
  if(!input||!sugg)return;
  const base=window.location.pathname.includes('/vendor/')||window.location.pathname.includes('/admin/')?'../':'';
  let debounce;
  input.addEventListener('input',()=>{
    clearTimeout(debounce);
    debounce=setTimeout(()=>{
      const q=input.value.trim().toLowerCase();
      if(q.length<2){sugg.classList.remove('open');return;}
      const products=DB.getProducts('approved');
      const matches=products.filter(p=>
        p.name.toLowerCase().includes(q)||
        p.category.toLowerCase().includes(q)||
        (p.description||'').toLowerCase().includes(q)
      ).slice(0,6);
      if(!matches.length){
        sugg.innerHTML=`<div class="sugg-no-result">Aucun résultat pour "<strong>${escHtml(q)}</strong>"</div>`;
      }else{
        sugg.innerHTML=`<div class="sugg-section-label">Articles</div>`+
          matches.map(p=>{
            const photo=p.photos?.[0]?.url||null;
            return `<div class="sugg-item" onclick="window.location='${base}produit.html?id=${p.id}'">
              ${photo?`<img class="sugg-thumb" src="${photo}" alt="" loading="lazy">`:`<div class="sugg-thumb-placeholder">📦</div>`}
              <div>
                <div class="sugg-name">${escHtml(p.name)}</div>
                <div class="sugg-price">${formatPrice(p.price)}</div>
              </div>
            </div>`;
          }).join('');
      }
      sugg.classList.add('open');
    },200);
  });
  input.addEventListener('keydown',e=>{
    if(e.key==='Enter'){
      sugg.classList.remove('open');
      window.location=`${base}boutique.html?q=${encodeURIComponent(input.value.trim())}`;
    }
  });
  document.addEventListener('click',e=>{
    if(!input.contains(e.target)&&!sugg.contains(e.target))sugg.classList.remove('open');
  });
}

/* ── BOTTOM NAV MOBILE ── */
function loadBottomNav(){
  if(document.getElementById('bottomNav'))return;
  const base=window.location.pathname.includes('/vendor/')||window.location.pathname.includes('/admin/')?'../':'';
  const nav=document.createElement('nav');
  nav.id='bottomNav';
  nav.className='bottom-nav';
  const cartCount=DB.getCartCount();
  nav.innerHTML=`<div class="bottom-nav-inner">
    <a class="bottom-nav-item" href="${base}index.html">
      <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      Accueil
    </a>
    <a class="bottom-nav-item" href="${base}boutique.html">
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      Explorer
    </a>
    <div class="bottom-nav-center-wrap">
      <div class="bottom-nav-item center-btn" onclick="openSwipeMode()" title="Coup de cœur">❤️</div>
    </div>
    <a class="bottom-nav-item" href="${base}boutique.html" onclick="openCartDrawer();return false;">
      <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
      Panier
    </a>
    <a class="bottom-nav-item" href="${base}connexion-vendeur.html">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
      Compte
    </a>
  </div>`;
  document.body.appendChild(nav);
}

/* ── FAB THEME SWITCHER ── */
function loadThemeFab(){
  if(document.getElementById('themeFab'))return;
  const fab=document.createElement('button');
  fab.id='themeFab';
  fab.className='theme-switcher-fab';
  const theme=localStorage.getItem('dfm_theme')||'dark';
  fab.textContent=theme==='dark'?'☀️':'🌙';
  fab.title='Changer le thème';
  fab.onclick=()=>{toggleTheme();fab.textContent=(localStorage.getItem('dfm_theme')==='dark')?'☀️':'🌙';};
  document.body.appendChild(fab);
}

/* ── FLOATING ORDER BTN ── */
function initFloatingOrderBtn(href){
  if(document.getElementById('floatOrderBtn'))return;
  const btn=document.createElement('button');
  btn.id='floatOrderBtn';
  btn.className='float-order-btn';
  btn.textContent='🛒 Commander maintenant';
  btn.onclick=()=>window.location=href||'commande.html';
  document.body.appendChild(btn);
  const orderSection=document.querySelector('.product-info .btn-red, .product-info a[href*="commande"]');
  if(orderSection){
    const obs=new IntersectionObserver(entries=>{
      btn.classList.toggle('show',!entries[0].isIntersecting);
    });
    obs.observe(orderSection);
  }else{
    window.addEventListener('scroll',()=>btn.classList.toggle('show',window.scrollY>400));
  }
}

/* ── BACK BUTTON ── */
function loadBackBtn(){
  if(window.history.length<=1)return;
  if(document.getElementById('backBtn'))return;
  const btn=document.createElement('button');
  btn.id='backBtn';
  btn.innerHTML='&#8592;';
  btn.title='Retour';
  btn.onclick=()=>history.back();
  btn.style.cssText='position:fixed;top:calc(var(--nav-h) + 10px);left:12px;z-index:120;background:var(--surface);border:1px solid var(--border);color:var(--text);width:38px;height:38px;border-radius:50%;font-size:1.2rem;cursor:pointer;display:none;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.2);transition:border-color .2s;';
  btn.onmouseenter=()=>btn.style.borderColor='var(--red)';
  btn.onmouseleave=()=>btn.style.borderColor='var(--border)';
  document.body.appendChild(btn);
  if(window.innerWidth<=768)btn.style.display='flex';
  window.addEventListener('resize',()=>{
    btn.style.display=window.innerWidth<=768?'flex':'none';
  });
}

/* ── WHATSAPP SHARE ── */
function waShare(productName,productUrl){
  const text=`🛍️ Découvrez "${productName}" sur Vendora-sn !\n${productUrl||window.location.href}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,'_blank');
}
