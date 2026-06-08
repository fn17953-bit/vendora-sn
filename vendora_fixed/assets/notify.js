/* ============================================================
   Vendora-sn MARKETPLACE — Notifications vendeur
   ============================================================ */
const Notify = {

  // WhatsApp auto au vendeur
  notifySellerWhatsApp(order, seller, product) {
    if (!seller?.whatsapp && !seller?.phone) return;
    const number = (seller.whatsapp || seller.phone).replace(/\D/g,'');
    const PAY = {wave:'Wave 🌊', orange:'Orange Money 🟠', livraison:'À la livraison 🚚'};
    const msg =
      `🔔 *NOUVELLE COMMANDE — ${order.ref}*\n\n`+
      `Votre article a été commandé !\n\n`+
      `🛍 *Article :* ${product.name}\n`+
      `💰 *Prix :* ${parseInt(product.price).toLocaleString('fr-FR')} FCFA\n\n`+
      `👤 *Acheteur :* ${order.firstName} ${order.lastName}\n`+
      `📞 *Tél :* ${order.phone}\n`+
      `📍 *Livraison :* ${order.address}, ${order.city}\n`+
      `💳 *Paiement :* ${PAY[order.payment]||order.payment}\n\n`+
      `🕐 ${new Date(order.createdAt).toLocaleString('fr-FR')}\n\n`+
      `Connectez-vous sur Vendora-sn pour confirmer la commande.`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`, '_blank');
  },

  // Email au vendeur via EmailJS
  async notifySellerEmail(order, seller, product) {
    if (!seller?.email || CONFIG.EMAILJS_TEMPLATE_ID === 'template_bs6r24v') {
      // Use EmailJS
    }
    try {
      await emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_ID, {
        to_email: seller.email,
        email: seller.email,
        order_ref: order.ref,
        customer_name: `${order.firstName} ${order.lastName}`,
        customer_phone: order.phone,
        customer_email: order.email || '—',
        city: order.city,
        address: order.address,
        payment_method: order.payment,
        items_list: product.name + ' — ' + parseInt(product.price).toLocaleString('fr-FR') + ' FCFA',
        total: parseInt(order.total).toLocaleString('fr-FR') + ' FCFA',
        order_date: new Date(order.createdAt).toLocaleString('fr-FR'),
        note: order.note || '—',
        shop_name: 'Vendora-sn',
      }, CONFIG.EMAILJS_PUBLIC_KEY);
    } catch(e) { console.warn('Email seller failed:', e); }
  },

  // Notifier le vendeur (WhatsApp + email + notification interne)
  async notifyNewOrder(order, seller, product) {
    // Notification interne dans la DB
    DB.addNotification(seller.id,
      `Nouvelle commande ${order.ref} pour "${product.name}" — ${parseInt(order.total).toLocaleString('fr-FR')} FCFA`,
      'order'
    );
    // WhatsApp
    this.notifySellerWhatsApp(order, seller, product);
    // Email
    await this.notifySellerEmail(order, seller, product);
  }
};
