let db;
let currentVid = null;
let likes = JSON.parse(localStorage.getItem('t_likes')) || [];
let following = JSON.parse(localStorage.getItem('t_follows')) || [];
let comments = JSON.parse(localStorage.getItem('t_comments')) || {};

// 10 Тестовых видео разных категорий
const testVids = [
    { id: 'b1', user: '@nature_wow', desc: 'Красота гор 🏔️', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', pfp: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1' },
    { id: 'b2', user: '@chef_mario', desc: 'Лучший рецепт пасты 🍝', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', pfp: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2' },
    { id: 'b3', user: '@space_x', desc: 'Запуск ракеты в 4К 🚀', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', pfp: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3' },
    { id: 'b4', user: '@fitness_girl', desc: 'Утренняя тренировка 💪', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', pfp: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4' },
    { id: 'b5', user: '@gaming_pro', desc: 'Эпичный момент! 🎮', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', pfp: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5' },
    { id: 'b6', user: '@travel_blog', desc: 'Мой отпуск на Бали 🏝️', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', pfp: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6' },
    { id: 'b7', user: '@car_lover', desc: 'Звук мотора V8 🏎️', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', pfp: 'https://api.dicebear.com/7.x/avataaars/svg?seed=7' },
    { id: 'b8', user: '@funny_cats', desc: 'Кот против огурца 🐈', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackAds.mp4', pfp: 'https://api.dicebear.com/7.x/avataaars/svg?seed=8' },
    { id: 'b9', user: '@ocean_life', desc: 'Тайны морских глубин 🌊', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', pfp: 'https://api.dicebear.com/7.x/avataaars/svg?seed=9' },
    { id: 'b10', user: '@science_daily', desc: 'Как работает квантовый комп? 🧪', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4', pfp: 'https://api.dicebear.com/7.x/avataaars/svg?seed=10' }
];

const req = indexedDB.open("TikTokDB", 1);
req.onupgradeneeded = e => e.target.result.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
req.onsuccess = e => { db = e.target.result; init(); };

function init() {
    renderFeed();
}

// ЛЕНТА
function renderFeed() {
    const feed = document.getElementById('s-feed');
    feed.innerHTML = '';
    
    // Получаем свои видео из БД и объединяем с ботами
    db.transaction("videos").objectStore("videos").getAll().onsuccess = e => {
        const myVids = e.target.result.map(v => ({...v, user: '@me', pfp: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me', url: URL.createObjectURL(v.blob)}));
        const all = [...myVids, ...testVids].sort(() => Math.random() - 0.5);

        all.forEach(vid => {
            const card = document.createElement('div');
            card.className = 'v-card';
            card.innerHTML = `<video src="${vid.url}" loop playsinline muted></video>`;
            card.onclick = () => openViewer(vid);
            feed.appendChild(card);
            obs.observe(card);
        });
    };
}

// VIEWER
function openViewer(vid) {
    currentVid = vid;
    document.getElementById('viewer').style.display = 'block';
    const player = document.getElementById('v-video');
    player.src = vid.url;
    player.play();

    // UI
    document.getElementById('v-author-pfp').src = vid.pfp;
    document.querySelector('.v-author-block span').innerText = vid.user;
    document.getElementById('v-desc-text').innerText = vid.desc || 'Без описания';
    
    updateLikeUI();
    renderComments();
}

function handleLike() {
    if (likes.includes(currentVid.id)) likes = likes.filter(id => id !== currentVid.id);
    else likes.push(currentVid.id);
    localStorage.setItem('t_likes', JSON.stringify(likes));
    updateLikeUI();
}

function updateLikeUI() {
    const icon = document.getElementById('v-like-icon');
    icon.className = likes.includes(currentVid.id) ? 'fas fa-heart liked' : 'fas fa-heart';
}

function renderComments() {
    const list = document.getElementById('v-comm-list');
    list.innerHTML = '';
    const comms = comments[currentVid.id] || [{user: '@system', text: 'Будьте первым!'}];
    comms.forEach(c => {
        list.innerHTML += `<div class="comm-item"><b>${c.user}</b>${c.text}</div>`;
    });
}

function addComment() {
    const msg = document.getElementById('v-msg');
    if (!msg.value) return;
    if (!comments[currentVid.id]) comments[currentViewingId] = [];
    comments[currentVid.id] = comments[currentVid.id] || [];
    comments[currentVid.id].push({user: '@you', text: msg.value});
    localStorage.setItem('t_comments', JSON.stringify(comments));
    msg.value = '';
    renderComments();
}

// ПРОФИЛЬ
function openUserFromViewer() {
    closeViewer();
    showUserProfile(currentVid.user);
}

function showUserProfile(username) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('s-profile').classList.add('active');
    
    const isMe = username === '@me';
    document.getElementById('p-name').innerText = username;
    document.getElementById('follow-btn').style.display = isMe ? 'none' : 'block';
    
    // Поиск видео автора
    db.transaction("videos").objectStore("videos").getAll().onsuccess = e => {
        const myVids = e.target.result.map(v => ({...v, user: '@me', url: URL.createObjectURL(v.blob)}));
        const all = [...myVids, ...testVids];
        const userVids = all.filter(v => v.user === username);
        
        const grid = document.getElementById('p-grid');
        grid.innerHTML = '';
        userVids.forEach(v => {
            grid.innerHTML += `<div class="g-item" onclick='openViewer(${JSON.stringify(v)})'><video src="${v.url}#t=0.5"></video></div>`;
        });
        
        document.getElementById('p-vcount').innerText = userVids.length;
        document.getElementById('p-avatar').src = userVids[0]?.pfp || '';
    };
}

function showMyProfile() { showUserProfile('@me'); }
function showFeed() { 
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('s-feed').classList.add('active');
}

function closeViewer() {
    document.getElementById('viewer').style.display = 'none';
    document.getElementById('v-video').pause();
}

function handlePlus() { document.getElementById('f-vid').click(); }

function uploadFile(e) {
    const file = e.target.files[0];
    if (file) {
        const tx = db.transaction("videos", "readwrite");
        tx.objectStore("videos").add({ blob: file, id: 'my_'+Date.now(), desc: 'Моё новое видео' });
        tx.oncomplete = () => location.reload();
    }
}

const obs = new IntersectionObserver(ents => {
    ents.forEach(e => {
        const v = e.target.querySelector('video');
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
    });
}, { threshold: 0.8 });
