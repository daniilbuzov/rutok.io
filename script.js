let db;
let uploadFile = null;

// Инициализация БД
const req = indexedDB.open("TikTokCloud", 1);
req.onupgradeneeded = e => {
    db = e.target.result;
    db.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
};
req.onsuccess = e => { db = e.target.result; loadFeed(); };

// Выбор видео
function onFileSelected(e) {
    uploadFile = e.target.files[0];
    if (!uploadFile) return;
    document.getElementById('editorPrev').src = URL.createObjectURL(uploadFile);
    document.getElementById('uploadModal').style.display = 'flex';
}

function closeModal() { document.getElementById('uploadModal').style.display = 'none'; }

// Публикация
async function publishVideo() {
    const desc = document.getElementById('descInp').value || "Без описания";
    const data = { blob: uploadFile, desc: desc, date: Date.now() };
    
    const tx = db.transaction("videos", "readwrite");
    tx.objectStore("videos").add(data).onsuccess = () => location.reload();
}

// Загрузка ленты
function loadFeed() {
    const feed = document.getElementById('feed');
    db.transaction("videos").objectStore("videos").getAll().onsuccess = e => {
        e.target.result.reverse().forEach(item => {
            const url = URL.createObjectURL(item.blob);
            const card = document.createElement('div');
            card.className = 'video-card';
            card.innerHTML = `
                <video src="${url}" loop muted playsinline></video>
                <div class="side-btns">
                    <i class="fas fa-heart" onclick="this.style.color='#ff0050'"></i>
                    <i class="fas fa-comment"></i>
                    <i class="fas fa-trash" onclick="deleteVideo(${item.id})" style="opacity:0.3; font-size:18px"></i>
                </div>
                <div class="ui-layer">
                    <div class="video-desc">
                        <h3>@${localStorage.getItem('nick') || 'user'}</h3>
                        <p>${item.desc}</p>
                    </div>
                </div>
            `;
            
            card.onclick = (ev) => {
                if(ev.target.tagName !== 'I') {
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

const observer = new IntersectionObserver(ents => {
    ents.forEach(en => {
        const v = en.target.querySelector('video');
        en.isIntersecting ? v.play() : v.pause();
    });
}, { threshold: 0.8 });

// Функции профиля
function switchTab(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function saveProfileData() {
    localStorage.setItem('nick', document.getElementById('userName').innerText);
    localStorage.setItem('bio', document.getElementById('userBio').innerText);
}

function updatePfp(e) {
    const r = new FileReader();
    r.onload = () => {
        document.getElementById('userAvatar').src = r.result;
        localStorage.setItem('avatar', r.result);
    };
    r.readAsDataURL(e.target.files[0]);
}

window.onload = () => {
    document.getElementById('userName').innerText = localStorage.getItem('nick') || "@username";
    document.getElementById('userBio').innerText = localStorage.getItem('bio') || "Описание...";
    if(localStorage.getItem('avatar')) document.getElementById('userAvatar').src = localStorage.getItem('avatar');
};

function deleteVideo(id) {
    if(confirm("Удалить?")) {
        db.transaction("videos", "readwrite").objectStore("videos").delete(id).onsuccess = () => location.reload();
    }
}