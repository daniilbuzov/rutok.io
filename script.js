let db;
let currentUpload = null;

// Инициализация БД
const request = indexedDB.open("TikTokV5", 1);
request.onupgradeneeded = e => {
    e.target.result.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
};
request.onsuccess = e => { db = e.target.result; loadFeed(); };

// Загрузка видео
function startUpload(e) {
    currentUpload = e.target.files[0];
    if (!currentUpload) return;
    document.getElementById('previewVid').src = URL.createObjectURL(currentUpload);
    document.getElementById('uploadModal').style.display = 'flex';
}

function cancelUpload() {
    document.getElementById('uploadModal').style.display = 'none';
}

function finishUpload() {
    const desc = document.getElementById('descInp').value || "Без описания";
    const tx = db.transaction("videos", "readwrite");
    tx.objectStore("videos").add({ blob: currentUpload, desc: desc });
    tx.oncomplete = () => location.reload();
}

// Отображение ленты
function loadFeed() {
    const feed = document.getElementById('feed');
    feed.innerHTML = '';
    
    db.transaction("videos").objectStore("videos").getAll().onsuccess = e => {
        const videos = e.target.result.reverse();
        
        if (videos.length === 0) {
            feed.innerHTML = `<div style="padding-top:200px; text-align:center; opacity:0.5">
                <i class="fas fa-film" style="font-size:40px"></i><br><br>Лента пуста. Добавь видео!
            </div>`;
            return;
        }

        videos.forEach(item => {
            const url = URL.createObjectURL(item.blob);
            const card = document.createElement('div');
            card.className = 'video-item';
            card.innerHTML = `
                <video src="${url}" loop playsinline muted></video>
                <div class="side-actions">
                    <i class="fas fa-heart" onclick="this.style.color='#fe2c55'"></i>
                    <i class="fas fa-trash" onclick="removeVideo(${item.id})" style="font-size:18px; opacity:0.3"></i>
                </div>
                <div class="overlay-info">
                    <h3>@${localStorage.getItem('nick') || 'username'}</h3>
                    <p>${item.desc}</p>
                </div>
            `;
            
            card.onclick = (ev) => {
                if (ev.target.tagName !== 'I') {
                    const v = card.querySelector('video');
                    v.muted = false;
                    v.paused ? v.play() : v.pause();
                }
            };
            
            feed.appendChild(card);
            observer.observe(card);
        });
    };
}

// Профиль
function updateProfileData() {
    localStorage.setItem('nick', document.getElementById('userName').innerText);
    localStorage.setItem('bio', document.getElementById('userBio').innerText);
}

function changePfp(e) {
    const reader = new FileReader();
    reader.onload = () => {
        document.getElementById('userPfp').src = reader.result;
        localStorage.setItem('avatar', reader.result);
    };
    reader.readAsDataURL(e.target.files[0]);
}

function changeTab(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function removeVideo(id) {
    if (confirm("Удалить это видео?")) {
        db.transaction("videos", "readwrite").objectStore("videos").delete(id).onsuccess = () => location.reload();
    }
}

// Автоплей
const observer = new IntersectionObserver(ents => {
    ents.forEach(en => {
        const v = en.target.querySelector('video');
        en.isIntersecting ? v.play() : v.pause();
    });
}, { threshold: 0.7 });

window.onload = () => {
    document.getElementById('userName').innerText = localStorage.getItem('nick') || "@username";
    document.getElementById('userBio').innerText = localStorage.getItem('bio') || "Твое био...";
    if (localStorage.getItem('avatar')) document.getElementById('userPfp').src = localStorage.getItem('avatar');
};
