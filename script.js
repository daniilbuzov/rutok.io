// Тестовые видео (безопасные ссылки)
const stockVideos = [
    "https://v.ftcdn.net/05/52/63/14/700_F_552631481_f9T7Y5jWn5Xq7zVl9f0jH3rWfGfQ6YmS_ST.mp4",
    "https://v.ftcdn.net/02/10/50/30/700_F_210503038_SHevj06B0jVvK15i1rG0M7Bf6ZgY4K.mp4",
    "https://v.ftcdn.net/04/78/33/21/700_F_478332155_6qZ7b9b0z6B8M8p1p0z6B8M8p1p0z6.mp4"
];

let db;
let cachedVideos = [];
// Загружаем лайки из памяти телефона
let likedIDs = JSON.parse(localStorage.getItem('myLikes')) || [];

// 1. Инициализация БД
const request = indexedDB.open("TikTokFixed", 1);
request.onupgradeneeded = e => e.target.result.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
request.onsuccess = e => { db = e.target.result; startApp(); };

function startApp() {
    db.transaction("videos").objectStore("videos").getAll().onsuccess = e => {
        const userVideos = e.target.result || [];
        
        // Собираем 20 видео (Свои + Тестовые)
        cachedVideos = [...userVideos];
        for (let i = 0; i < 20; i++) {
            cachedVideos.push({
                id: `test_${i}`, // Статичный ID для тестовых, чтобы лайки сохранялись
                url: stockVideos[i % stockVideos.length],
                desc: `Reels #${i + 1}`,
                isTest: true
            });
        }
        
        renderFeed();
        renderProfile();
    };
}

// 2. Отрисовка ленты
function renderFeed() {
    const feed = document.getElementById('feed-screen');
    feed.innerHTML = '';

    cachedVideos.forEach(vid => {
        const src = vid.isTest ? vid.url : URL.createObjectURL(vid.blob);
        const isLiked = likedIDs.includes(vid.id);

        const el = document.createElement('div');
        el.className = 'video-container';
        el.innerHTML = `
            <video src="${src}" loop playsinline muted></video>
            <div class="bottom-info">
                <h3>@${vid.isTest ? 'test_acc' : 'me'}</h3>
                <p>${vid.desc}</p>
            </div>
            <div class="sidebar-right">
                <i class="fas fa-heart ${isLiked ? 'liked' : ''}" onclick="toggleLike(this, '${vid.id}')"></i>
                <i class="fas fa-comment-dots" onclick="alert('Комменты скоро!')"></i>
                <i class="fas fa-share" onclick="navigator.share({url:location.href})"></i>
            </div>
        `;

        // Умный клик (пауза или лайк)
        let lastTap = 0;
        el.onclick = (e) => {
            if(e.target.tagName === 'I') return; // Если нажали на кнопку - не паузим
            
            const now = Date.now();
            if (now - lastTap < 300) {
                // Двойной клик
                showBigHeart(el);
                if (!likedIDs.includes(vid.id)) toggleLike(el.querySelector('.fa-heart'), vid.id);
            } else {
                // Одиночный клик
                const v = el.querySelector('video');
                v.muted = false; // Включаем звук
                v.paused ? v.play() : v.pause();
            }
            lastTap = now;
        };

        feed.appendChild(el);
        observer.observe(el);
    });
}

// 3. Лайки и Профиль
function toggleLike(icon, id) {
    icon.classList.toggle('liked');
    
    if (icon.classList.contains('liked')) {
        if (!likedIDs.includes(id)) likedIDs.push(id);
    } else {
        likedIDs = likedIDs.filter(x => x !== id);
    }
    
    localStorage.setItem('myLikes', JSON.stringify(likedIDs));
    renderProfile(); // Обновляем профиль сразу
}

function renderProfile() {
    const allGrid = document.getElementById('grid-all');
    const likeGrid = document.getElementById('grid-likes');
    
    allGrid.innerHTML = '';
    likeGrid.innerHTML = '';
    
    document.getElementById('total-likes').innerText = likedIDs.length;

    cachedVideos.forEach(vid => {
        const src = vid.isTest ? vid.url : URL.createObjectURL(vid.blob);
        const item = `<div class="grid-item" onclick="openTab('feed')"><video src="${src}" muted></video></div>`;
        
        // Добавляем во вкладку "Все"
        allGrid.innerHTML += item;
        
        // Добавляем во вкладку "Лайки" (если лайкнуто)
        if (likedIDs.includes(vid.id)) {
            likeGrid.innerHTML += item;
        }
    });
}

// 4. Вспомогательные функции
function showBigHeart(container) {
    const h = document.createElement('i');
    h.className = 'fas fa-heart big-heart';
    container.appendChild(h);
    setTimeout(() => h.remove(), 700);
}

function openTab(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    if (name === 'feed') document.getElementById('feed-screen').classList.add('active');
    if (name === 'profile') document.getElementById('profile-screen').classList.add('active');
}

function switchGrid(type) {
    document.querySelectorAll('.grid-view').forEach(g => g.classList.remove('active-grid'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active-tab'));
    
    document.getElementById('grid-' + type).classList.add('active-grid');
    document.getElementById('btn-' + type).classList.add('active-tab');
}

function handleUpload(e) {
    const file = e.target.files[0];
    if(!file) return;
    const tx = db.transaction("videos", "readwrite");
    tx.objectStore("videos").add({ blob: file, desc: "Мое новое видео" });
    tx.oncomplete = () => location.reload();
}

// Автоплей (Intersection Observer)
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        const v = entry.target.querySelector('video');
        if (entry.isIntersecting) {
            v.play().catch(() => {}); // Игнорируем ошибку автоплея
        } else {
            v.pause();
        }
    });
}, { threshold: 0.6 });
