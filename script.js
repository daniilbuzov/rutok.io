let db;
let currentVideoId = null;
let likes = JSON.parse(localStorage.getItem('my_likes')) || [];
let comments = JSON.parse(localStorage.getItem('my_comments')) || {}; // {vid_id: [comm1, comm2]}

const botNames = ['@mister_joke', '@sigma_boy', '@elena_sunny', '@tech_guru', '@cat_lover'];
const botPhrases = ['Ого, круто!', 'Лайк однозначно 🔥', 'Как ты это сделал?', 'Просто топ!', 'Улыбнуло))'];
const stockVideos = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
];

const req = indexedDB.open("TikTokLocal", 3);
req.onupgradeneeded = e => {
    let d = e.target.result;
    if(!d.objectStoreNames.contains("videos")) d.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
};
req.onsuccess = e => { db = e.target.result; init(); };

function init() {
    // 1. Создаем ботов, если лента пуста
    db.transaction("videos", "readwrite").objectStore("videos").getAll().onsuccess = e => {
        if(e.target.result.length < 5) createBots();
        else loadApp();
    };
    
    // Загрузка профиля
    const user = JSON.parse(localStorage.getItem('my_user')) || { name: '@local_user', pfp: null };
    document.getElementById('user-name').innerText = user.name;
}

function createBots() {
    const tx = db.transaction("videos", "readwrite").objectStore("videos");
    for(let i=0; i<10; i++) {
        tx.add({
            url: stockVideos[i % stockVideos.length],
            user: botNames[Math.floor(Math.random()*botNames.length)],
            desc: "Бот-контент #" + i,
            isBot: true,
            id: 'bot_' + i
        });
    }
    tx.oncomplete = () => loadApp();
}

function loadApp() {
    db.transaction("videos").objectStore("videos").getAll().onsuccess = e => {
        const all = e.target.result;
        renderFeed(all);
        renderProfile(all);
    };
}

// Рендер ленты
function renderFeed(list) {
    const feed = document.getElementById('s-feed');
    feed.innerHTML = '';
    list.sort(() => Math.random() - 0.5).forEach(vid => {
        const src = vid.isBot ? vid.url : URL.createObjectURL(vid.blob);
        const div = document.createElement('div');
        div.className = 'v-card';
        div.innerHTML = `
            <video src="${src}" loop playsinline muted></video>
            <div class="v-ui">
                <i class="fas fa-heart ${likes.includes(vid.id)?'liked':''}" onclick="toggleLike('${vid.id}', this)"></i>
                <i class="fas fa-comment" onclick="openViewer('${vid.id}', '${src}')"></i>
            </div>
        `;
        div.onclick = (e) => { if(e.target.tagName !== 'I') { const v = div.querySelector('video'); v.muted=false; v.paused?v.play():v.pause(); } };
        feed.appendChild(div);
        obs.observe(div);
    });
}

// Лайки и Комменты
function toggleLike(id, el) {
    el.classList.toggle('liked');
    if(el.classList.contains('liked')) likes.push(id);
    else likes = likes.filter(l => l !== id);
    localStorage.setItem('my_likes', JSON.stringify(likes));
    loadApp();
}

function openViewer(id, src) {
    currentVideoId = id;
    document.getElementById('viewer').style.display = 'block';
    const player = document.getElementById('view-player');
    player.src = src;
    player.play();
    renderComments();
}

function renderComments() {
    const list = document.getElementById('comm-list');
    list.innerHTML = '';
    const comms = comments[currentVideoId] || [];
    
    // Добавляем случайные комменты ботов, если пусто
    if(comms.length === 0) {
        for(let i=0; i<3; i++) comms.push({user: botNames[i], text: botPhrases[i]});
    }

    comms.forEach(c => {
        list.innerHTML += `<div class="comm-item"><b>${c.user}</b>: ${c.text}</div>`;
    });
}

function postComment() {
    const inp = document.getElementById('new-comm');
    if(!inp.value) return;
    if(!comments[currentVideoId]) comments[currentVideoId] = [];
    comments[currentVideoId].push({ user: 'Вы', text: inp.value });
    localStorage.setItem('my_comments', JSON.stringify(comments));
    inp.value = '';
    renderComments();
}

function closeViewer() {
    document.getElementById('viewer').style.display = 'none';
    document.getElementById('view-player').pause();
}

// Профиль: клик на видео
function renderProfile(list) {
    const gMy = document.getElementById('g-my');
    const gLiked = document.getElementById('g-liked');
    gMy.innerHTML = ''; gLiked.innerHTML = '';
    
    list.forEach(v => {
        const src = v.isBot ? v.url : URL.createObjectURL(v.blob);
        const item = `<div class="g-item" onclick="openViewer('${v.id}', '${src}')"><video src="${src}#t=0.1" muted></video></div>`;
        if(!v.isBot) gMy.innerHTML += item;
        if(likes.includes(v.id)) gLiked.innerHTML += item;
    });
    document.getElementById('v-count').innerText = list.filter(v=>!v.isBot).length;
    document.getElementById('l-count').innerText = likes.length;
}

// Загрузка своего видео
function uploadVideo(e) {
    const file = e.target.files[0];
    if(file) {
        const tx = db.transaction("videos", "readwrite");
        tx.objectStore("videos").add({ blob: file, user: 'Вы', desc: 'Мое видео', isBot: false });
        tx.oncomplete = () => location.reload();
    }
}

// Навигация
function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('s-'+id).classList.add('active');
    document.querySelectorAll('.pc-nav-item').forEach(i => i.classList.remove('active'));
}

function setGrid(type, el) {
    document.querySelectorAll('.grid').forEach(g => g.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('g-'+type).classList.add('active');
    el.classList.add('active');
}

const obs = new IntersectionObserver(es => {
    es.forEach(e => { const v = e.target.querySelector('video'); e.isIntersecting ? v.play() : v.pause(); });
}, { threshold: 0.7 });
