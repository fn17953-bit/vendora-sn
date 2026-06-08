const Auth = {
  loginSeller(email,password){
    const u=DB.getUserByEmail(email);
    if(!u)return{error:'Aucun compte trouvé avec cet email.'};
    if(u.password!==password)return{error:'Mot de passe incorrect.'};
    if(u.role==='seller'&&u.status==='suspended')return{error:'Votre compte est suspendu. Contactez l\'admin.'};
    DB.setCurrentUser({id:u.id,name:u.name,email:u.email,role:u.role,phone:u.phone});
    return{user:u};
  },
  registerSeller(data){
    if(!data.name||!data.email||!data.password||!data.phone)return{error:'Tous les champs sont requis.'};
    if(data.password.length<6)return{error:'Mot de passe min. 6 caractères.'};
    if(!data.paymentMethods||!data.paymentMethods.length)return{error:'Choisissez au moins un moyen de paiement.'};
    const r=DB.createSeller(data);
    if(r.error)return r;
    DB.setCurrentUser({id:r.id,name:r.name,email:r.email,role:r.role,phone:r.phone});
    return{user:r};
  },
  logout(){ DB.logout(); const inSub=window.location.pathname.includes('/vendor/')||window.location.pathname.includes('/admin/'); window.location.href=inSub?'../index.html':'index.html'; },
  getCurrentUser(){ return DB.getCurrentUser(); },
  isAdmin(){ const u=DB.getCurrentUser();return u&&u.role==='admin'; },
  isSeller(){ const u=DB.getCurrentUser();return u&&u.role==='seller'; },
  isLoggedIn(){ return !!DB.getCurrentUser(); },
  requireAdmin(){ if(!this.isAdmin()){window.location.href='../connexion-vendeur.html';return false;}return true; },
  requireSeller(){ if(!this.isSeller()&&!this.isAdmin()){window.location.href='../connexion-vendeur.html';return false;}return true; }
};
