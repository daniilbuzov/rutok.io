let db;
const tests = [
    "https://v.ftcdn.net/04/18/39/39/700_F_418393931_mI7N6L9mN8R8y5Zl4E7H8v9B2F5G6.mp4",
    "https://v.ftcdn.net/05/52/63/14/700_F_552631481_f9T7Y5jWn5Xq7zVl9f0jH3rWfGfQ6YmS_ST.mp4",
    "https://v.ftcdn.net/02/11/44/55/700_F_211445566_fGhJ1K2L3M4N5P6O7I8U.mp4"
];

const req = indexedDB.open("TikTokWhiteV2", 1);
req.onupgradeneeded = e => e.target.result.createObjectStore("vids", {autoIncrement: true});
req.onsuccess = e => { db = e.target.result; render(); };

function render() {
    const feed = document.getElementById('s-feed');
    feed.innerHTML = '';
    
    // Сначала бот-видео
    tests.forEach(url => addCard(url));
    
    // Потом твои видео
    db.transaction("vids").objectStore("vids").getAll().onsuccess = e => {
        e.target.result.forEach(file => addCard(URL.createObjectURL(file)));
    };
}

function addCard(src) {
    const card = document.createElement('div');
    card.className = 'v-card';
    card.innerHTML = `<video src="${src}" loop playsinline></video>
                      <div class="v-ui">
                        <i class="fas fa-heart" onclick="this.style.color='#fe2c55'"></i>
                        <i class="fas fa-comment"></i>
                      </div>`;
    card.onclick = () => { const v = card.querySelector('video'); v.paused ? v.play() : v.pause(); };
    document.getElementById('s-feed').appendChild(card);
    obs.observe(card);
}

function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('s-' + id).classList.add('active');
    if(id === 'profile') loadGrid();
}

function loadGrid() {
    const g = document.getElementById('p-grid');
    g.innerHTML = '';
    db.transaction("vids").objectStore("vids").getAll().onsuccess = e => {
        e.target.result.forEach(v => {
            g.innerHTML += `<div class="g-item"><video src="${URL.createObjectURL(v)}#t=0.1"></video></div>`;
        });
    };
}

function openPlusMenu() {
    if(window.innerWidth > 900) document.getElementById('f-in').click();
    else document.getElementById('m-plus').style.display = 'flex';
}

function save(e) {
    const file = e.target.files[0];
    if(file) {
        db.transaction("vids", "readwrite").objectStore("vids").add(file);
        setTimeout(() => location.reload(), 500);
    }
}

const obs = new IntersectionObserver(es => {
    es.forEach(e => { const v = e.target.querySelector('video'); e.isIntersecting ? v.play() : v.pause(); });
}, { threshold: 0.8 });
