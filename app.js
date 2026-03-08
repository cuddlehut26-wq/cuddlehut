// --- 1. FIREBASE ZERO-COST ENGINE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDocs, collection, getDoc, addDoc, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyANIANj7W4Ai3IK1xwjT5MqA504Uv94NfE",
  authDomain: "cuddlehut-ab989.firebaseapp.com",
  projectId: "cuddlehut-ab989",
  storageBucket: "cuddlehut-ab989.firebasestorage.app",
  messagingSenderId: "421166411406",
  appId: "1:421166411406:web:a67acdec70634ea198a3df"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- 2. GLOBAL CART SYSTEM ---
window.cart = JSON.parse(sessionStorage.getItem('cuddleHutCart')) || [];

window.updateCart = () => {
  sessionStorage.setItem('cuddleHutCart', JSON.stringify(window.cart));
  
  const cartCountNav = document.getElementById('cart-count');
  const totalItems = window.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  if (cartCountNav) cartCountNav.innerText = totalItems;

  const cartTotal = document.getElementById('cart-total');
  const cartItemsContainer = document.getElementById('cart-items');

  if (cartItemsContainer) {
    cartItemsContainer.innerHTML = '';
    let total = 0;
    
    if (window.cart.length === 0) {
      cartItemsContainer.innerHTML = '<p style="text-align:center; margin-top:20px;">Your cart is empty.</p>';
    } else {
      window.cart.forEach((item, index) => {
        const qty = item.quantity || 1;
        total += item.price * qty;
        
        const imgHtml = item.image 
          ? `<img src="${item.image}" style="width: 55px; height: 55px; object-fit: cover; border-radius: 6px; border: 1px solid #eee;">` 
          : `<div style="width: 55px; height: 55px; background: #eee; border-radius: 6px;"></div>`;
        
        cartItemsContainer.innerHTML += `
          <div style="background: var(--white); padding: 12px; border-radius: 8px; display: flex; gap: 12px; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.03); margin-bottom: 10px;">
            ${imgHtml}
            <div style="flex: 1;">
              <h4 style="font-size:0.85rem; color: var(--dmc-3021); margin-bottom: 3px; line-height: 1.2;">${item.name}</h4>
              <p style="color: var(--dmc-976); font-weight:bold; margin: 0; font-size: 0.9rem;">PKR ${(item.price * qty).toFixed(2)}</p>
            </div>
            
            <div style="display: flex; align-items: center; gap: 8px; background: #f9f9f9; padding: 4px; border-radius: 6px; border: 1px solid #eee;">
              <button onclick="window.changeQuantity(${index}, -1)" style="padding: 2px 8px; font-size: 1.1rem; border: none; background: transparent; cursor: pointer; color: var(--dmc-3021);">-</button>
              <span style="font-weight: bold; font-size: 0.9rem; width: 15px; text-align: center;">${qty}</span>
              <button onclick="window.changeQuantity(${index}, 1)" style="padding: 2px 8px; font-size: 1.1rem; border: none; background: transparent; cursor: pointer; color: var(--dmc-3021);">+</button>
            </div>
          </div>
        `;
      });
    }
    if (cartTotal) cartTotal.innerText = total.toFixed(2);
  }
};

window.removeFromCart = (index) => {
  window.cart.splice(index, 1);
  window.updateCart();
};

window.changeQuantity = (index, delta) => {
  if (!window.cart[index].quantity) window.cart[index].quantity = 1;
  window.cart[index].quantity += delta;
  
  if (window.cart[index].quantity <= 0) {
    window.removeFromCart(index);
  } else {
    window.updateCart();
  }
};

window.addToCart = (id, name, price, image) => {
  const existingIndex = window.cart.findIndex(item => item.id === id && item.name === name);
  
  if (existingIndex > -1) {
    window.cart[existingIndex].quantity = (window.cart[existingIndex].quantity || 1) + 1;
  } else {
    window.cart.push({ id, name, price: parseFloat(price), quantity: 1, image: image });
  }
  
  window.updateCart();
  const cartSidebar = document.getElementById('cart-sidebar');
  if(cartSidebar) cartSidebar.classList.add('cart-open');
};

// --- 3. DYNAMIC NAVIGATION & FULLSCREEN MENU ---
if (!document.getElementById('fs-menu')) {
    const menuHtml = `
      <div id="fs-menu" class="fs-menu">
        <div class="fs-menu-header">
          <h2>Navigation</h2>
          <button id="fs-close" style="background:none; border:none; font-size:2rem; color:var(--dmc-3021); cursor:pointer; padding:0;">✕</button>
        </div>
        <div class="fs-menu-body">
           <div class="fs-col">
             <h3>Shop</h3>
             <a href="shop.html">All Products</a>
             <a href="shop.html?category=new-arrivals">New Arrivals</a>
             <a href="shop.html?category=best-sellers">Best Sellers</a>
           </div>
           <div class="fs-col">
             <h3>Cat</h3>
             <a href="shop.html?category=cat-food">Food</a>
             <a href="shop.html?category=cat-accessories">Accessories</a>
             <a href="shop.html?category=cat-litter">Litter</a>
             <a href="shop.html?category=cat-toys">Toys</a>
           </div>
           <div class="fs-col">
             <h3>Dog</h3>
             <a href="shop.html?category=dog-food">Food</a>
             <a href="shop.html?category=dog-accessories">Accessories</a>
             <a href="shop.html?category=dog-toys">Toys</a>
           </div>
           <div class="fs-col">
             <h3>Bird</h3>
             <a href="shop.html?category=bird-food">Food</a>
             <a href="shop.html?category=bird-accessories">Accessories</a>
             <a href="shop.html?category=bird-toys">Toys</a>
           </div>
           <div class="fs-col">
             <h3>Grooming</h3>
             <a href="shop.html?category=cat-grooming">Cat Grooming</a>
             <a href="shop.html?category=dog-grooming">Dog Grooming</a>
             <a href="shop.html?category=bird-grooming">Bird Grooming</a>
           </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', menuHtml);
    
    document.getElementById('fs-close').addEventListener('click', () => {
        document.getElementById('fs-menu').classList.remove('open');
    });
}

onAuthStateChanged(auth, (user) => {
  const navContainer = document.getElementById('dynamic-nav');
  if (navContainer) {
    if (user) {
      if (user.email === "cuddlehut26@gmail.com") {
        navContainer.innerHTML = `
          <a href="shop.html">Shop</a>
          <a href="admin.html" style="color: var(--dmc-976);">Command</a>
          <a href="#" id="global-logout" style="color: #a93226;">Sign Out</a>
        `;
      } else {
        navContainer.innerHTML = `
          <a href="shop.html">Shop</a>
          <a href="#" id="cart-toggle" style="color: var(--dmc-976);">Cart (<span id="cart-count">0</span>)</a>
          <a href="#" id="global-logout" style="color: #a93226;">Sign Out</a>
        `;
        const cartToggleBtn = document.getElementById('cart-toggle');
        const cartSidebarBox = document.getElementById('cart-sidebar');
        if (cartToggleBtn && cartSidebarBox) {
          cartToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            cartSidebarBox.classList.add('cart-open');
          });
        }
      }
      document.getElementById('global-logout').addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth).then(() => { window.location.href = "index.html"; });
      });
    } else {
      navContainer.innerHTML = `
        <a href="shop.html">Shop</a>
        <a href="#" id="cart-toggle" style="color: var(--dmc-976);">Cart (<span id="cart-count">0</span>)</a>
        <a href="login.html">Sign In</a>
        <a href="signup.html" style="color: var(--dmc-976);">Join</a>
      `;
      const cartToggleBtn = document.getElementById('cart-toggle');
      const cartSidebarBox = document.getElementById('cart-sidebar');
      if (cartToggleBtn && cartSidebarBox) {
        cartToggleBtn.addEventListener('click', (e) => {
          e.preventDefault();
          cartSidebarBox.classList.add('cart-open');
        });
      }
    }

    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.getElementById('fs-menu').classList.add('open');
        });
    }

    window.updateCart();
  }
});

// --- 4. DOM LOADED EVENT LISTENERS & ANIMATIONS ---
const initCuddleHut = () => {

  const closeCart = document.getElementById('close-cart');
  const cartSidebar = document.getElementById('cart-sidebar');
  if (closeCart && cartSidebar) {
    closeCart.addEventListener('click', () => { cartSidebar.classList.remove('cart-open'); });
  }

  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (window.cart.length === 0) return alert("Your cart is empty.");
      window.location.href = "checkout.html";
    });
  }

  const checkoutForm = document.getElementById('checkout-form');
  const checkoutItems = document.getElementById('checkout-items');
  const checkoutTotal = document.getElementById('checkout-total');

  if (checkoutForm && checkoutItems && checkoutTotal) {
    if (window.cart.length === 0) {
      window.location.href = "shop.html";
    }

    let cartSum = 0;
    window.cart.forEach(item => { cartSum += (item.price * (item.quantity || 1)); });

    const calcShipping = (total, method) => {
        if (method !== 'cod') return 0;
        if (total <= 1000) return 200;
        if (total <= 5000) return 300;
        if (total <= 10000) return 500;
        if (total <= 30000) return 2000;
        return 0; 
    };

    const updateCheckoutDisplay = () => {
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        const shippingFee = calcShipping(cartSum, paymentMethod);
        const finalTotal = cartSum + shippingFee;

        checkoutItems.innerHTML = window.cart.map(item => {
          const qty = item.quantity || 1;
          return `
          <div style="display:flex; justify-content:space-between; margin-bottom: 10px;">
            <span style="color: var(--dmc-3021);">${qty}x ${item.name}</span>
            <span style="color: var(--dmc-976); font-weight:bold;">PKR ${(item.price * qty).toFixed(2)}</span>
          </div>
          `;
        }).join('') + `
          <div style="display:flex; justify-content:space-between; margin-top: 15px; padding-top: 15px; border-top: 1px dashed #ccc;">
            <span>Shipping Fee (${paymentMethod === 'cod' ? 'COD' : 'Bank'}):</span>
            <span style="color: #a93226; font-weight:bold;">+ PKR ${shippingFee.toFixed(2)}</span>
          </div>
        `;
        checkoutTotal.innerText = finalTotal.toFixed(2);
        return { finalTotal, shippingFee };
    };

    updateCheckoutDisplay();

    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateCheckoutDisplay();
            const bankTransferDiv = document.getElementById('bank-transfer-details');
            if(bankTransferDiv) bankTransferDiv.style.display = e.target.value === 'transfer' ? 'block' : 'none';
        });
    });

    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = checkoutForm.querySelector('button');
      btn.innerText = "Processing...";

      const orderId = "CH-" + Math.floor(10000 + Math.random() * 90000);
      const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
      const { finalTotal, shippingFee } = updateCheckoutDisplay();

      const orderData = {
        orderId: orderId,
        customerName: document.getElementById('chk-name').value,
        phone: document.getElementById('chk-phone').value,
        email: document.getElementById('chk-email').value,
        address: document.getElementById('chk-address').value,
        city: document.getElementById('chk-city').value,
        items: window.cart,
        shippingCost: shippingFee,
        totalAmount: finalTotal,
        paymentMethod: paymentMethod,
        status: paymentMethod === 'cod' ? 'Pending Dispatch' : 'Pending Verification',
        createdAt: new Date().toISOString()
      };

      try {
        await addDoc(collection(db, "orders"), orderData);

        const templateParams = {
            order_id: orderId,
            to_email: 'cuddlehut26@gmail.com',
            customer_name: orderData.customerName,
            customer_email: orderData.email,
            customer_phone: orderData.phone,
            delivery_address: `${orderData.address}, ${orderData.city}`,
            payment_type: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Bank Transfer / EasyPaisa',
            order_total: `PKR ${finalTotal.toFixed(2)}`,
            order_items: window.cart.map(item => `${item.quantity || 1}x ${item.name}`).join(", ")
        };

        try { await window.emailjs.send("service_bd7ogeb", "template_q0kyhrg", templateParams); } 
        catch (emailError) { console.error("Email sending failed, but order was placed.", emailError); }

        sessionStorage.removeItem('cuddleHutCart');
        window.cart = [];

        if (paymentMethod === 'cod') {
          alert(`Order Confirmed! Your Order ID is ${orderId}. We will dispatch it shortly.`);
          window.location.href = "shop.html";
        } else {
          const businessPhone = "923423787505"; 
          const msg = encodeURIComponent(`Hello Cuddle Hut! My Order ID is ${orderId}. My total is PKR ${finalTotal.toFixed(2)}. Here is my payment screenshot:`);
          alert("Order logged! Redirecting to WhatsApp to send your payment screenshot.");
          window.location.href = `https://api.whatsapp.com/send?phone=${businessPhone}&text=${msg}`;
        }
      } catch (error) {
        btn.innerText = "Confirm Order";
        alert("Checkout Failed: " + error.message);
      }
    });
  }

  // --- SHOP GRID ---
  const productGrid = document.getElementById('product-grid');
  if (productGrid) {
    async function loadShop(searchTerm = "", sortOption = "default") {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const categoryFilter = urlParams.get('category');
        const groupFilter = urlParams.get('group');
        const brandFilter = urlParams.get('brand');

        // Brand Banner Injection
        const brandBannerContainer = document.getElementById('active-brand-banner');
        if (brandBannerContainer) {
            if (brandFilter) {
                const brandLogos = {
                    "Reflex": "ReflexLogo.svg",
                    "Petso": "Petso.jpg",
                    "Nutripaw": "NutriPawsLogo.avif",
                    "Crunchy": "crunchy.jpg",
                    "NourVet": "NourvetLogo.jpg",
                    "Petline": "petline.png",
                    "Diamond Naturals": "Diamond-Logo_rev-1.webp",
                    "Klumpy": "KlumpyLogo.png"
                };
                
                if (brandLogos[brandFilter]) {
                    document.getElementById('active-brand-img').src = brandLogos[brandFilter];
                    document.getElementById('active-brand-img').style.display = 'inline-block';
                } else {
                    document.getElementById('active-brand-img').style.display = 'none';
                }
                document.getElementById('active-brand-name').innerText = `Shop ${brandFilter}`;
                brandBannerContainer.style.display = 'block';
            } else {
                brandBannerContainer.style.display = 'none';
            }
        }

        let productsQuery;
        // Ignore "new-arrivals" and "best-sellers" when querying categories, filter them locally instead
        if (categoryFilter && categoryFilter !== 'new-arrivals' && categoryFilter !== 'best-sellers') {
          productsQuery = query(collection(db, "products"), where("category", "==", categoryFilter));
        } else {
          productsQuery = collection(db, "products");
        }

        const querySnapshot = await getDocs(productsQuery);
        const reviewsSnapshot = await getDocs(collection(db, "reviews"));
        
        const allReviews = [];
        reviewsSnapshot.forEach(doc => allReviews.push(doc.data()));

        let productsList = [];
        if (querySnapshot.empty) {
          productGrid.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1 / -1;">Inventory is currently empty.</p>';
          return;
        }

        querySnapshot.forEach((docSnap) => {
          if (docSnap.id === "--STORE-SETTINGS--") return; // FIX: Prevent the shop from crashing by skipping the settings document

          const p = docSnap.data();
          p.id = docSnap.id;

          // 1. Checkbox Tag Filters
          if (categoryFilter === 'new-arrivals' && !p.isNewArrival) return;
          if (categoryFilter === 'best-sellers' && !p.isBestSeller) return;
          
          // 2. Index Card Group Filters (Looks at productType directly)
          if (groupFilter) {
            const typeString = p.productType || p.category || "";
            if (!typeString.toLowerCase().includes(groupFilter.toLowerCase())) {
              return; 
            }
          }
          
          // 3. Brand Filter from URL
          if (brandFilter && p.brand !== brandFilter) return;

          // 4. Search Bar Filters
          if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            const matchName = p.name ? p.name.toLowerCase().includes(lowerSearch) : false;
            const matchDesc = p.description ? p.description.toLowerCase().includes(lowerSearch) : false;
            const matchSeo = p.seo ? p.seo.toLowerCase().includes(lowerSearch) : false;
            const matchBrand = p.brand ? p.brand.toLowerCase().includes(lowerSearch) : false;
            if (!matchName && !matchDesc && !matchSeo && !matchBrand) return; 
          }

          p.finalPrice = p.discount > 0 ? p.price - (p.price * (p.discount / 100)) : p.price;
          const pReviews = allReviews.filter(r => r.productId === p.id);
          p.reviewCount = pReviews.length;
          p.avgRating = 0;
          if (p.reviewCount > 0) {
              p.avgRating = parseFloat((pReviews.reduce((sum, r) => sum + r.rating, 0) / p.reviewCount).toFixed(1));
          }
          productsList.push(p);
        });

        if (sortOption === "price-asc") productsList.sort((a, b) => a.finalPrice - b.finalPrice);
        else if (sortOption === "price-desc") productsList.sort((a, b) => b.finalPrice - a.finalPrice);
        else if (sortOption === "rating-desc") productsList.sort((a, b) => b.avgRating - a.avgRating);

        productGrid.innerHTML = ''; 

        if (productsList.length === 0) {
           productGrid.innerHTML = `<p style="text-align: center; width: 100%; grid-column: 1 / -1; font-size: 1.1rem; color: #666;">No products found matching your selection.</p>`;
           return;
        }

        productsList.forEach(p => {
          let starHtml = `<div style="color: #ccc; font-size: 0.9rem; margin: 5px 0;">☆ No reviews</div>`;
          if (p.reviewCount > 0) {
              starHtml = `<div style="color: var(--dmc-976); font-size: 0.95rem; margin: 5px 0; font-weight: bold;">★ ${p.avgRating} <span style="color:#888; font-weight:normal;">(${p.reviewCount})</span></div>`;
          }

          let priceHtml = `<h3 style="color: var(--dmc-3021); margin: 10px 0 15px;">PKR ${p.price.toFixed(2)}</h3>`;
          if (p.discount && p.discount > 0) {
            priceHtml = `
              <div style="margin: 10px 0 15px;">
                <span style="text-decoration: line-through; color: #999; font-size: 0.9em; margin-right: 10px;">PKR ${p.price.toFixed(2)}</span>
                <h3 style="color: var(--dmc-976); display: inline;">PKR ${p.finalPrice.toFixed(2)}</h3>
              </div>
            `;
          }

          const displayImage = p.images && p.images.length > 0 ? p.images[0] : (p.image || "https://via.placeholder.com/400");
          productGrid.innerHTML += `
            <a href="product.html?id=${p.id}" class="premium-card interactive-card product-card">
              <img src="${displayImage}" class="card-img" alt="${p.name}">
              <div class="card-content">
                <h2 style="font-size: 1.2rem; color: var(--dmc-3021); margin-bottom: 5px;">${p.name}</h2>
                <small style="color:gray;">${p.brand || ''}</small>
                ${starHtml}
                ${priceHtml}
                <button class="btn" style="width: 100%; font-size: 0.9rem; padding: 12px;">View Details</button>
              </div>
            </a>
          `;
        });
      } catch (error) { console.error(error); }
    }
    
    loadShop();

    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const sortSelect = document.getElementById('sort-select');

    const updateFilters = () => {
        const term = searchInput ? searchInput.value.trim() : "";
        const sortMode = sortSelect ? sortSelect.value : "default";
        loadShop(term, sortMode);
    };

    if (searchInput && searchBtn) {
      searchBtn.addEventListener('click', updateFilters);
      searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') updateFilters(); });
    }
    if (sortSelect) sortSelect.addEventListener('change', updateFilters);
  }

  // --- SINGLE PRODUCT & VARIATIONS ---
  const singleProductContainer = document.getElementById('single-product-container');
  if (singleProductContainer) {
    async function loadSingleProduct() {
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get('id');

      if (!productId) {
        singleProductContainer.innerHTML = "<h2>Product not found.</h2>";
        return;
      }

      try {
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const p = docSnap.data();
          let finalPrice = p.price;
          
          if (p.discount && p.discount > 0) {
            finalPrice = p.price - (p.price * (p.discount / 100));
          }

          const imageArray = p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : ["https://via.placeholder.com/400"]);
          const mainImage = imageArray[0];
          
          let thumbnailGallery = "";
          if (imageArray.length > 1) {
              thumbnailGallery = `<div style="display:flex; gap:10px; margin-top:15px; overflow-x:auto;">` + 
                imageArray.map(img => `<img src="${img}" onclick="document.getElementById('main-product-image').src='${img}'" style="width:70px; height:70px; object-fit:cover; border-radius:8px; cursor:pointer; border:2px solid transparent;" onmouseover="this.style.borderColor='var(--dmc-976)'" onmouseout="this.style.borderColor='transparent'">`).join('') +
              `</div>`;
          }

          // Generate Colors HTML
          let colorHtml = "";
          window.selectedColor = null;
          if (p.colors && p.colors.length > 0) {
              window.selectedColor = typeof p.colors[0] === 'object' ? p.colors[0].name : p.colors[0]; 
              colorHtml = `
                <label style="display:block; margin-bottom: 5px; font-weight: bold; color: #555;">Select Color:</label>
                <div style="display:flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                  ${p.colors.map((c, i) => {
                    const cName = typeof c === 'object' ? c.name : c;
                    return `
                    <div class="color-option" data-color="${cName}" 
                         style="padding: 10px 18px; border-radius: 8px; border: 2px solid ${i === 0 ? 'var(--dmc-976)' : '#ccc'}; cursor: pointer; font-weight: bold; background: var(--white); color: var(--dmc-3021); transition: all 0.3s ease;" 
                         onclick="document.querySelectorAll('.color-option').forEach(el=>el.style.borderColor='#ccc'); this.style.borderColor='var(--dmc-976)'; window.selectedColor = '${cName}';">
                         ${cName}
                    </div>
                  `}).join('')}
                </div>
              `;
          }

          // Generate Variations HTML
          let variationHtml = "";
          if (p.variations && p.variations.length > 0) {
              variationHtml = `
                <select id="variation-select" style="padding: 12px; margin-bottom: 20px; width: 100%; border-radius: 8px; border: 1px solid #ccc; font-family:'Montserrat'; cursor: pointer;">
                  <option value="${finalPrice}" data-name="${p.name.replace(/'/g, "\\'")}">Standard Base - PKR ${finalPrice.toFixed(2)}</option>
                  ${p.variations.map(v => {
                      // FIX: Apply the product's discount percentage to the variation prices too
                      let vFinalPrice = v.price;
                      if (p.discount && p.discount > 0) {
                          vFinalPrice = v.price - (v.price * (p.discount / 100));
                      }
                      return `<option value="${vFinalPrice}" data-name="${p.name.replace(/'/g, "\\'")} (${v.name})">${v.name} - PKR ${vFinalPrice.toFixed(2)}</option>`;
                  }).join('')}
                </select>
              `;
          }

          singleProductContainer.innerHTML = `
            <div class="product-image-col">
              <img src="${mainImage}" id="main-product-image" alt="${p.name}" style="transition: opacity 0.3s ease;">
              ${thumbnailGallery}
            </div>
            <div class="product-info-col">
              <div class="badge">${(p.category || 'Product').replace('-', ' ')}</div>
              <h1 style="font-size: 3rem; color: var(--dmc-3021); margin-bottom: 5px;">${p.name}</h1>
              ${p.brand ? `<h3 style="color: var(--dmc-976); margin-bottom: 15px; font-weight: normal;">${p.brand}</h3>` : ''}
              <p style="font-size: 1.1rem; line-height: 1.8; color: #555;">${p.description}</p>
              
              <div style="margin: 20px 0 30px;">
                ${p.discount > 0 ? `<span style="text-decoration: line-through; color: #999; font-size: 1.5rem; margin-right: 15px;">PKR ${p.price.toFixed(2)}</span>` : ''}
                <h2 id="dynamic-price-display" style="color: var(--dmc-976); display: inline; font-size: 2.5rem;">PKR ${finalPrice.toFixed(2)}</h2>
              </div>

              ${colorHtml}
              ${variationHtml}
              
              <button id="add-to-cart-dynamic-btn" class="btn" style="width: 100%; padding: 20px; font-size: 1.2rem;">Add to Collection</button>
            </div>
          `;

          document.getElementById('add-to-cart-dynamic-btn').addEventListener('click', () => {
              const varSelect = document.getElementById('variation-select');
              let finalName = p.name;
              let finalPriceToAdd = finalPrice;
              
              if(varSelect) {
                  const selectedOpt = varSelect.options[varSelect.selectedIndex];
                  finalName = selectedOpt.dataset.name;
                  finalPriceToAdd = selectedOpt.value;
              }
              
              if (window.selectedColor) {
                  finalName += ` - ${window.selectedColor}`;
              }
              
              window.addToCart(docSnap.id, finalName, finalPriceToAdd, mainImage);
          });

          const varSelectEl = document.getElementById('variation-select');
          if(varSelectEl) {
              varSelectEl.addEventListener('change', (e) => {
                  document.getElementById('dynamic-price-display').innerText = `PKR ${parseFloat(e.target.value).toFixed(2)}`;
              });
          }

          const reviewsSnap = await getDocs(collection(db, "reviews"));
          let productReviews = [];
          let totalStars = 0;
          let allReviews = [];

          reviewsSnap.forEach(doc => {
              const data = doc.data();
              allReviews.push(data);
              if(data.productId === productId) {
                  productReviews.push(data);
                  totalStars += data.rating;
              }
          });
          
          const reviewsList = document.getElementById('reviews-list');
          const avgContainer = document.getElementById('product-average-rating');
          
          if (productReviews.length > 0) {
              const avgRating = (totalStars / productReviews.length).toFixed(1);
              avgContainer.innerHTML = `★ ${avgRating} out of 5 <span style="color:#888; font-size: 1rem; font-weight: normal;">(${productReviews.length} reviews)</span>`;
              
              reviewsList.innerHTML = productReviews.map(r => `
                  <div class="review-card">
                      <div style="color: var(--dmc-976); font-size: 1.2rem; margin-bottom: 5px;">${'★'.repeat(r.rating)}${'<span style="color:#ccc;">★</span>'.repeat(5 - r.rating)}</div>
                      <p style="font-weight: bold; margin-bottom: 5px;">${r.userName}</p>
                      <p style="color: #555; font-size: 0.95rem; line-height: 1.5;">${r.text}</p>
                      <small style="color: #999; display:block; margin-top: 10px;">${new Date(r.createdAt).toLocaleDateString()}</small>
                  </div>
              `).join('');
          } else {
              avgContainer.innerHTML = `☆ No reviews yet`;
              reviewsList.innerHTML = `<p style="color: #666;">Be the first to review this product!</p>`;
          }

          onAuthStateChanged(auth, async (user) => {
              const formContainer = document.getElementById('review-form-container');
              const loginMsg = document.getElementById('review-login-msg');
              
              if (user && user.email !== "cuddlehut26@gmail.com") {
                  const q = query(collection(db, "orders"), where("email", "==", user.email));
                  const ordersSnap = await getDocs(q);
                  
                  let isEligible = false;
                  let hasReviewed = productReviews.some(r => r.userEmail === user.email);
                  
                  if (!hasReviewed) {
                      ordersSnap.forEach(oDoc => {
                          const o = oDoc.data();
                          if (o.status === "Fulfilled") {
                              if (o.items.some(i => i.id === productId)) {
                                  isEligible = true;
                              }
                          }
                      });
                  }
                  
                  if (isEligible) {
                      loginMsg.style.display = 'none';
                      formContainer.style.display = 'block';
                      
                      const reviewForm = document.getElementById('submit-review-form');
                      reviewForm.addEventListener('submit', async (e) => {
                          e.preventDefault();
                          const btn = reviewForm.querySelector('button');
                          btn.innerText = "Submitting...";
                          btn.disabled = true;
                          
                          const rating = parseInt(document.querySelector('input[name="rating"]:checked').value);
                          const text = document.getElementById('review-text').value;
                          const userDoc = await getDoc(doc(db, "users", user.uid));
                          const userName = userDoc.exists() ? userDoc.data().fullName : "Verified Customer";
                          
                          await addDoc(collection(db, "reviews"), {
                              productId: productId, userEmail: user.email, userName: userName,
                              rating: rating, text: text, createdAt: new Date().toISOString()
                          });
                          
                          alert("Review submitted successfully! Thank you for your feedback.");
                          window.location.reload();
                      });
                  } else if (hasReviewed) {
                      loginMsg.innerHTML = "You have already reviewed this product. Thank you!";
                      loginMsg.style.display = 'block';
                  } else {
                      loginMsg.style.display = 'block';
                  }
              } else if (!user) {
                  loginMsg.style.display = 'block';
              }
          });

          const relatedWrapper = document.getElementById('related-section-wrapper');
          const relatedGrid = document.getElementById('related-product-grid');
          if (relatedWrapper && relatedGrid) {
             const allProductsSnap = await getDocs(collection(db, "products"));
             let otherProducts = [];
             allProductsSnap.forEach(snap => { if(snap.id !== productId && snap.id !== "--STORE-SETTINGS--") otherProducts.push({ id: snap.id, ...snap.data() }); });

             otherProducts.sort((a, b) => {
                 if(a.category === p.category && b.category !== p.category) return -1;
                 if(a.category !== p.category && b.category === p.category) return 1;
                 return 0;
             });

             const relatedToDisplay = otherProducts.slice(0, 4);
             if (relatedToDisplay.length > 0) {
                 relatedWrapper.style.display = 'block'; 
                 relatedGrid.innerHTML = '';
                 relatedToDisplay.forEach(rp => {
                     let relFinalPrice = rp.discount > 0 ? rp.price - (rp.price * (rp.discount / 100)) : rp.price;
                     const relReviews = allReviews.filter(r => r.productId === rp.id);
                     let relStarHtml = `<div style="color: #ccc; font-size: 0.9rem; margin: 5px 0;">☆ No reviews</div>`;
                     if (relReviews.length > 0) {
                         const avg = (relReviews.reduce((sum, r) => sum + r.rating, 0) / relReviews.length).toFixed(1);
                         relStarHtml = `<div style="color: var(--dmc-976); font-size: 0.95rem; margin: 5px 0; font-weight: bold;">★ ${avg} <span style="color:#888; font-weight:normal;">(${relReviews.length})</span></div>`;
                     }

                     let relPriceHtml = `<h3 style="color: var(--dmc-3021); margin: 10px 0 15px;">PKR ${rp.price.toFixed(2)}</h3>`;
                     if (rp.discount && rp.discount > 0) {
                         relPriceHtml = `
                           <div style="margin: 10px 0 15px;">
                             <span style="text-decoration: line-through; color: #999; font-size: 0.9em; margin-right: 10px;">PKR ${rp.price.toFixed(2)}</span>
                             <h3 style="color: var(--dmc-976); display: inline;">PKR ${relFinalPrice.toFixed(2)}</h3>
                           </div>
                         `;
                     }

                     const relImg = rp.images && rp.images.length > 0 ? rp.images[0] : (rp.image || "https://via.placeholder.com/400");
                     relatedGrid.innerHTML += `
                         <a href="product.html?id=${rp.id}" class="premium-card interactive-card product-card">
                           <img src="${relImg}" class="card-img" alt="${rp.name}">
                           <div class="card-content">
                             <h2 style="font-size: 1.2rem; color: var(--dmc-3021); margin-bottom: 5px;">${rp.name}</h2>
                             ${relStarHtml}
                             ${relPriceHtml}
                             <button class="btn" style="width: 100%; font-size: 0.9rem; padding: 12px;">View Details</button>
                           </div>
                         </a>
                     `;
                 });
             }
          }
        } else {
          singleProductContainer.innerHTML = "<h2>Product no longer exists.</h2>";
        }
      } catch (error) { console.error(error); }
    }
    loadSingleProduct();
  }

  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = signupForm.querySelector('button');
      const name = document.getElementById('signup-name').value;
      const phone = document.getElementById('signup-phone').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;

      try {
        btn.innerText = "Registering...";
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, "users", user.uid), { fullName: name, phone: phone, email: email, role: "customer", createdAt: new Date().toISOString() });
        alert("Welcome to Cuddle Hut!");
        window.location.href = "shop.html";
      } catch (error) {
        btn.innerText = "Join Now";
        alert("Error: " + error.message);
      }
    });
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = loginForm.querySelector('button');
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        btn.innerText = "Authenticating...";
        await signInWithEmailAndPassword(auth, email, password);
        if (email === "cuddlehut26@gmail.com") window.location.href = "admin.html";
        else window.location.href = "shop.html";
      } catch (error) {
        btn.innerText = "Enter Portal";
        alert("Access Denied: " + error.message);
      }
    });
  }

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    const tl = gsap.timeline();

    const preloaderBg = document.getElementById('preloader-bg');
    const preloaderWrap = document.getElementById('preloader-logo-wrap');
    const navLogo = document.getElementById('nav-logo');
    
    if (preloaderBg && preloaderWrap && navLogo) {
      if (navLogo) gsap.set(navLogo, { opacity: 0 });
      gsap.set(preloaderWrap, {
        position: "fixed", left: "50%", top: "50%", xPercent: -50, yPercent: -50, width: "350px", opacity: 1, zIndex: 9999
      });

      tl.to(preloaderWrap, { 
        left: "50%", top: "15px",
        xPercent: -50, yPercent: 0, width: "45px", duration: 1.2, ease: "power3.inOut", delay: 1.8 
      });
      tl.to(preloaderBg, { 
        opacity: 0, duration: 0.8, ease: "power2.inOut",
        onComplete: () => {
          preloaderBg.style.display = 'none'; preloaderWrap.style.display = 'none'; gsap.set(navLogo, { opacity: 1 });    
        }
      }, "-=0.6"); 
    }

    tl.from(".gsap-nav", { y: -30, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.5");
    tl.from(".gsap-hero-card", { scale: 0.95, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.5");
    tl.from(".hero-title", { y: 20, opacity: 0, duration: 0.8, ease: "power2.out" }, "-=0.4");
    tl.from(".hero-subtitle", { y: 20, opacity: 0, duration: 0.8, ease: "power2.out" }, "-=0.6");

    tl.to(".hero-content", { 
        opacity: 0, duration: 1.5, delay: 3, display: "none", ease: "power2.inOut" 
    });

    if (document.querySelector(".philosophy-section")) {
      gsap.from(".gs-phil-title", { scrollTrigger: { trigger: ".philosophy-section", start: "top 90%" }, y: 30, duration: 0.8, ease: "power3.out" });
      gsap.from(".gs-phil-text", { scrollTrigger: { trigger: ".philosophy-section", start: "top 85%" }, y: 30, duration: 0.8, delay: 0.2, ease: "power3.out" });
      gsap.from(".gs-stat", { scrollTrigger: { trigger: ".stats-container", start: "top 90%" }, y: 40, duration: 0.8, stagger: 0.2, ease: "back.out(1.5)" });
    }

    if (document.querySelector(".scroll-section")) {
      gsap.from(".gs-scroll-title", { scrollTrigger: { trigger: ".scroll-section", start: "top 90%" }, y: 40, duration: 1, ease: "power3.out" });
      
      gsap.from(".gs-scroll-card", { 
          scrollTrigger: { trigger: ".grid", start: "top 95%" }, 
          y: 50, 
          opacity: 0, 
          duration: 0.8, 
          stagger: 0.15, 
          ease: "power2.out",
          clearProps: "all" 
      });
    }
  }
};

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initCuddleHut); } 
else { initCuddleHut(); }