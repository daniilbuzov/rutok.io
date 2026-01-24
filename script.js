let db;
let likedVideos = JSON.parse(localStorage.getItem('userLikes')) || [];
const stockUrl = "https://v.ftcdn.net/05/52/63/14/700_F_552631481_f9T7Y5jWn5Xq7zVl9f0jH3rWfGfQ6YmS_ST.mp4";

// 1. Работа с базой данных
const dbReq = indexedDB.open("TikTokMinimal", 1);
dbReq.onupgradeneeded = e => e.target.result.createObjectStore("vids", { keyPath: "id", autoIncrement: true });
dbReq.onsuccess = e => { db = e.target.result; initApp(); };

function initApp() {
    db.transaction("vids").objectStore("vids").getAll().onsuccess = e => {
        let userVids = e.target.result || [];
        let allVids = [...userVids];

        // Генерируем 20 видео (Свои + Тестовые)
        for (let i = 0; i < 20; i++) {
            allVids.push({
                id: 'test_' + i,
                url: stockUrl,
                desc: 'Классное видео #' + (i + 1),
                isTest: true
            });
        }
        renderFeed(allVids);
        renderProfile(allVids);
    };
}

// 2. Рендеринг ленты
function renderFeed(vids) {
    const feed = document.getElementById('feed-section');
    feed.innerHTML = '';

    vids.forEach(vid => {
        const src = vid.isTest ? vid.url : URL.createObjectURL(vid.blob);
        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
            <video src="${src}" loop playsinline muted></video>
            <div class="video-sidebar">
                <i class="fas fa-heart ${likedVideos.includes(vid.id) ? 'heart-red' : ''}" onclick="likeVid(this, '${vid.id}')"></i>
                <i class="fas fa-comment"></i>
            </div>
        `;

        card.onclick = (e) => {
            if (e.target.tagName === 'I') return;
            const v = card.querySelector('video');
            v.muted = false;
            v.paused ? v.play() : v.pause();
        };

        feed.appendChild(card);
        observer.observe(card);
    });
}

// 3. Лайки и профиль
function likeVid(el, id) {
    el.classList.toggle('heart-red');
    if (el.classList.contains('heart-red')) {
        if (!likedVideos.includes(id)) likedVideos.push(id);
    } else {
        likedVideos = likedVideos.filter(i => i !== id);
    }
    localStorage.setItem('userLikes', JSON.stringify(likedVideos));
    document.getElementById('like-total').innerText = likedVideos.length;
}

function showScreen(id) {
    document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id + '-section').classList.add('active');
}

function setGrid(type) {
    document.querySelectorAll('.video-grid').forEach(g => g.classList.remove('active-grid'));
    document.querySelectorAll('.p-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('grid-' + type).classList.add('active-grid');
}

// Автоплей при скролле
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        const v = entry.target.querySelector('video');
        entry.isIntersecting ? v.play() : v.pause();
    });
}, { threshold: 0.6 });

function handleNewVideo(e) {
    const file = e.target.files[0];
    if (file) {
        const tx = db.transaction("vids", "readwrite");
        tx.objectStore("vids").add({ blob: file });
        tx.oncomplete = () => location.reload();
    }
}
