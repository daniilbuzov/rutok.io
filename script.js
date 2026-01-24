const testUrl = "https://v.ftcdn.net/05/52/63/14/700_F_552631481_f9T7Y5jWn5Xq7zVl9f0jH3rWfGfQ6YmS_ST.mp4";
let db;
let likedVids = JSON.parse(localStorage.getItem('savedLikes')) || [];

// Инициализация базы данных
const req = indexedDB.open("TikTokDB_V3", 1);
req.onupgradeneeded = e => e.target.result.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
req.onsuccess = e => { db = e.target.result; loadApp(); };

function loadApp() {
    db.transaction("videos").objectStore("videos").getAll().onsuccess = e => {
        const userVideos = e.target.result || [];
        let combined = [...userVideos];
        
        // Создаем 20 тестовых видео
        for(let i=0; i<20; i++) {
            combined.push({ id: 'test_'+i, url: testUrl, isTest: true, desc: 'Видео #' + (i+1) });
        }
        
        renderUI(combined);
    };
}

function renderUI(list) {
    const feed = document.getElementById('screen-feed');
    const gridAll = document.getElementById('grid-all');
    const gridLiked = document.getElementById('grid-liked');
    
    feed.innerHTML = ''; gridAll.innerHTML = ''; gridLiked.innerHTML = '';
    
    list.forEach(vid => {
        const src = vid.isTest ? vid.url : URL.createObjectURL(vid.blob);
        const isLiked = likedVids.includes(vid.id);

        // 1. В Ленту
        const card = document.createElement('div');
        card.className = 'v-card';
        card.innerHTML = `
            <video src="${src}" loop playsinline muted></video>
            <div class="side-ui">
                <i class="fas fa-heart ${isLiked ? 'is-active' : ''}" onclick="toggleLike('${vid.id}', this)"></i>
                <i class="fas fa-share"></i>
            </div>
        `;
        
        let lastTap = 0;
        card.onclick = (e) => {
            if(e.target.tagName === 'I') return;
            if(Date.now() - lastTap < 300) { heartEffect(e); toggleLike(vid.id, card.querySelector('.fa-heart'), true); }
            else { const v = card.querySelector('video'); v.muted = false; v.paused ? v.play() : v.pause(); }
            lastTap = Date.now();
        };
        feed.appendChild(card);
        observer.observe(card);

        // 2. В Профиль (Все)
        gridAll.innerHTML += `<div class="grid-item"><video src="${src}" muted></video></div>`;
        
        // 3. В Профиль (Лайки)
        if(isLiked) gridLiked.innerHTML += `<div class="grid-item"><video src="${src}" muted></video></div>`;
    });
    
    document.getElementById('likes-count').innerText = likedVids.length;
}

function toggleLike(id, el, force = false) {
    if(force) el.classList.add('is-active'); else el.classList.toggle('is-active');
    
    if(el.classList.contains('is-active')) {
        if(!likedVids.includes(id)) likedVids.push(id);
    } else {
        likedVids = likedVids.filter(i => i !== id);
    }
    localStorage.setItem('savedLikes', JSON.stringify(likedVids));
    // Перерисовываем профиль для обновления вкладок
    loadApp();
}

function heartEffect(e) {
    const h = document.createElement('i');
    h.className = 'fas fa-heart h-pop';
    h.style.left = e.clientX + 'px'; h.style.top = e.clientY + 'px';
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 700);
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + id).classList.add('active');
}

function switchGrid(type, el) {
    document.querySelectorAll('.video-grid').forEach(g => g.classList.remove('active-grid'));
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    document.getElementById('grid-' + type).classList.add('active-grid');
    el.classList.add('active');
}

function handleUpload(e) {
    const file = e.target.files[0];
    if(file) {
        const tx = db.transaction("videos", "readwrite");
        tx.objectStore("videos").add({ blob: file });
        tx.oncomplete = () => location.reload();
    }
}

const observer = new IntersectionObserver(ents => {
    ents.forEach(en => { const v = en.target.querySelector('video'); en.isIntersecting ? v.play() : v.pause(); });
}, { threshold: 0.7 });
