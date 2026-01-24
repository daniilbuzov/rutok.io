// 1. Ссылки на тестовые видео
const testVideos = [
    "https://v.ftcdn.net/05/52/63/14/700_F_552631481_f9T7Y5jWn5Xq7zVl9f0jH3rWfGfQ6YmS_ST.mp4",
    "https://v.ftcdn.net/02/10/50/30/700_F_210503038_SHevj06B0jVvK15i1rG0M7Bf6ZgY4K.mp4",
    "https://v.ftcdn.net/04/78/33/21/700_F_478332155_6qZ7b9b0z6B8M8p1p0z6B8M8p1p0z6.mp4"
];

let db;
let likedIDs = JSON.parse(localStorage.getItem('likes')) || [];
let allVideosCache = [];

// 2. База данных
const request = indexedDB.open("TikTokWeb", 1);
request.onupgradeneeded = e => e.target.result.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
request.onsuccess = e => { db = e.target.result; initApp(); };

// 3. Загрузка приложения
function initApp() {
    db.transaction("videos").objectStore("videos").getAll().onsuccess = e => {
        let userVids = e.target.result || [];
        
        // Смешиваем свои видео + добиваем до 20 тестовыми
        allVideosCache = [...userVids];
        for (let i = 0; i < 20; i++) {
            allVideosCache.push({
                id: 'test_' + i,
                url: testVideos[i % testVideos.length],
                desc: `Видео #${i + 1}`,
                isTest: true
            });
        }
        
        renderFeed();
        updateProfile();
    };
}

// 4. Отрисовка ЛЕНТЫ
function renderFeed() {
    const feed = document.getElementById('feed-screen');
    feed.innerHTML = '';
    
    allVideosCache.forEach(vid => {
        const src = vid.isTest ? vid.url : URL.createObjectURL(vid.blob);
        const isLiked = likedIDs.includes(vid.id);
        
        const div = document.createElement('div');
        div.className = 'video-item';
        div.innerHTML = `
            <video src="${src}" loop playsinline muted></video>
            
            <div class="video-desc">
                <h3>@${vid.isTest ? 'test_user' : 'me'}</h3>
                <p>${vid.desc}</p>
            </div>

            <div class="ui-right">
                <i class="fas fa-heart ${isLiked ? 'heart-active' : ''}" 
                   onclick="toggleLike('${vid.id}', this)"></i>
                <i class="fas fa-comment"></i>
                <i class="fas fa-share"></i>
            </div>
        `;
        
        // Клик по видео (Play/Pause)
        div.onclick = (e) => {
            if(e.target.tagName === 'I') return; // Игнор клика по иконкам
            const v = div.querySelector('video');
            v.muted = false;
            v.paused ? v.play() : v.pause();
        };

        feed.appendChild(div);
        observer.observe(div);
    });
}

// 5. ЛАЙКИ
function toggleLike(id, icon) {
    icon.classList.toggle('heart-active');
    
    if (icon.classList.contains('heart-active')) {
        if (!likedIDs.includes(id)) likedIDs.push(id);
    } else {
        likedIDs = likedIDs.filter(item => item !== id);
    }
    
    localStorage.setItem('likes', JSON.stringify(likedIDs));
    updateProfile();
}

// 6. ПРОФИЛЬ
function updateProfile() {
    // Счётчик
    document.getElementById('like-counter').innerText = likedIDs.length;
    
    const gridAll = document.getElementById('grid-all');
    const gridLikes = document.getElementById('grid-likes');
    
    gridAll.innerHTML = '';
    gridLikes.innerHTML = '';
    
    // Заполняем "Мои видео" (все)
    allVideosCache.forEach(vid => {
        const src = vid.isTest ? vid.url : URL.createObjectURL(vid.blob);
        gridAll.innerHTML += `<div class="grid-cell"><video src="${src}" muted></video></div>`;
        
        // Заполняем "Лайки"
        if (likedIDs.includes(vid.id)) {
            gridLikes.innerHTML += `<div class="grid-cell"><video src="${src}" muted></video></div>`;
        }
    });
}

// 7. Навигация и Загрузка
function switchScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active-screen'));
    if(screenName === 'feed') document.getElementById('feed-screen').classList.add('active-screen');
    if(screenName === 'profile') document.getElementById('profile-screen').classList.add('active-screen');
}

function showGrid(type) {
    document.querySelectorAll('.video-grid').forEach(g => g.classList.remove('active-grid'));
    document.getElementById('grid-' + type).classList.add('active-grid');
}

function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const tx = db.transaction("videos", "readwrite");
    tx.objectStore("videos").add({ blob: file, desc: "Новое видео!" });
    tx.oncomplete = () => location.reload();
}

// Автоплей
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        const v = entry.target.querySelector('video');
        entry.isIntersecting ? v.play() : v.pause();
    });
}, { threshold: 0.6 });
