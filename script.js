let db;
let tempVideoFile = null;

// 1. Инициализация Базы Данных
const req = indexedDB.open("TikTokDB_V3", 1);
req.onupgradeneeded = e => e.target.result.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
req.onsuccess = e => { db = e.target.result; loadFeed(); };

// 2. Управление модальным окном
function openEditor(event) {
    tempVideoFile = event.target.files[0];
    if (!tempVideoFile) return;
    document.getElementById('previewVid').src = URL.createObjectURL(tempVideoFile);
    document.getElementById('uploadModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('uploadModal').style.display = 'none';
}

function confirmUpload() {
    const desc = document.getElementById('descInp').value || "Без описания";
    const tx = db.transaction("videos", "readwrite");
    tx.objectStore("videos").add({ file: tempVideoFile, desc: desc });
    tx.oncomplete = () => location.reload();
}

// 3. Загрузка ленты
function loadFeed() {
    const feed = document.getElementById('feed');
    feed.innerHTML = '';
    db.transaction("videos").objectStore("videos").getAll().onsuccess = e => {
        e.target.result.reverse().forEach(item => {
            const url = URL.createObjectURL(item.file);
            const card = document.createElement('div');
            card.className = 'v-card';
            card.innerHTML = `
                <video src="${url}" loop playsinline muted></video>
                <div class="v-info">
                    <h3>@${localStorage.getItem('userName') || 'user'}</h3>
                    <p>${item.desc}</p>
                </div>
            `;
            card.onclick = () => {
                const v = card.querySelector('video');
                v.muted = false;
                v.paused ? v.play() : v.pause();
            };
            feed.appendChild(card);
            observer.observe(card);
        });
    };
}

// 4. Профиль
function saveProfile() {
    localStorage.setItem('userName', document.getElementById('userName').innerText);
    localStorage.setItem('userBio', document.getElementById('userBio').innerText);
}

function updateAvatar(e) {
    const reader = new FileReader();
    reader.onload = () => {
        document.getElementById('userPfp').src = reader.result;
        localStorage.setItem('userAvatar', reader.result);
    };
    reader.readAsDataURL(e.target.files[0]);
}

function showTab(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// Автоплей
const observer = new IntersectionObserver(ents => {
    ents.forEach(en => {
        const v = en.target.querySelector('video');
        en.isIntersecting ? v.play() : v.pause();
    });
}, { threshold: 0.7 });

// Загрузка данных профиля
window.onload = () => {
    document.getElementById('userName').innerText = localStorage.getItem('userName') || "@твой_ник";
    document.getElementById('userBio').innerText = localStorage.getItem('userBio') || "Био...";
    if (localStorage.getItem('userAvatar')) document.getElementById('userPfp').src = localStorage.getItem('userAvatar');
};
