let db;
// Массив с ID лайкнутых видео (загружаем из памяти)
let likedVideos = JSON.parse(localStorage.getItem('likedList')) || [];

// Тестовые ссылки
const stockVids = [
    "https://v.ftcdn.net/05/52/63/14/700_F_552631481_f9T7Y5jWn5Xq7zVl9f0jH3rWfGfQ6YmS_ST.mp4",
    "https://v.ftcdn.net/02/10/50/30/700_F_210503038_SHevj06B0jVvK15i1rG0M7Bf6ZgY4K.mp4",
    "https://v.ftcdn.net/04/78/33/21/700_F_478332155_6qZ7b9b0z6B8M8p1p0z6B8M8p1p0z6.mp4"
];

// 1. Старт базы данных
const req = indexedDB.open("TikTokFinal", 1);
req.onupgradeneeded = e => e.target.result.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
req.onsuccess = e => { db = e.target.result; loadApp(); };

// 2. Главная загрузка
function loadApp() {
    db.transaction("videos").objectStore("videos").getAll().onsuccess = e => {
        let userVids = e.target.result || [];
        let allVids = [...userVids];

        // Добиваем до 20 тестовыми
        for(let i = 0; i < 20; i++) {
            // Создаем уникальный ID для тестовых видео, чтобы лайки работали
            allVids.push({
                id: `test_${i}`, 
                url: stockVids[i % stockVids.length], 
                desc: `Видео #${i+1}`, 
                isTest: true 
            });
        }

        renderFeed(allVids);
        renderProfile(allVids);
    };
}

// 3. Рендер Ленты
function renderFeed(list) {
    const feed = document.getElementById('feed');
    feed.innerHTML = '';

    list.forEach(vid => {
        const src = vid.isTest ? vid.url : URL.createObjectURL(vid.blob);
        const isLiked = likedVideos.includes(vid.id); // Проверяем, лайкнуто ли

        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
            <video src="${src}" loop playsinline muted></video>
            <div class="sidebar">
                <i class="fas fa-heart ${isLiked ? 'liked' : ''}" 
                   onclick="toggleLike('${vid.id}', this)"></i>
                <i class="fas fa-comment"></i>
                <i class="fas fa-share"></i>
            </div>
            <div class="info">
                <h3>@${vid.isTest ? 'user' : 'me'}</h3>
                <p>${vid.desc}</p>
            </div>
        `;

        // Логика двойного клика
        let lastTap = 0;
        card.onclick = (e) => {
            if(e.target.tagName === 'I') return;
            const now = Date.now();
            if(now - lastTap < 300) {
                spawnHeart(e);
                // Находим иконку сердца внутри карточки и лайкаем
                const heartIcon = card.querySelector('.fa-heart');
                if(!heartIcon.classList.contains('liked')) {
                    toggleLike(vid.id, heartIcon);
                }
            } else {
                const v = card.querySelector('video');
                v.muted = false;
                v.paused ? v.play() : v.pause();
            }
            lastTap = now;
        };

        feed.appendChild(card);
        observer.observe(card);
    });
}

// 4. Логика Лайков (самая важная часть)
function toggleLike(id, el) {
    el.classList.toggle('liked');
    
    if(el.classList.contains('liked')) {
        if(!likedVideos.includes(id)) likedVideos.push(id);
    } else {
        likedVideos = likedVideos.filter(v => v !== id);
    }

    // Сохраняем в память телефона
    localStorage.setItem('likedList', JSON.stringify(likedVideos));
    
    // Обновляем профиль (счетчик и сетку)
    updateLikesGrid();
}

// 5. Рендер Профиля
let cachedVideos = []; // Храним видео, чтобы не грузить заново

function renderProfile(list) {
    cachedVideos = list;
    const gridAll = document.getElementById('grid-all');
    gridAll.innerHTML = '';

    list.forEach(vid => {
        const src = vid.isTest ? vid.url : URL.createObjectURL(vid.blob);
        gridAll.innerHTML += `<div class="grid-box"><video src="${src}" muted></video></div>`;
    });

    updateLikesGrid();
}

function updateLikesGrid() {
    const gridLikes = document.getElementById('grid-likes');
    const countSpan = document.getElementById('totalLikes');
    
    gridLikes.innerHTML = '';
    
    // Фильтруем только лайкнутые видео
    const myLikes = cachedVideos.filter(v => likedVideos.includes(v.id));
    
    myLikes.forEach(vid => {
        const src = vid.isTest ? vid.url : URL.createObjectURL(vid.blob);
        gridLikes.innerHTML += `<div class="grid-box"><video src="${src}" muted></video></div>`;
    });

    countSpan.innerText = myLikes.length;
}

// Вспомогательные функции
function switchTab(tab) {
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.video-grid').forEach(g => g.classList.remove('active-grid'));
    
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('grid-' + tab).classList.add('active-grid');
}

function openScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function spawnHeart(e) {
    const h = document.createElement('i');
    h.className = 'fas fa-heart pop-heart';
    h.style.left = (e.clientX - 40) + 'px';
    h.style.top = (e.clientY - 40) + 'px';
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 800);
}

function uploadVideo(e) {
    const file = e.target.files[0];
    if(file) {
        const tx = db.transaction("videos", "readwrite");
        tx.objectStore("videos").add({ blob: file, desc: "Новое видео" });
        tx.oncomplete = () => location.reload();
    }
}

const observer = new IntersectionObserver(ents => {
    ents.forEach(en => {
        const v = en.target.querySelector('video');
        en.isIntersecting ? v.play() : v.pause();
    });
}, { threshold: 0.7 });
