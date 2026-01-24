let db;
let likedList = JSON.parse(localStorage.getItem('t_likes')) || [];
let currentFile = null;
const stock = "https://v.ftcdn.net/05/52/63/14/700_F_552631481_f9T7Y5jWn5Xq7zVl9f0jH3rWfGfQ6YmS_ST.mp4";

// 1. Инициализация Базы Данных
const req = indexedDB.open("TikTokProject", 1);
req.onupgradeneeded = e => e.target.result.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
req.onsuccess = e => { db = e.target.result; init(); };

function init() {
    // Загрузка ника и фото
    const user = JSON.parse(localStorage.getItem('t_user')) || { name: '@username', pfp: null };
    document.getElementById('view-name').innerText = user.name;
    if(user.pfp) document.getElementById('view-pfp').src = user.pfp;

    loadContent();
}

// 2. Рендер Ленты и Профиля
function loadContent() {
    db.transaction("videos").objectStore("videos").getAll().onsuccess = e => {
        let vids = e.target.result || [];
        let all = [...vids.reverse()];
        
        // Добавляем 20 тестовых
        for(let i=0; i<20; i++) {
            all.push({ id: 't'+i, url: stock, desc: 'Тестовое видео '+(i+1), isTest: true });
        }

        renderAll(all);
    };
}

function renderAll(list) {
    const feed = document.getElementById('s-feed');
    const gAll = document.getElementById('g-all');
    const gLiked = document.getElementById('g-liked');
    
    feed.innerHTML = ''; gAll.innerHTML = ''; gLiked.innerHTML = '';

    list.forEach(v => {
        const src = v.isTest ? v.url : URL.createObjectURL(v.blob);
        const isL = likedList.includes(v.id);

        // Лента
        const card = document.createElement('div');
        card.className = 'v-card';
        card.innerHTML = `
            <video src="${src}" loop playsinline muted></video>
            <div class="v-ui"><i class="fas fa-heart ${isL?'liked':''}" onclick="doLike(this,'${v.id}')"></i></div>
            <div class="v-info"><h3>${v.isTest?'@system':document.getElementById('view-name').innerText}</h3><p>${v.desc||''}</p></div>
        `;
        card.onclick = (ev) => { if(ev.target.tagName !== 'I') { const vid = card.querySelector('video'); vid.muted=false; vid.paused?vid.play():vid.pause(); } };
        feed.appendChild(card);
        obs.observe(card);

        // Профиль
        const item = `<div class="g-item"><video src="${src}" muted></video></div>`;
        gAll.innerHTML += item;
        if(isL) gLiked.innerHTML += item;
    });

    document.getElementById('count-vids').innerText = list.length;
    document.getElementById('count-likes').innerText = likedList.length;
}

// 3. Функции
function doLike(el, id) {
    el.classList.toggle('liked');
    if(el.classList.contains('liked')) { if(!likedList.includes(id)) likedList.push(id); }
    else { likedList = likedList.filter(i => i !== id); }
    localStorage.setItem('t_likes', JSON.stringify(likedList));
    loadContent(); // Обновляем профиль
}

function saveUser() {
    const name = document.getElementById('view-name').innerText;
    const pfp = document.getElementById('view-pfp').src;
    localStorage.setItem('t_user', JSON.stringify({ name, pfp }));
}

function updatePfp(e) {
    const f = e.target.files[0];
    if(f) {
        const r = new FileReader();
        r.onload = ev => { document.getElementById('view-pfp').src = ev.target.result; saveUser(); };
        r.readAsDataURL(f);
    }
}

function preUpload(e) { 
    currentFile = e.target.files[0]; 
    if(currentFile) document.getElementById('modal-desc').style.display = 'flex'; 
}

function finishUpload() {
    const desc = document.getElementById('inp-desc').value;
    const tx = db.transaction("videos", "readwrite");
    tx.objectStore("videos").add({ blob: currentFile, desc });
    tx.oncomplete = () => location.reload();
}

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

const obs = new IntersectionObserver(ents => {
    ents.forEach(e => { const v = e.target.querySelector('video'); e.isIntersecting ? v.play() : v.pause(); });
}, { threshold: 0.6 });
