// ================= LOADER (รอโหลดให้ดูโปร) =================
window.addEventListener('load', () => {
    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 800);
    }, 1000); // โชว์หน้าโหลด 1 วิ
    
    initDatabase();
});

// ================= SPA VIEW MANAGER =================
function switchView(targetId) {
    document.querySelectorAll('.page-view').forEach(view => {
        view.classList.remove('active');
    });
    const target = document.getElementById(targetId);
    // Force Reflow ให้ Animation ทำงานซ้ำได้
    void target.offsetWidth; 
    target.classList.add('active');

    // เลื่อนตู้กระจกกลับไปบนสุด
    document.querySelector('.premium-glass-container').scrollTo({ top: 0, behavior: 'smooth' });
}

// ================= DATABASE (LocalStorage Simulation) =================
// โครงสร้าง Database จำลองที่รองรับทุกหมวดหมู่
const defaultDB = {
    web: [
        { title: 'เว็บโอนเงิน 69.-', img: 'https://placehold.co/400x250/ffe4e1/ff69b4?text=Web+Transfer', link: 'https://example.com' },
        { title: 'เว็บตัวอย่างผลงาน 109.-', img: 'https://placehold.co/400x250/fff0f5/ff8da1?text=Portfolio', link: 'https://example.com' }
    ],
    id: [
        { title: 'ป้ายสไตล์อนิเมะ', img: 'https://placehold.co/400x400/ffe4e1/ff69b4?text=Anime+Banner' },
        { title: 'ป้ายสไตล์มินิมอล', img: 'https://placehold.co/400x400/fff0f5/ff8da1?text=Minimal' }
    ],
    decor: [], rov: [], idv: [], forms: [], courses: []
};

let db = {};

function initDatabase() {
    const savedDB = localStorage.getItem('nonioaey_db');
    if (savedDB) {
        db = JSON.parse(savedDB);
    } else {
        db = defaultDB;
        saveDB();
    }
    
    // Render ทุกหน้า
    ['web', 'id', 'decor', 'rov', 'idv', 'forms', 'courses'].forEach(cat => renderGallery(cat));
    loadTextEdits();
    loadMainImages();
}

function saveDB() { localStorage.setItem('nonioaey_db', JSON.stringify(db)); }

// ================= DYNAMIC RENDERING =================
function renderGallery(category) {
    const container = document.getElementById(`gallery-${category}`);
    if(!container) return;
    
    container.innerHTML = '';
    
    if (db[category].length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#ccc; font-size:13px; grid-column:1/-1;">ยังไม่มีผลงานในหมวดนี้ 🌸</p>`;
        return;
    }

    db[category].forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'work-card';
        
        // รูปแบบของรูปภาพ (ป้ายไอดีเป็นสี่เหลี่ยมจัตุรัส กดแล้วซูม)
        const isZoomable = category === 'id';
        const imgAction = isZoomable ? `onclick="openImageModal('${item.img}')"` : '';
        const zoomClass = isZoomable ? 'zoomable' : '';
        
        // ปุ่มลบ (สำหรับแอดมิน)
        const delBtn = `<button class="admin-action-btn delete-btn hidden" onclick="deleteItem('${category}', ${index})"><i class="fa-solid fa-xmark"></i></button>`;
        // ปุ่มเปลี่ยนรูป (สำหรับแอดมิน)
        const editImgBtn = `<button class="admin-action-btn edit-img-btn hidden" onclick="triggerItemUpload('${category}', ${index})"><i class="fa-solid fa-camera"></i></button>`;

        let html = `
            ${delBtn}
            <div class="img-frame ${zoomClass}" ${imgAction}>
                <img src="${item.img}" id="img-${category}-${index}" alt="${item.title}">
                ${editImgBtn}
            </div>
            <h4 class="edit-text" id="txt-${category}-${index}">${item.title}</h4>
        `;

        // ถ้าไม่ใช่ป้ายไอดี ให้มีปุ่มลิงก์
        if (!isZoomable) {
            const linkUrl = item.link || '#';
            html += `<button class="btn-sm-action" onclick="openLinkModal('${item.title}', '${linkUrl}')">ดูตัวอย่าง</button>`;
        }

        card.innerHTML = html;
        container.appendChild(card);
    });

    // รีเฟรชสถานะปุ่มแอดมินถ้าล็อกอินอยู่
    if(document.body.classList.contains('is-admin')) enableAdminFeatures();
}

// ================= ADMIN ADD/DELETE/EDIT SYSTEM =================
let currentCategory = '';
let editTarget = { type: '', index: null }; // เก็บข้อมูลว่ากำลังเปลี่ยนรูปอะไร

function openAddModal(category) {
    currentCategory = category;
    document.getElementById('add-title').value = '';
    document.getElementById('add-link').value = '';
    document.getElementById('add-img-preview').src = 'https://placehold.co/300x150/ffe4e1/ff69b4?text=+Click+to+Upload';
    
    // ซ่อนช่องลิงก์ถ้าเป็นป้ายไอดี
    document.getElementById('add-link').style.display = (category === 'id') ? 'none' : 'block';
    
    document.getElementById('modal-add').classList.remove('hidden');
}

function previewAddImg(event) {
    const reader = new FileReader();
    reader.onload = function(e) { document.getElementById('add-img-preview').src = e.target.result; }
    if(event.target.files[0]) reader.readAsDataURL(event.target.files[0]);
}

function saveNewItem() {
    const title = document.getElementById('add-title').value;
    const link = document.getElementById('add-link').value;
    const imgData = document.getElementById('add-img-preview').src;

    if (!title || imgData.includes('placehold.co')) {
        alert('กรุณาใส่ชื่องานและอัปโหลดรูปภาพค่ะ 🥰'); return;
    }

    db[currentCategory].push({ title, img: imgData, link });
    saveDB();
    renderGallery(currentCategory);
    closeModal('modal-add');
}

function deleteItem(category, index) {
    if(confirm('ยืนยันการลบผลงานชิ้นนี้? 🗑️')) {
        db[category].splice(index, 1);
        saveDB();
        renderGallery(category);
    }
}

// อัปโหลดเปลี่ยนรูปเฉพาะจุด
function triggerItemUpload(category, index) {
    editTarget = { type: 'gallery', cat: category, idx: index };
    document.getElementById('general-uploader').click();
}

function triggerUpload(elementId) {
    editTarget = { type: 'main', id: elementId };
    document.getElementById('general-uploader').click();
}

function handleGeneralUpload(event) {
    const file = event.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const dataURL = e.target.result;
        
        if (editTarget.type === 'gallery') {
            // อัปเดตใน DB
            db[editTarget.cat][editTarget.idx].img = dataURL;
            saveDB();
            renderGallery(editTarget.cat);
        } else if (editTarget.type === 'main') {
            // อัปเดตรูปโปรไฟล์หลัก
            document.getElementById(editTarget.id).src = dataURL;
            localStorage.setItem(editTarget.id, dataURL);
        }
    }
    reader.readAsDataURL(file);
}

// ================= ADMIN AUTHENTICATION =================
const ADMIN_PASS = "ss11";

function toggleAdminModal() {
    if (document.body.classList.contains('is-admin')) {
        if(confirm('ออกจากโหมดจัดการหลังบ้าน? 🌸')) {
            document.body.classList.remove('is-admin');
            document.querySelectorAll('[contenteditable="true"]').forEach(el => el.setAttribute('contenteditable', 'false'));
        }
    } else {
        document.getElementById('login-pass').value = '';
        document.getElementById('login-error').classList.add('hidden');
        document.getElementById('modal-login').classList.remove('hidden');
    }
}

function verifyAdmin() {
    const pass = document.getElementById('login-pass').value.trim().toLowerCase();
    if (pass === ADMIN_PASS) {
        closeModal('modal-login');
        document.body.classList.add('is-admin');
        enableAdminFeatures();
        alert('✨ เข้าสู่ระบบแอดมินเรียบร้อยค่ะ\n\n• กด [+] เพื่อเพิ่มผลงาน\n• กด [x] เพื่อลบ\n• กดที่รูปกล้อง 📸 เพื่อเปลี่ยนรูป\n• คลิกที่ข้อความต่างๆ เพื่อพิมพ์แก้ได้เลย!');
    } else {
        document.getElementById('login-error').classList.remove('hidden');
    }
}

function enableAdminFeatures() {
    // ทำให้ข้อความที่เป็น class 'edit-text' และข้อความอื่นๆ ที่ตั้ง id ไว้แก้ได้
    document.querySelectorAll('.edit-text, #txt-bio, #txt-web-desc, #txt-id-desc').forEach(el => {
        el.setAttribute('contenteditable', 'true');
        el.onblur = function() {
            // เซฟเมื่อคลิกออก
            if(!this.id) this.id = 'txt-' + Math.random().toString(36).substr(2, 9);
            
            // ถ้าเป็นชื่องานในแกลลอรี่ ต้องเซฟลง DB ด้วย
            if(this.id.startsWith('txt-') && this.id.split('-').length === 3) {
                const parts = this.id.split('-');
                const cat = parts[1];
                const idx = parseInt(parts[2]);
                if(db[cat] && db[cat][idx]) {
                    db[cat][idx].title = this.innerText;
                    saveDB();
                }
            } else {
                localStorage.setItem(this.id, this.innerText);
            }
        };
    });
}

// ================= MODALS & UTILS =================
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function openImageModal(src) {
    document.getElementById('modal-display-img').src = src;
    document.getElementById('modal-image').classList.remove('hidden');
}

function openLinkModal(title, url) {
    document.getElementById('modal-link-title').innerText = title;
    document.getElementById('modal-link-url').href = url || '#';
    document.getElementById('modal-link').classList.remove('hidden');
}

function loadTextEdits() {
    ['txt-bio', 'txt-web-desc', 'txt-id-desc'].forEach(id => {
        const saved = localStorage.getItem(id);
        if (saved) document.getElementById(id).innerText = saved;
    });
}
function loadMainImages() {
    const savedProf = localStorage.getItem('main-avatar');
    if(savedProf) document.getElementById('main-avatar').src = savedProf;
}
