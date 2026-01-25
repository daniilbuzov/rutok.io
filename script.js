// Прямые рабочие ссылки на видео
const videos = [
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    "https://vjs.zencdn.net/v/oceans.mp4",
    "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
];

let db;
let likedList = JSON.parse(localStorage.getItem('likes')) || [];

// Инициализация базы данных
const request = indexedDB.open("TiktokFix", 1);
request.onupgradeneeded = e => e.target.result.createObjectStore("vids", {keyPath: "id", autoIncrement: true});
request.onsuccess = e => { db = e.target.result; renderFeed(); };

function renderFeed() {
    const feed = document.getElementById('s-feed');
    feed.innerHTML = '';
    
    // Сначала показываем тестовые видео
    videos.forEach((src, i) => addVideoToDOM(src, 'test-' + i));
    
    // Затем загружаем пользовательские
    db.transaction("vids").objectStore("vids").getAll().onsuccess = e => {
        e.target.result.forEach(v => {
            const url = URL.createObjectURL(v.blob);
            addVideoToDOM(url, v.id);
        });
    };
}

function addVideoToDOM(src, id) {
    const card = document.createElement('div');
    card.className = 'v-card';
    const isLiked = likedList.includes(id) ? 'liked' : '';
    
    card.innerHTML = `
        <video src="${src}" loop playsinline></video>
        <div class="v-ui">
            <i class="fas fa-heart ${isLiked}" onclick="toggleLike('${id}', this)"></i>
            <i class="fas fa-comment"></i>
            <i class="fas fa-share"></i>
        </div>
    `;
    
    // Клик для игры/паузы
    card.onclick = (e) => {
        if(e.target.tagName !== 'I') {
            const v = card.querySelector('video');
            v.paused ? v.play() : v.pause();
        }
    };
    
    document.getElementById('s-feed').appendChild(card);
    observer.observe(card);
}

function toggleLike(id, el) {
    el.classList.toggle('liked');
    if(el.classList.contains('liked')) likedList.push(id);
    else likedList = likedList.filter(i => i !== id);
    localStorage.setItem('likes', JSON.stringify(likedList));
    document.getElementById('p-likes').innerText = likedList.length;
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('s-' + id).classList.add('active');
    if(id === 'profile') loadProfile();
}

function handleUpload(e) {
    const file = e.target.files[0];
    if(file) {
        const tx = db.transaction("vids", "readwrite");
        tx.objectStore("vids").add({blob: file});
        tx.oncomplete = () => location.reload();
    }
}

function loadProfile() {
    const grid = document.getElementById('p-grid');
    grid.innerHTML = '';
    db.transaction("vids").objectStore("vids").getAll().onsuccess = e => {
        e.target.result.forEach(v => {
            const url = URL.createObjectURL(v.blob);
            grid.innerHTML += `<div class="g-item"><video src="${url}#t=0.5"></video></div>`;
        });
    };
    document.getElementById('p-likes').innerText = likedList.length;
}

// Автозапуск видео при скролле
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        const v = entry.target.querySelector('video');
        if (entry.isIntersecting) v.play().catch(() => {});
        else v.pause();
    });
}, { threshold: 0.7 });
