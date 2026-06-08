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
        <img src="data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAQABgADASIAAhEBAxEB/8QAHAABAAICAwEAAAAAAAAAAAAAAAYHAQUCBAgD/8QAVRABAAEDAgIECAkGCQoFBQEAAAECAwQFEQYhBxIxQRMiNlFhgZGxFBUyUnFzdMHRIzVClKGyFzNTVWRyk9LwJDRFVGJjg5LC4RZDRIKzJSaEovF1/8QAHAEBAAIDAQEBAAAAAAAAAAAAAAYHAwQFAQII/8QARREBAAEDAQQFCQQHCAICAwAAAAECAwQRBQYhMRJBcbHBExRRYYGRodHhIjI08BY1NlJTcoIVFyMzQkVzogeDkvFDYrL/2gAMAwEAAhEDEQA/APGQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/Z" alt="Vendora-sn" style="height:38px;width:auto;object-fit:contain;display:block;">
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
