/* ══════════════════════════════════════════════
   VENDORA — PARALLAX & SCROLL ANIMATIONS
   Compatible : Chrome, Firefox, Safari iOS, Android Chrome
══════════════════════════════════════════════ */
(function(){

  /* ── 1. HERO PARALLAX ORBS (mouse + scroll) ── */
  function initHeroParallax(){
    const orb1=document.querySelector('.orb1');
    const orb2=document.querySelector('.orb2');
    const orb3=document.querySelector('.orb3');
    if(!orb1)return;

    /* Mouse move — desktop only */
    if(window.matchMedia('(hover:hover)').matches){
      document.addEventListener('mousemove',e=>{
        const x=(e.clientX/window.innerWidth-.5)*2;
        const y=(e.clientY/window.innerHeight-.5)*2;
        if(orb1)orb1.style.transform=`translate(${x*30}px,${y*20}px)`;
        if(orb2)orb2.style.transform=`translate(${-x*20}px,${-y*15}px)`;
        if(orb3)orb3.style.transform=`translate(${x*15}px,${y*25}px)`;
      },{passive:true});
    }

    /* Scroll parallax on hero grid */
    const grid=document.querySelector('.hero-grid');
    window.addEventListener('scroll',()=>{
      const y=window.scrollY;
      if(grid)grid.style.transform=`translateY(${y*.3}px)`;
      if(orb1)orb1.style.transform=`translateY(${y*.2}px)`;
      if(orb2)orb2.style.transform=`translateY(${-y*.15}px)`;
    },{passive:true});
  }

  /* ── 2. CURSOR GLOW (desktop only) ── */
  function initCursorGlow(){
    if(!window.matchMedia('(hover:hover)').matches)return;
    const glow=document.createElement('div');
    glow.className='cursor-glow';
    document.body.appendChild(glow);
    let cx=0,cy=0,tx=0,ty=0;
    document.addEventListener('mousemove',e=>{tx=e.clientX;ty=e.clientY;},{passive:true});
    (function loop(){
      cx+=(tx-cx)*.08;cy+=(ty-cy)*.08;
      glow.style.transform=`translate(${cx-150}px,${cy-150}px)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ── 3. HERO TITLE LETTER-BY-LETTER ── */
  function initHeroTitle(){
    const title=document.querySelector('.hero-title');
    if(!title)return;
    let ci=0;
    function wrapNode(node){
      if(node.nodeType===3){
        const text=node.textContent;
        if(!text.trim())return;
        const frag=document.createDocumentFragment();
        for(const ch of text){
          if(/[A-Za-z\u00C0-\u00FF0-9-]/.test(ch)){
            const s=document.createElement('span');
            s.className='letter';
            s.style.animationDelay=(ci*0.035).toFixed(2)+'s';
            s.textContent=ch;
            frag.appendChild(s);
            ci++;
          }else{frag.appendChild(document.createTextNode(ch));}
        }
        node.parentNode.replaceChild(frag,node);
      }else if(node.nodeType===1){
        Array.from(node.childNodes).forEach(wrapNode);
      }
    }
    Array.from(title.childNodes).forEach(wrapNode);
  }

  /* ── 4. PARTICLES ── */
  function initParticles(){
    const container=document.querySelector('.hero-particles');
    if(!container)return;
    const count=18;
    for(let i=0;i<count;i++){
      const p=document.createElement('div');
      p.className='particle';
      const x=Math.random()*100;
      const dur=6+Math.random()*10;
      const delay=Math.random()*10;
      const drift=(-30+Math.random()*60).toFixed(0);
      const size=1+Math.random()*3;
      p.style.cssText=`left:${x}%;bottom:${Math.random()*30}%;--dur:${dur}s;--delay:${delay}s;--drift:${drift}px;width:${size}px;height:${size}px;`;
      container.appendChild(p);
    }
  }

  /* ── 5. SCROLL REVEAL (IntersectionObserver) ── */
  function observeEl(el,io){
    /* Si l'élément est déjà dans le viewport au chargement, le rendre visible immédiatement */
    const r=el.getBoundingClientRect();
    if(r.top<window.innerHeight&&r.bottom>0){
      /* Délai court pour que la transition CSS soit visible */
      setTimeout(()=>el.classList.add('visible'),100);
    } else {
      io.observe(el);
    }
  }

  function initScrollReveal(){
    const io=new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    },{threshold:.08,rootMargin:'0px 0px -20px 0px'});

    document.querySelectorAll('.reveal,.reveal-stagger').forEach(el=>observeEl(el,io));

    /* Observer les éléments ajoutés dynamiquement (cartes produits injectées par ui.js) */
    const mutObs=new MutationObserver(()=>{
      document.querySelectorAll('.reveal:not(.visible),.reveal-stagger:not(.visible)').forEach(el=>observeEl(el,io));
    });
    mutObs.observe(document.body,{childList:true,subtree:true});
  }

  /* ── 6. STAT COUNTER ANIMATION ── */
  function animateCounter(el,target,duration=1500){
    const start=performance.now();
    const from=0;
    (function tick(now){
      const progress=Math.min((now-start)/duration,1);
      const ease=1-Math.pow(1-progress,3);
      el.textContent=Math.round(from+(target-from)*ease);
      if(progress<1)requestAnimationFrame(tick);
      else el.textContent=target;
    })(start);
  }

  function initCounters(){
    const statEls=document.querySelectorAll('.hero-stat-n');
    if(!statEls.length)return;
    const io=new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          const val=parseInt(e.target.textContent)||0;
          if(val>0)animateCounter(e.target,val);
          io.unobserve(e.target);
        }
      });
    },{threshold:.5});
    statEls.forEach(el=>io.observe(el));
  }

  /* ── 7. SECTION TITLE UNDERLINE ── */
  function initTitleUnderline(){
    const io=new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}
      });
    },{threshold:.3});
    document.querySelectorAll('.section-title-wrap').forEach(el=>io.observe(el));
  }

  /* ── 8. MARQUEE BAND (inject if not present) ── */
  function initMarquee(){
    if(document.querySelector('.marquee-band'))return;
    const items=['Mode & Vintage','Électronique','Sneakers & Kicks','Maison & Déco','Montres & Bijoux','Sacs Premium','Vendora-sn','Sénégal','Mode & Vintage','Électronique','Sneakers & Kicks','Maison & Déco','Montres & Bijoux','Sacs Premium','Vendora-sn','Sénégal'];
    const band=document.createElement('div');
    band.className='marquee-band';
    band.innerHTML=`<div class="marquee-track">${items.map(t=>`<span class="marquee-item">${t}</span>`).join('')}</div>`;
    /* Insert after hero */
    const hero=document.querySelector('.hero');
    if(hero&&hero.nextSibling)hero.parentNode.insertBefore(band,hero.nextSibling);
  }

  /* ── 9. CTA BUTTON PULSE ── */
  function initCTAPulse(){
    document.querySelectorAll('.btn-red').forEach((btn,i)=>{
      if(i===0)btn.classList.add('btn-red-pulse');
    });
  }

  /* ── 10. CARD HOVER LIFT (touch-friendly) ── */
  function initCardHover(){
    document.querySelectorAll('.product-card,.step-card,.cat-item,.seller-card').forEach(card=>{
      card.style.transition=(card.style.transition||'')+',transform .3s cubic-bezier(.16,1,.3,1),box-shadow .3s';
      card.addEventListener('mouseenter',()=>{
        card.style.transform='translateY(-6px)';
        card.style.boxShadow='0 20px 40px rgba(0,0,0,.25)';
      });
      card.addEventListener('mouseleave',()=>{
        card.style.transform='';
        card.style.boxShadow='';
      });
    });
  }

  /* ── INIT ── */
  function init(){
    initHeroTitle();
    initParticles();
    initHeroParallax();
    initCursorGlow();
    initScrollReveal();
    initCounters();
    initTitleUnderline();
    initMarquee();
    initCTAPulse();
    /* Card hover needs a slight delay for cards to be in DOM */
    setTimeout(initCardHover,400);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  } else {
    init();
  }

})();
