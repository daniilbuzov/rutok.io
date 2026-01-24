let localDB;
let activeLikes = JSON.parse(localStorage.getItem('likes_v10')) || [];
let tempUpload = null;

// Стабильные CDN ссылки
const TEST_VIDS = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
];

// Инициализация БД
const dbReq = indexedDB.open("TikTokProEngine", 2);
dbReq.onupgradeneeded = e => {
    let db = e.target.result;
    if (!db.objectStoreNames.contains("videos")) db.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
};
dbReq.onsuccess = e => { localDB = e.target.result; initApp(); };

function initApp() {
    // Загрузка настроек юзера
    const userData = JSON.parse(localStorage.getItem('app_user')) || { name: '@web_developer', pfp: null };
    document.getElementById('user-name').innerText = userData.name;
    if(userData.pfp) document.getElementById('user-pfp').src = userData.pfp;
    
    refreshApp();
}

function refreshApp() {
    localDB.transaction("videos").objectStore("videos").getAll().onsuccess = e => {
        const myVideos = e.target.result || [];
        let masterList = [...myVideos.reverse()];
        
        // Создаем 3 видео
        for(let i=0; i<3; i++) {
            masterList.push({ id: 'srv_'+i, url: TEST_VIDS[i % TEST_VIDS.length], isSrv: true, desc: 'тестовое видио ' + (i+1) });
        }
        renderContent(masterList);
    };
}

function renderContent(list) {
    const feed = document.getElementById('screen-feed');
    const gMine = document.getElementById('grid-mine');
    const gLiked = document.getElementById('grid-liked');
    
    feed.innerHTML = ''; gMine.innerHTML = ''; gLiked.innerHTML = '';

    list.forEach(item => {
        const vUrl = item.isSrv ? item.url : URL.createObjectURL(item.blob);
        const isLiked = activeLikes.includes(item.id);

        // Карточка в ленту
        const card = document.createElement('div');
        card.className = 'video-box';
        card.innerHTML = `
            <video src="${vUrl}" loop playsinline muted preload="auto" webkit-playsinline></video>
            <div class="ui-side">
                <i class="fas fa-heart ${isLiked?'heart-on':''}" onclick="hitLike(this,'${item.id}')"></i>
                <i class="fas fa-comment"></i>
            </div>
            <div class="ui-text">
                <h3>${item.isSrv?'@trending':document.getElementById('user-name').innerText}</h3>
                <p>${item.desc || '...'}</p>
            </div>
        `;

        // Клик: Звук + Пауза
        card.onclick = (e) => {
            if(e.target.tagName === 'I') return;
            const v = card.querySelector('video');
            v.muted = false; // Включаем звук
            v.paused ? v.play() : v.pause();
        };

        feed.appendChild(card);
        observer.observe(card);

        // В сетку профиля
        const gridBox = `<div class="grid-cell"><video src="${vUrl}" muted></video></div>`;
        if(!item.isSrv) gMine.innerHTML += gridBox;
        if(isLiked) gLiked.innerHTML += gridBox;
    });

    document.getElementById('vid-count').innerText = list.filter(v => !v.isSrv).length;
    document.getElementById('like-count').innerText = activeLikes.length;
}

// Функции Лайка и Профиля
function hitLike(el, id) {
    el.classList.toggle('heart-on');
    if(el.classList.contains('heart-on')) {
        if(!activeLikes.includes(id)) activeLikes.push(id);
    } else {
        activeLikes = activeLikes.filter(val => val !== id);
    }
    localStorage.setItem('likes_v10', JSON.stringify(activeLikes));
    refreshApp();
}

function updateUserData() {
    localStorage.setItem('app_user', JSON.stringify({
        name: document.getElementById('user-name').innerText,
        pfp: document.getElementById('user-pfp').src
    }));
}

function changeAvatar(e) {
    const f = e.target.files[0];
    if(f) {
        const r = new FileReader();
        r.onload = ev => { document.getElementById('user-pfp').src = ev.target.result; updateUserData(); };
        r.readAsDataURL(f);
    }
}

// Загрузка
function startUpload(e) { 
    tempUpload = e.target.files[0]; 
    if(tempUpload) document.getElementById('upload-modal').style.display = 'flex'; 
}

function saveVideoData() {
    const d = document.getElementById('desc-inp').value;
    const tx = localDB.transaction("videos", "readwrite");
    tx.objectStore("videos").add({ blob: tempUpload, desc: d });
    tx.oncomplete = () => location.reload();
}

// Навигация
function navigate(to) {
    document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + to).classList.add('active');
}

function changeGrid(type, btn) {
    document.querySelectorAll('.grid-display').forEach(g => g.classList.remove('active-grid'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('grid-' + type).classList.add('active-grid');
    btn.classList.add('active');
}

// Автоплей
const observer = new IntersectionObserver(ents => {
    ents.forEach(en => {
        const v = en.target.querySelector('video');
        if(en.isIntersecting) {
            v.play().catch(() => console.log("Блокировка автоплея"));
        } else {
            v.pause();
        }
    });
}, { threshold: 0.8 });

