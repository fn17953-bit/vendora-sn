function loadAdminSidebar(active){
  const el=document.getElementById('admin-sidebar-placeholder');if(!el)return;
  const pendingOrders=DB.getOrders().filter(o=>o.status==='pending').length;
  const pendingPay=DB.getAllProducts().filter(p=>p.status==='pending_payment').length;
  el.innerHTML=`<aside class="admin-sidebar">
    <div class="admin-brand">
      <h2>VENDORA<span>-SN</span></h2>
      <p>Marketplace Admin</p>
    </div>
    <nav class="admin-nav-links">
      <a href="dashboard.html" class="${active==='dashboard'?'active':''}"><span class="nav-icon">◎</span>Dashboard</a>
      <a href="articles.html" class="${active==='articles'?'active':''}"><span class="nav-icon">📦</span>Articles ${pendingPay>0?`<span class="new-badge" style="background:var(--gold)">${pendingPay}</span>`:''}</a>
      <a href="vendeurs.html" class="${active==='vendeurs'?'active':''}"><span class="nav-icon">👥</span>Vendeurs</a>
      <a href="commandes.html" class="${active==='commandes'?'active':''}"><span class="nav-icon">🛒</span>Commandes ${pendingOrders>0?`<span class="new-badge">${pendingOrders}</span>`:''}</a>
    </nav>
    <div class="admin-bottom">
      <a href="../index.html" class="btn-outline" style="display:block;text-align:center;font-size:.62rem;padding:.38rem;margin-bottom:.45rem">Voir la boutique</a>
      <button onclick="Auth.logout()" class="btn-danger" style="width:100%;font-size:.62rem;padding:.45rem">Déconnexion</button>
    </div>
  </aside>`;
}
