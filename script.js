let db;
let likedList = JSON.parse(localStorage.getItem('t_likes_v4')) || [];
let currentFile = null;

// Стабильные тестовые видео (Sample MP4)
const stock = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
];

const req = indexedDB.open("TikTokDatabase", 1);
req.onupgradeneeded = e => e.target.result.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
req.onsuccess = e => { db = e.target.result; init(); };

function init() {
    const user = JSON.parse(localStorage.getItem('t_user')) || { name: '@web_hero', pfp: null };
    document.getElementById('view-name').innerText = user.name;
    if(user.pfp) document.getElementById('view-pfp').src = user.pfp;
    loadContent();
}

function loadContent() {
    db.transaction("videos").objectStore("videos").getAll().onsuccess = e => {
        let userVids = e.target.result || [];
        let all = [...userVids.reverse()];
        
        // Добавляем 20 видео (смесь своих и стабильных тестовых)
        for(let i=0; i<20; i++) {
            all.push({ 
                id: 'test_'+i, 
                url: stock[i % stock.length], 
                desc: 'Стабильное видео #' + (i+1), 
                isTest: true 
            });
        }
        render(all);
    };
}

function render(list) {
    const feed = document.getElementById('s-feed');
    const gAll = document.getElementById('g-all');
    const gLiked = document.getElementById('g-liked');
    
    feed.innerHTML = ''; gAll.innerHTML = ''; gLiked.innerHTML = '';

    list.forEach(v => {
        const src = v.isTest ? v.url : URL.createObjectURL(v.blob);
        const isL = likedList.includes(v.id);

        // Создаем карточку ленты
        const card = document.createElement('div');
        card.className = 'v-card';
        card.innerHTML = `
            <video src="${src}" loop playsinline muted preload="metadata"></video>
            <div class="v-ui"><i class="fas fa-heart ${isL?'liked':''}" onclick="doLike(this,'${v.id}')"></i></div>
            <div class="v-info"><h3>${v.isTest?'@global_feed':document.getElementById('view-name').innerText}</h3><p>${v.desc||''}</p></div>
        `;

        // Клик для Play/Pause и звука
        card.onclick = (ev) => {
            if(ev.target.tagName === 'I') return;
            const vid = card.querySelector('video');
            vid.muted = false; // Включаем звук при взаимодействии
            vid.paused ? vid.play().catch(e=>console.log("Play failed")) : vid.pause();
        };

        feed.appendChild(card);
        obs.observe(card);

        // Добавляем в сетку профиля
        const gridItem = `<div class="g-item"><video src="${src}" muted></video></div>`;
        gAll.innerHTML += gridItem;
        if(isL) gLiked.innerHTML += gridItem;
    });

    document.getElementById('count-vids').innerText = list.length;
    document.getElementById('count-likes').innerText = likedList.length;
}

// Лайки
function doLike(el, id) {
    el.classList.toggle('liked');
    if(el.classList.contains('liked')) {
        if(!likedList.includes(id)) likedList.push(id);
    } else {
        likedList = likedList.filter(i => i !== id);
    }
    localStorage.setItem('t_likes_v4', JSON.stringify(likedList));
    // Небольшая задержка перед обновлением профиля для плавности
    setTimeout(loadContent, 200);
}

// Работа с профилем
function saveUser() {
    localStorage.setItem('t_user', JSON.stringify({
        name: document.getElementById('view-name').innerText,
        pfp: document.getElementById('view-pfp').src
    }));
}

function updatePfp(e) {
    const f = e.target.files[0];
    if(f) {
        const r = new FileReader();
        r.onload = ev => { document.getElementById('view-pfp').src = ev.target.result; saveUser(); };
        r.readAsDataURL(f);
    }
}

// Загрузка видео
function preUpload(e) { 
    currentFile = e.target.files[0]; 
    if(currentFile) document.getElementById('modal-desc').style.display = 'flex'; 
}

function finishUpload() {
    const desc = document.getElementById('inp-desc').value;
    const tx = db.transaction("videos", "readwrite");
    tx.objectStore("videos").add({ blob: currentFile, desc: desc, date: Date.now() });
    tx.oncomplete = () => location.reload();
}

// Навигация
function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('s-' + id).classList.add('active');
}

function setGrid(type, el) {
    document.querySelectorAll('.grid').forEach(g => g.classList.remove('active'));
    document.querySelectorAll('.p-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('g-' + type).classList.add('active');
    el.classList.add('active');
}

// Автоплей при скролле
const obs = new IntersectionObserver(ents => {
    ents.forEach(e => {
        const v = e.target.querySelector('video');
        if(e.isIntersecting) {
            v.play().catch(err => console.log("Браузер заблокировал автоплей"));
        } else {
            v.pause();
        }
    });
}, { threshold: 0.7 });
