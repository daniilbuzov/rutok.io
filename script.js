let db;
// Рабочие ссылки на тестовые видео
const testVideos = [
    "https://v.ftcdn.net/04/18/39/39/700_F_418393931_mI7N6L9mN8R8y5Zl4E7H8v9B2F5G6.mp4",
    "https://v.ftcdn.net/02/11/44/55/700_F_211445566_fGhJ1K2L3M4N5P6O7I8U.mp4",
    "https://v.ftcdn.net/05/52/63/14/700_F_552631481_f9T7Y5jWn5Xq7zVl9f0jH3rWfGfQ6YmS_ST.mp4"
];

// Инициализация базы данных IndexedDB
const request = indexedDB.open("TikTokFinalDB", 1);
request.onupgradeneeded = e => e.target.result.createObjectStore("my_videos", { autoIncrement: true });
request.onsuccess = e => { db = e.target.result; init(); };

function init() {
    renderFeed();
}

function renderFeed() {
    const feed = document.getElementById('s-feed');
    feed.innerHTML = '';
    
    // 1. Сначала тестовые видео
    testVideos.forEach(src => createCard(src, feed));
    
    // 2. Затем видео пользователя
    db.transaction("my_videos").objectStore("my_videos").getAll().onsuccess = e => {
        e.target.result.forEach(file => {
            const url = URL.createObjectURL(file);
            createCard(url, feed);
        });
    };
}

function createCard(src, parent) {
    const card = document.createElement('div');
    card.className = 'v-card';
    card.innerHTML = `
        <video src="${src}" loop playsinline></video>
        <div class="v-overlay">
            <i class="fas fa-heart" onclick="this.style.color='#fe2c55'"></i>
            <i class="fas fa-comment"></i>
        </div>
        <div class="v-info"><b>@video_author</b><p>Cool video description!</p></div>
    `;
    card.onclick = () => {
        const v = card.querySelector('video');
        v.paused ? v.play() : v.pause();
    };
    parent.appendChild(card);
    observer.observe(card);
}

function goTo(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('s-' + screenId).classList.add('active');
    if (screenId === 'profile') refreshProfile();
}

function handleNewVideo(e) {
    const file = e.target.files[0];
    if (file) {
        const tx = db.transaction("my_videos", "readwrite");
        tx.objectStore("my_videos").add(file);
        tx.oncomplete = () => { renderFeed(); goTo('profile'); };
    }
}

function refreshProfile() {
    const grid = document.getElementById('p-grid');
    grid.innerHTML = '';
    db.transaction("my_videos").objectStore("my_videos").getAll().onsuccess = e => {
        const vids = e.target.result;
        document.getElementById('p-count').innerText = vids.length;
        vids.forEach(file => {
            const url = URL.createObjectURL(file);
            grid.innerHTML += `<div class="grid-item"><video src="${url}#t=0.5"></video></div>`;
        });
    };
}

// Автозапуск видео при попадании в экран
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        const v = entry.target.querySelector('video');
        if (entry.isIntersecting) v.play().catch(() => {});
        else v.pause();
    });
}, { threshold: 0.8 });
