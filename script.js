let db;
const testVids = [
    "https://v.ftcdn.net/04/18/39/39/700_F_418393931_mI7N6L9mN8R8y5Zl4E7H8v9B2F5G6.mp4",
    "https://v.ftcdn.net/02/11/44/55/700_F_211445566_fGhJ1K2L3M4N5P6O7I8U.mp4"
];

const req = indexedDB.open("TikTokV4", 1);
req.onupgradeneeded = e => e.target.result.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
req.onsuccess = e => { db = e.target.result; renderFeed(); };

function renderFeed() {
    const feed = document.getElementById('s-feed');
    feed.innerHTML = '';
    
    // Сначала тестовые
    testVids.forEach(src => addCard(src, feed));
    
    // Потом твои
    db.transaction("videos").objectStore("videos").getAll().onsuccess = e => {
        e.target.result.forEach(v => {
            const url = URL.createObjectURL(v.blob);
            addCard(url, feed);
        });
    };
}

function addCard(src, parent) {
    const card = document.createElement('div');
    card.className = 'v-card';
    card.innerHTML = `<video src="${src}" loop playsinline></video>
                      <div class="side-ui"><i class="fas fa-heart"></i><i class="fas fa-comment"></i></div>`;
    card.onclick = () => { const v = card.querySelector('video'); v.paused ? v.play() : v.pause(); };
    parent.appendChild(card);
    obs.observe(card);
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('s-' + id).classList.add('active');
    if (id === 'profile') renderProfile();
}

function handleUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const tx = db.transaction("videos", "readwrite");
        tx.objectStore("videos").add({ blob: file });
        tx.oncomplete = () => { renderFeed(); showScreen('profile'); };
    }
}

// НОВАЯ ФУНКЦИЯ: РЕНДЕР ПРОФИЛЯ С УДАЛЕНИЕМ
function renderProfile() {
    const grid = document.getElementById('p-grid');
    grid.innerHTML = '';
    db.transaction("videos").objectStore("videos").getAll().onsuccess = e => {
        const vids = e.target.result;
        document.getElementById('v-count').innerText = vids.length;
        vids.forEach(v => {
            const item = document.createElement('div');
            item.className = 'grid-item';
            item.innerHTML = `
                <video src="${URL.createObjectURL(v.blob)}#t=0.5"></video>
                <button class="del-btn" onclick="deleteVideo(${v.id})">Удалить</button>
            `;
            grid.appendChild(item);
        });
    };
}

// ФУНКЦИЯ УДАЛЕНИЯ
function deleteVideo(id) {
    if (confirm("Удалить это видео?")) {
        const tx = db.transaction("videos", "readwrite");
        tx.objectStore("videos").delete(id);
        tx.oncomplete = () => renderProfile();
    }
}

const obs = new IntersectionObserver(es => {
    es.forEach(e => { const v = e.target.querySelector('video'); e.isIntersecting ? v.play() : v.pause(); });
}, { threshold: 0.8 });
