let db;
const bots = [
    "https://v.ftcdn.net/04/18/39/39/700_F_418393931_mI7N6L9mN8R8y5Zl4E7H8v9B2F5G6.mp4",
    "https://v.ftcdn.net/02/11/44/55/700_F_211445566_fGhJ1K2L3M4N5P6O7I8U.mp4",
    "https://v.ftcdn.net/05/52/63/14/700_F_552631481_f9T7Y5jWn5Xq7zVl9f0jH3rWfGfQ6YmS_ST.mp4"
];

const req = indexedDB.open("TikTokFinal", 1);
req.onupgradeneeded = e => e.target.result.createObjectStore("vids", { keyPath: "id", autoIncrement: true });
req.onsuccess = e => { db = e.target.result; loadFeed(); };

function loadFeed() {
    const feed = document.getElementById('s-feed');
    feed.innerHTML = '';
    bots.forEach(src => addVideo(src, feed));
    
    db.transaction("vids").objectStore("vids").getAll().onsuccess = e => {
        e.target.result.forEach(v => addVideo(URL.createObjectURL(v.blob), feed));
    };
}

function addVideo(src, parent) {
    const card = document.createElement('div');
    card.className = 'v-card';
    card.innerHTML = `<video src="${src}" loop playsinline></video>
                      <div class="v-ui"><i class="fas fa-heart" onclick="this.style.color='#fe2c55'"></i><i class="fas fa-comment"></i></div>`;
    card.onclick = () => { const v = card.querySelector('video'); v.paused ? v.play() : v.pause(); };
    parent.appendChild(card);
    obs.observe(card);
}

function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('s-' + id).classList.add('active');
    if (id === 'profile') loadProfile();
}

function upload(e) {
    const file = e.target.files[0];
    if (file) {
        db.transaction("vids", "readwrite").objectStore("vids").add({ blob: file });
        setTimeout(() => location.reload(), 500);
    }
}

function loadProfile() {
    const grid = document.getElementById('p-grid');
    grid.innerHTML = '';
    db.transaction("vids").objectStore("vids").getAll().onsuccess = e => {
        const list = e.target.result;
        document.getElementById('p-v-count').innerText = list.length;
        list.forEach(v => {
            const div = document.createElement('div');
            div.className = 'g-item';
            div.innerHTML = `<video src="${URL.createObjectURL(v.blob)}#t=0.5"></video>
                             <button class="del" onclick="del(${v.id})">Удалить</button>`;
            grid.appendChild(div);
        });
    };
}

function del(id) {
    if(confirm("Удалить видео?")) {
        db.transaction("vids", "readwrite").objectStore("vids").delete(id);
        setTimeout(() => loadProfile(), 300);
    }
}

const obs = new IntersectionObserver(es => {
    es.forEach(e => { const v = e.target.querySelector('video'); e.isIntersecting ? v.play() : v.pause(); });
}, { threshold: 0.8 });
