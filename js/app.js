document.addEventListener('DOMContentLoaded', () => {
    // 1. Splash Screen & Bubbles
    const splash = document.getElementById('splash-screen');
    const bubblesContainer = document.getElementById('bubbles-container');
    
    // Create animated bubbles
    for(let i = 0; i < 15; i++) {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        const size = Math.random() * 40 + 10;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.animationDuration = `${Math.random() * 5 + 3}s`;
        bubble.style.animationDelay = `${Math.random() * 2}s`;
        bubblesContainer.appendChild(bubble);
    }

    setTimeout(() => {
        splash.classList.add('hidden');
    }, 4000);

    // VIP Promo Code randomizer
    const vipSpan = document.getElementById('random-code');
    if (vipSpan) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let rc = '';
        for(let i=0; i<4; i++) {
            rc += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        vipSpan.textContent = rc;
    }

    // --- Save Contact (VCF) Logic ---
    const btnSaveVCard = document.getElementById('btn-save-vcard');
    if(btnSaveVCard) {
        btnSaveVCard.addEventListener('click', () => {
            const vcardData = `BEGIN:VCARD
VERSION:3.0
FN:Bebida Animo
ORG:Bebida Animo
TEL;TYPE=CELL,VOICE:+522299999999
URL:https://vcard-bebida-animo.vercel.app/
NOTE:Tr\u00e1tame con cuidado, t\u00f3mame con ganas. Bebidas preparadas y mixolog\u00eda.
END:VCARD`;
            const blob = new Blob([vcardData], { type: 'text/vcard' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'Bebida_Animo.vcf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            
            // Haptic Feedback
            if ("vibrate" in navigator) navigator.vibrate(50);
            
            // UI Feedback on button
            const originalHTML = btnSaveVCard.innerHTML;
            btnSaveVCard.innerHTML = "<i class='bx bx-check'></i> \u00a1Guardado!";
            btnSaveVCard.style.color = "var(--c-lime)";
            setTimeout(() => {
                btnSaveVCard.innerHTML = originalHTML;
                btnSaveVCard.style.color = "";
            }, 2000);
        });
    }

    // 2. Real-time Branch Status Check
    function checkBranchStatus() {
        const now = new Date();
        const hr = now.getHours();
        const min = now.getMinutes();
        const day = now.getDay(); // 0(Sun) - 6(Sat)

        const timeInMinutes = hr * 60 + min;

        // Pinos: Fri(5) & Sat(6), 19:00 to 23:00 (1140 to 1380 mins)
        const pinosCard = document.getElementById('branch-pinos');
        const pinosStatus = document.getElementById('status-pinos');
        const isPinosOpen = (day === 5 || day === 6) && (timeInMinutes >= 1140 && timeInMinutes < 1380);

        if(isPinosOpen) {
            pinosCard.classList.add('is-open');
            pinosCard.classList.remove('is-closed');
            pinosStatus.textContent = 'ABIERTO AHORA';
            pinosStatus.className = 'status-badge open';
        } else {
            pinosCard.classList.add('is-closed');
            pinosCard.classList.remove('is-open');
            pinosStatus.textContent = 'CERRADO';
            pinosStatus.className = 'status-badge closed';
        }

        // Rio: Sat(6) & Sun(0), 13:00 to 18:00 (780 to 1080 mins)
        const rioCard = document.getElementById('branch-rio');
        const rioStatus = document.getElementById('status-rio');
        const isRioOpen = (day === 6 || day === 0) && (timeInMinutes >= 780 && timeInMinutes < 1080);

        if(isRioOpen) {
            rioCard.classList.add('is-open');
            rioCard.classList.remove('is-closed');
            rioStatus.textContent = 'ABIERTO AHORA';
            rioStatus.className = 'status-badge open';
        } else {
            rioCard.classList.add('is-closed');
            rioCard.classList.remove('is-open');
            rioStatus.textContent = 'CERRADO';
            rioStatus.className = 'status-badge closed';
        }

        // Admin Override Logic
        try {
            const override = localStorage.getItem('bebidaAnimo_override');
            if (override) {
                const data = JSON.parse(override);
                if (data.status === 'closed_today') {
                    // Force Pinos to closed
                    pinosCard.classList.add('is-closed');
                    pinosCard.classList.remove('is-open');
                    pinosStatus.textContent = 'CERRADO POR AVISO';
                    pinosStatus.className = 'status-badge closed';
                    const pinosInfoP = pinosCard.querySelector('.branch-info p');
                    if(pinosInfoP) pinosInfoP.innerHTML = `<i class='bx bx-info-circle'></i> ${data.message || 'Hoy no laboraremos. Gracias.'}`;

                    // Force Rio to closed
                    rioCard.classList.add('is-closed');
                    rioCard.classList.remove('is-open');
                    rioStatus.textContent = 'CERRADO POR AVISO';
                    rioStatus.className = 'status-badge closed';
                    const rioInfoP = rioCard.querySelector('.branch-info p');
                    if(rioInfoP) rioInfoP.innerHTML = `<i class='bx bx-info-circle'></i> ${data.message || 'Hoy no laboraremos. Gracias.'}`;
                }
            }
        } catch(e) {}
    }
    
    checkBranchStatus();
    setInterval(checkBranchStatus, 60000); // Check every minute

    // 3. Drink Builder Logic
    let currentDrink = {
        base: null,
        dulce: [],
        picoso: [],
        sabor: []
    };

    let cart = [];

    // Helper to setup multi-select vs single-select
    function setupGrid(gridId, property, isMulti) {
        const grid = document.getElementById(gridId);
        if(!grid) return;
        const btns = grid.querySelectorAll('.option-btn');
        
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const val = btn.getAttribute('data-value');
                
                if(!isMulti) {
                    // Single select
                    btns.forEach(b => b.classList.remove('active'));
                    if(currentDrink[property] !== val) {
                        btn.classList.add('active');
                        currentDrink[property] = val;
                    } else {
                        currentDrink[property] = null;
                    }
                } else {
                    // Multi select
                    btn.classList.toggle('active');
                    if(btn.classList.contains('active')) {
                        if(!currentDrink[property].includes(val)) currentDrink[property].push(val);
                    } else {
                        currentDrink[property] = currentDrink[property].filter(i => i !== val);
                    }
                }
            });
        });
    }

    setupGrid('grid-base', 'base', false);
    setupGrid('grid-dulce', 'dulce', true);
    setupGrid('grid-picoso', 'picoso', true);
    setupGrid('grid-sabor', 'sabor', true);

    // 4. Cart Logic
    const btnAdd = document.getElementById('btn-add-drink');
    const fabCart = document.getElementById('fab-cart');
    const cartCount = document.getElementById('cart-count');
    const cartModal = document.getElementById('cart-modal');
    const closeCart = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const btnWhatsapp = document.getElementById('btn-whatsapp');
    
    // WhatsApp Phone Number (Placeholders for client adjustment)
    const WA_PHONE = '522299999999'; // <-- REEMPLAZAR CON N\u00daMERO REAL EN ONBOARDING

    function resetBuilder() {
        currentDrink = { base: null, dulce: [], picoso: [], sabor: [] };
        document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
    }

    btnAdd.addEventListener('click', () => {
        if(!currentDrink.base) {
            alert('¡Por favor selecciona al menos una Base para tu bebida!');
            return;
        }

        const drinkCopy = JSON.parse(JSON.stringify(currentDrink));
        cart.push(drinkCopy);
        
        updateCartUI();
        resetBuilder();
        
        // Vibrate if supported
        if("vibrate" in navigator) navigator.vibrate(50);
        
        // Show success animation on button
        const originalText = btnAdd.innerHTML;
        btnAdd.innerHTML = "<i class='bx bx-check'></i> ¡Agregada!";
        btnAdd.style.background = "var(--c-lime)";
        btnAdd.style.color = "var(--bg-dark)";
        setTimeout(() => {
            btnAdd.innerHTML = originalText;
            btnAdd.style.background = "";
            btnAdd.style.color = "";
        }, 1500);
    });

    function updateCartUI() {
        if(cart.length > 0) {
            fabCart.style.display = 'flex';
            cartCount.textContent = cart.length;
        } else {
            fabCart.style.display = 'none';
        }

        cartItemsContainer.innerHTML = '';
        if(cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="cart-empty">Aún no has armado ninguna bebida.</div>';
        } else {
            cart.forEach((item, index) => {
                const el = document.createElement('div');
                el.className = 'cart-item';
                
                let details = [];
                if(item.dulce.length > 0) details.push(`Dulce: ${item.dulce.join(', ')}`);
                if(item.picoso.length > 0) details.push(`Picoso: ${item.picoso.join(', ')}`);
                if(item.sabor.length > 0) details.push(`Sabor: ${item.sabor.join(', ')}`);

                el.innerHTML = `
                    <div style="display:flex; justify-content:space-between;">
                        <div class="cart-item-title">${item.base}</div>
                        <button onclick="removeCartItem(${index})" style="background:none; border:none; color:var(--c-pink); cursor:pointer;"><i class='bx bx-trash'></i></button>
                    </div>
                    <div class="cart-item-details">${details.length > 0 ? details.join('<br>') : 'Sin toppings extra'}</div>
                `;
                cartItemsContainer.appendChild(el);
            });
        }
    }

    // Assign to window for inline onclick
    window.removeCartItem = function(index) {
        cart.splice(index, 1);
        updateCartUI();
    };

    fabCart.addEventListener('click', () => {
        cartModal.classList.add('active');
    });

    closeCart.addEventListener('click', () => {
        cartModal.classList.remove('active');
    });

    // Generate WhatsApp Message (SIMULATION)
    btnWhatsapp.addEventListener('click', (e) => {
        e.preventDefault();
        
        if(cart.length === 0) {
            alert('Agrega bebidas a tu pedido primero.');
            return;
        }

        let msg = `SIMULACIÓN DE TICKET\n=========================\n\nCuando estemos en horario de servicio, enviarías un mensaje con este pedido:\n\n`;
        msg += `*¡Hola Bebida Animo!* 👋 Quisiera realizar el siguiente pedido armado desde su VCard:\n\n`;
        
        cart.forEach((item, index) => {
            msg += `🍹 *Bebida ${index + 1}: ${item.base.toUpperCase()}*\n`;
            if(item.dulce.length) msg += `   🍬 Dulces: ${item.dulce.join(', ')}\n`;
            if(item.picoso.length) msg += `   🌶️ Picositos: ${item.picoso.join(', ')}\n`;
            if(item.sabor.length) msg += `   ✨ Sabor: ${item.sabor.join(', ')}\n`;
            msg += `\n`;
        });

        msg += `--- \n`;
        msg += `¿Podrían confirmarme disponibilidad y tiempo de entrega? ¡Gracias! 😊\n\n`;
        msg += `=========================\n(Nota: Esta es solo una simulación de prueba para armar tu bebida. Para comprar, te esperamos en nuestras sucursales o envía el mensaje manualmente.)`;

        alert(msg);
    });

});
