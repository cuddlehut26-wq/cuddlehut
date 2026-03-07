// admin.js
import { auth, db } from './app.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ADMIN_EMAIL = "cuddlehut26@gmail.com";
const IMGBB_API_KEY = "e0c05474494f963bd4769d2abec80d49"; 

// --- DYNAMIC STORE VARIABLES STATE ---
let defaultSettings = {
    brands: ["No Brand", "Reflex", "Petso", "Nutripaw", "Crunchy", "NourVet", "Petline", "Diamond Naturals", "Klumpy"],
    categories: ["Cat", "Dog", "Bird"],
    types: ["Food", "Treats", "Accessories", "Toys", "Grooming & Care", "Litter & Waste"]
};
let storeSettings = { ...defaultSettings };

onAuthStateChanged(auth, (user) => {
  if (!user || user.email !== ADMIN_EMAIL) {
    window.location.href = "index.html";
  } else {
    loadStoreSettings(); 
    loadUsers();
    loadProducts();
    loadOrders();
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  signOut(auth).then(() => { window.location.href = "login.html"; });
});

const navButtons = document.querySelectorAll('.admin-nav-btn[data-target]');
const sections = document.querySelectorAll('.admin-section');
navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    navButtons.forEach(b => b.classList.remove('active'));
    sections.forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.target).classList.add('active');
  });
});

// --- BULLETPROOF STORE SETTINGS LOGIC ---
async function loadStoreSettings() {
    try {
        const docRef = doc(db, "settings", "lists");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            storeSettings.brands = data.brands && data.brands.length > 0 ? data.brands : defaultSettings.brands;
            storeSettings.categories = data.categories && data.categories.length > 0 ? data.categories : defaultSettings.categories;
            storeSettings.types = data.types && data.types.length > 0 ? data.types : defaultSettings.types;
        } else {
            await setDoc(docRef, storeSettings).catch(e => console.warn("DB init blocked. Loading defaults locally."));
        }
    } catch (error) {
        console.warn("Database blocked settings load. Falling back to local defaults.", error);
        storeSettings = { ...defaultSettings };
    } finally {
        renderSettingsUI();
        populateDropdowns();
    }
}

function renderSettingsUI() {
    const renderList = (arr, listId, type) => {
        const ul = document.getElementById(listId);
        ul.innerHTML = arr.map((item, idx) => `
            <li style="display:flex; justify-content:space-between; align-items:center; padding: 10px; border-bottom: 1px solid #eee; font-size: 0.95rem;">
                ${item}
                <button type="button" class="btn-small btn-danger" style="padding: 4px 8px; border-radius: 4px;" onclick="window.removeSettingItem('${type}', ${idx})">✕</button>
            </li>
        `).join('');
    };
    renderList(storeSettings.brands, 'brands-list', 'brands');
    renderList(storeSettings.categories, 'categories-list', 'categories');
    renderList(storeSettings.types, 'types-list', 'types');
}

function populateDropdowns() {
    const pop = (selId, arr) => {
        const sel = document.getElementById(selId);
        if(!sel) return;
        const currentVal = sel.value; 
        sel.innerHTML = arr.map(i => `<option value="${i}">${i}</option>`).join('');
        
        if(arr.includes(currentVal)) {
            sel.value = currentVal; 
        } else if (arr.length > 0) {
            sel.value = arr[0];
        }
    };
    pop('prod-brand', storeSettings.brands);
    pop('prod-pet-category', storeSettings.categories);
    pop('prod-type', storeSettings.types);
}

window.removeSettingItem = async (type, index) => {
    if(confirm("Delete this option? Existing products will keep it until you edit them.")) {
        storeSettings[type].splice(index, 1);
        
        renderSettingsUI();
        populateDropdowns();

        try {
            await setDoc(doc(db, "settings", "lists"), storeSettings, { merge: true });
        } catch(e) {
            console.error("Firebase block: Could not remove from DB.", e);
        }
    }
};

const handleAddSetting = async (inputId, type) => {
    const input = document.getElementById(inputId);
    const val = input.value.trim();
    if(val && !storeSettings[type].includes(val)) {
        storeSettings[type].push(val);
        input.value = '';
        
        renderSettingsUI();
        populateDropdowns();

        try {
            await setDoc(doc(db, "settings", "lists"), storeSettings, { merge: true });
        } catch(e) {
            console.error("Firebase block: Could not save to DB.", e);
        }
    }
};

document.getElementById('add-brand-btn').addEventListener('click', () => handleAddSetting('new-brand-input', 'brands'));
document.getElementById('add-category-btn').addEventListener('click', () => handleAddSetting('new-category-input', 'categories'));
document.getElementById('add-type-btn').addEventListener('click', () => handleAddSetting('new-type-input', 'types'));

// --- MODAL & PRODUCT LOGIC ---
const modal = document.getElementById('product-modal');
const productForm = document.getElementById('product-form');
const varContainer = document.getElementById('variations-container');
let isEditing = false;

document.getElementById('add-var-btn').addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'var-row';
    row.innerHTML = `
        <input type="text" placeholder="Name (e.g. 2kg)" class="var-name" required>
        <input type="number" placeholder="Price (PKR)" class="var-price" required>
        <button type="button" class="btn-small btn-danger" onclick="this.parentElement.remove()">X</button>
    `;
    varContainer.appendChild(row);
});

function renderVisualizer(imagesArray) {
    const vis = document.getElementById('image-visualizer');
    vis.innerHTML = '';
    imagesArray.forEach((img, index) => {
        vis.innerHTML += `
            <div class="img-preview-box ${index === 0 ? 'main-img' : ''}" onclick="window.setMainImage(${index})">
                <img src="${img}">
                ${index === 0 ? '<div class="main-badge">MAIN</div>' : ''}
                <button type="button" class="img-remove-btn" title="Remove image" onclick="window.removeImage(${index}, event)">X</button>
            </div>
        `;
    });
}

window.setMainImage = (index) => {
    let imgs = JSON.parse(document.getElementById('prod-existing-images').value || "[]");
    if(imgs.length > 0) {
        const temp = imgs[0];
        imgs[0] = imgs[index];
        imgs[index] = temp;
        document.getElementById('prod-existing-images').value = JSON.stringify(imgs);
        renderVisualizer(imgs);
    }
};

window.removeImage = (index, event) => {
    event.stopPropagation(); 
    let imgs = JSON.parse(document.getElementById('prod-existing-images').value || "[]");
    imgs.splice(index, 1); 
    document.getElementById('prod-existing-images').value = JSON.stringify(imgs);
    renderVisualizer(imgs);
};

document.getElementById('open-add-modal-btn').addEventListener('click', () => {
  isEditing = false;
  productForm.reset();
  document.getElementById('prod-file').value = ''; 
  varContainer.innerHTML = '';
  document.getElementById('prod-colors').value = '';
  document.getElementById('image-visualizer').innerHTML = '';
  document.getElementById('prod-id').value = '';
  document.getElementById('prod-existing-images').value = '[]';
  document.getElementById('modal-title').innerText = "Add Product";
  
  if(storeSettings.categories.length > 0) document.getElementById('prod-pet-category').value = storeSettings.categories[0];
  if(storeSettings.types.length > 0) document.getElementById('prod-type').value = storeSettings.types[0];
  if(storeSettings.brands.length > 0) document.getElementById('prod-brand').value = storeSettings.brands[0];
  
  document.getElementById('prod-new-arrival').checked = false;
  document.getElementById('prod-best-seller').checked = false;

  modal.classList.add('active');
});

document.getElementById('close-modal-btn').addEventListener('click', () => {
  modal.classList.remove('active');
});

// Image Compression Helper
const compressImage = (file) => {
    return new Promise((resolve) => {
        if (!file.type.startsWith('image/') || file.type === 'image/gif') {
            return resolve(file);
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1000;
                const MAX_HEIGHT = 1000;
                let width = img.width;
                let height = img.height;

                if (width > height && width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                } else if (height > width && height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, { type: outType, lastModified: Date.now() }));
                }, outType, 0.8);
            };
        };
    });
};

productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('save-product-btn');
  const uploadStatus = document.getElementById('upload-status');
  btn.disabled = true;

  try {
    let finalImages = JSON.parse(document.getElementById('prod-existing-images').value || "[]");
    const fileInput = document.getElementById('prod-file');
    const files = fileInput.files;

    if (files.length > 0) {
        uploadStatus.style.display = "block";
        let uploadedCount = 0;
        uploadStatus.innerText = `Optimizing & Uploading (0/${files.length})...`;

        const uploadPromises = Array.from(files).map(async (file) => {
            const compressedFile = await compressImage(file);
            const formData = new FormData();
            formData.append('image', compressedFile);
            
            try {
                const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                
                uploadedCount++;
                uploadStatus.innerText = `Optimizing & Uploading (${uploadedCount}/${files.length})...`;
                
                if (data && data.data && data.data.url) {
                    return data.data.url;
                }
                return null;
            } catch(error) {
                console.error("Failed to upload image part", error);
                return null;
            }
        });
        
        const results = await Promise.all(uploadPromises);
        const newUrls = results.filter(url => url !== null);
        finalImages = finalImages.concat(newUrls);
        
        uploadStatus.style.display = "none";
    }

    const variations = [];
    document.querySelectorAll('#variations-container .var-row').forEach(row => {
        variations.push({
            name: row.querySelector('.var-name').value,
            price: parseFloat(row.querySelector('.var-price').value)
        });
    });

    const colorInputStr = document.getElementById('prod-colors').value;
    const colors = colorInputStr ? colorInputStr.split(',').map(c => ({ name: c.trim(), hex: "" })).filter(c => c.name !== "") : [];

    const id = document.getElementById('prod-id').value;
    
    const petCat = document.getElementById('prod-pet-category').value;
    const pType = document.getElementById('prod-type').value;
    const typeSlug = pType.toLowerCase().split(' ')[0]; 
    const combinedCategory = `${petCat.toLowerCase()}-${typeSlug}`;

    const productData = {
      name: document.getElementById('prod-name').value,
      petCategory: petCat,
      productType: pType,
      category: combinedCategory, 
      brand: document.getElementById('prod-brand').value,
      isNewArrival: document.getElementById('prod-new-arrival').checked,
      isBestSeller: document.getElementById('prod-best-seller').checked,
      price: parseFloat(document.getElementById('prod-price').value),
      discount: parseInt(document.getElementById('prod-discount').value) || 0,
      profit: parseFloat(document.getElementById('prod-profit').value) || 0,
      description: document.getElementById('prod-desc').value,
      seo: document.getElementById('prod-seo').value,
      variations: variations,
      colors: colors,
      images: finalImages 
    };

    if (isEditing && id) {
      await updateDoc(doc(db, "products", id), productData);
    } else {
      await addDoc(collection(db, "products"), productData);
    }
    
    document.getElementById('prod-file').value = ''; 
    modal.classList.remove('active');
    loadProducts(); 
  } catch (error) {
    alert("Error saving product: " + error.message);
  } finally {
    btn.disabled = false;
    uploadStatus.style.display = "none";
  }
});

async function loadProducts() {
  const tbody = document.querySelector('#products-table tbody');
  try {
    const snap = await getDocs(collection(db, "products"));
    tbody.innerHTML = '';
    if(snap.empty) {
      tbody.innerHTML = '<tr><td colspan="5">No products found. Add some!</td></tr>';
      return;
    }
    
    window.editProduct = editProduct;
    window.deleteProduct = deleteProduct;
    window.productDataCache = {}; 

    snap.forEach(docSnap => {
      const p = docSnap.data();
      const id = docSnap.id;
      window.productDataCache[id] = p; 
      
      const discountTxt = p.discount > 0 ? `<span style="color:#a93226;">-${p.discount}%</span>` : "None";
      const thumb = p.images && p.images.length > 0 ? p.images[0] : (p.image || "https://via.placeholder.com/400");
      
      const tagsHtml = `
        ${p.isNewArrival ? '<span style="background:var(--dmc-976); color:white; padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; margin-right: 5px; font-weight: bold;">NEW</span>' : ''}
        ${p.isBestSeller ? '<span style="background:#a93226; color:white; padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; margin-right: 5px; font-weight: bold;">HOT</span>' : ''}
      `;

      tbody.innerHTML += `
        <tr>
          <td><img src="${thumb}" style="width:50px; height:50px; object-fit:cover; border-radius:6px;"></td>
          <td>
             <strong>${p.name}</strong><br>
             <small style="color:gray;">${p.petCategory || ''} ${p.productType || ''} &bull; ${p.brand || 'No Brand'}</small><br>
             ${tagsHtml}
          </td>
          <td>PKR ${p.price.toFixed(2)}</td>
          <td>${discountTxt}</td>
          <td>
            <button class="btn-small" onclick="window.editProduct('${id}')">Edit</button>
            <button class="btn-small btn-danger" onclick="window.deleteProduct('${id}')">Del</button>
          </td>
        </tr>
      `;
    });
  } catch (error) { console.error(error); }
}

function editProduct(id) {
  const p = window.productDataCache[id];
  if(!p) return;
  isEditing = true;
  document.getElementById('modal-title').innerText = "Edit Product";
  
  document.getElementById('prod-file').value = ''; 
  document.getElementById('prod-id').value = id;
  document.getElementById('prod-name').value = p.name;
  
  const catSelect = document.getElementById('prod-pet-category');
  if(p.petCategory && !storeSettings.categories.includes(p.petCategory)) catSelect.innerHTML += `<option value="${p.petCategory}">${p.petCategory} (Legacy)</option>`;
  catSelect.value = p.petCategory || (storeSettings.categories[0] || "");

  const typeSelect = document.getElementById('prod-type');
  if(p.productType && !storeSettings.types.includes(p.productType)) typeSelect.innerHTML += `<option value="${p.productType}">${p.productType} (Legacy)</option>`;
  typeSelect.value = p.productType || (storeSettings.types[0] || "");

  const brandSelect = document.getElementById('prod-brand');
  if(p.brand && !storeSettings.brands.includes(p.brand)) brandSelect.innerHTML += `<option value="${p.brand}">${p.brand} (Legacy)</option>`;
  brandSelect.value = p.brand || (storeSettings.brands[0] || "");

  document.getElementById('prod-new-arrival').checked = p.isNewArrival || false;
  document.getElementById('prod-best-seller').checked = p.isBestSeller || false;

  document.getElementById('prod-price').value = p.price;
  document.getElementById('prod-discount').value = p.discount || 0;
  document.getElementById('prod-profit').value = p.profit || 0;
  document.getElementById('prod-desc').value = p.description || "";
  document.getElementById('prod-seo').value = p.seo || ""; 
  
  varContainer.innerHTML = '';
  if(p.variations && p.variations.length > 0) {
      p.variations.forEach(v => {
          const row = document.createElement('div');
          row.className = 'var-row';
          row.innerHTML = `
              <input type="text" placeholder="Name (e.g. 2kg)" class="var-name" value="${v.name}" required>
              <input type="number" placeholder="Price (PKR)" class="var-price" value="${v.price}" required>
              <button type="button" class="btn-small btn-danger" onclick="this.parentElement.remove()">X</button>
          `;
          varContainer.appendChild(row);
      });
  }

  let colorStr = "";
  if (p.colors && p.colors.length > 0) {
      colorStr = p.colors.map(c => typeof c === 'object' ? c.name : c).join(', ');
  }
  document.getElementById('prod-colors').value = colorStr;

  const existingImgs = p.images ? p.images : (p.image ? [p.image] : []);
  document.getElementById('prod-existing-images').value = JSON.stringify(existingImgs);
  renderVisualizer(existingImgs);
  
  modal.classList.add('active');
}

async function deleteProduct(id) {
  if(confirm("Delete this product?")) {
    await deleteDoc(doc(db, "products", id));
    loadProducts();
  }
}

async function loadUsers() {
  const tbody = document.querySelector('#users-table tbody');
  const snap = await getDocs(collection(db, "users"));
  tbody.innerHTML = '';
  snap.forEach(docSnap => {
    const u = docSnap.data();
    tbody.innerHTML += `<tr><td>${u.fullName}</td><td>${u.email}</td><td>${u.phone}</td><td>${new Date(u.createdAt).toLocaleDateString()}</td></tr>`;
  });
}

const orderModal = document.getElementById('order-modal');
document.getElementById('close-order-modal-btn').addEventListener('click', () => orderModal.classList.remove('active'));

async function loadOrders() {
  const tbody = document.querySelector('#orders-table tbody');
  const snap = await getDocs(collection(db, "orders"));
  tbody.innerHTML = '';
  if(snap.empty) { tbody.innerHTML = '<tr><td colspan="5">Awaiting first order...</td></tr>'; return; }

  window.viewOrder = viewOrder;
  window.markOrderDone = markOrderDone;
  window.orderDataCache = {}; 

  snap.forEach(docSnap => {
    const o = docSnap.data();
    const id = docSnap.id;
    window.orderDataCache[id] = o;
    const statusColor = o.status.includes('Pending') ? '#a93226' : 'var(--dmc-976)';

    tbody.innerHTML += `
      <tr>
        <td><strong>${o.orderId}</strong><br><small style="color:#888;">${new Date(o.createdAt).toLocaleDateString()}</small></td>
        <td>${o.customerName}</td>
        <td style="color:var(--dmc-3021); font-weight:bold;">PKR ${o.totalAmount.toFixed(2)}</td>
        <td style="color:${statusColor}; font-weight:bold;">${o.status}</td>
        <td>
          <button class="btn-small" style="margin-right: 5px; background: transparent; color: var(--dmc-3021); border: 1px solid var(--dmc-3021);" onclick="window.viewOrder('${id}')">View Details</button>
          <button class="btn-small" style="background: var(--dmc-976); border-color: var(--dmc-976);" onclick="window.markOrderDone('${id}')">Done</button>
        </td>
      </tr>
    `;
  });
}

function viewOrder(id) {
  const o = window.orderDataCache[id];
  if(!o) return;
  const detailsContent = document.getElementById('order-details-content');
  let itemsHtml = o.items.map(item => `<li><strong>${item.quantity || 1}x ${item.name}</strong> (PKR ${(item.price * (item.quantity||1)).toFixed(2)})</li>`).join('');

  detailsContent.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom: 5px;"><strong>Order ID:</strong> <span>${o.orderId}</span></div>
    <div style="display:flex; justify-content:space-between; margin-bottom: 5px;"><strong>Date Placed:</strong> <span>${new Date(o.createdAt).toLocaleString()}</span></div>
    <div style="display:flex; justify-content:space-between; margin-bottom: 5px;"><strong>Current Status:</strong> <span style="color:var(--dmc-976); font-weight:bold;">${o.status}</span></div>
    <div style="display:flex; justify-content:space-between; margin-bottom: 5px;"><strong>Payment Method:</strong> <span style="text-transform:uppercase;">${o.paymentMethod}</span></div>
    
    <hr style="border:0; border-top:1px solid #ddd; margin: 20px 0;">
    <h3 style="font-size: 1.1rem; color: var(--dmc-3021); margin-bottom: 10px;">Customer Information</h3>
    <p style="margin-bottom: 5px;"><strong>Name:</strong> ${o.customerName}</p>
    <p style="margin-bottom: 5px;"><strong>Email:</strong> ${o.email}</p>
    <p style="margin-bottom: 5px;"><strong>Phone:</strong> ${o.phone}</p>
    <p style="margin-bottom: 5px;"><strong>Address:</strong> ${o.address}, ${o.city}</p>

    <hr style="border:0; border-top:1px solid #ddd; margin: 20px 0;">
    <h3 style="font-size: 1.1rem; color: var(--dmc-3021); margin-bottom: 10px;">Items Ordered</h3>
    <ul style="list-style-type: none; padding: 0; margin-bottom: 20px; color:#555;">${itemsHtml}</ul>
    
    <div style="display:flex; justify-content:space-between; margin-bottom: 5px; color:#a93226;">
        <span>Shipping Cost:</span> <span>PKR ${(o.shippingCost || 0).toFixed(2)}</span>
    </div>
    <div style="display:flex; justify-content:space-between; font-size:1.3rem; font-weight:bold; color:var(--dmc-3021); border-top: 2px solid var(--dmc-3021); padding-top: 15px;">
        <span>Grand Total:</span> <span>PKR ${o.totalAmount.toFixed(2)}</span>
    </div>
  `;
  orderModal.classList.add('active');
}

async function markOrderDone(id) {
  if(confirm("Mark this order as Fulfilled? This changes the status to 'Fulfilled' in the database.")) {
    await updateDoc(doc(db, "orders", id), { status: "Fulfilled" });
    loadOrders(); 
  }
}