let db;
let likes = JSON.parse(localStorage.getItem('user_likes')) || [];
let comments = JSON.parse(localStorage.getItem('user_comments')) || {}; 
let currentViewingId = null;

const bots = [
    { name: '@funny_bot', text: 'Ахаха, вот это да!', vid: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
    { name: '@tech_guy', text: 'Очень качественный монтаж!', vid: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
    { name: '@music_lover', text: 'Какой трек на фоне?', vid: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' }
];

const request = indexedDB.open("TikTokLocalV2", 1);
request.onupgradeneeded = e => {
    let d = e.target.result;
    if(!d.objectStoreNames.contains("videos")) d.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
};
request.onsuccess = e => { db = e.target.result; init(); };

async function init() {
    // Проверка на наличие ботов
    db.transaction("videos", "readwrite").objectStore("videos").getAll().onsuccess = e => {
        if (e.target.result.length === 0) {
            const tx = db.transaction("videos", "readwrite").objectStore("videos");
            bots.forEach((b, i) => tx.add({ id: 'bot_'+i, url: b.vid, user: b.name, desc: 'Бот-контент', isBot: true }));
            tx.oncomplete = () => loadApp();
        } else {
            loadApp();
        }
    };

    // Загрузка настроек пользователя
    const user = JSON.parse(localStorage.getItem('user_profile')) || { name: '@master_user', pfp: null };
    document.getElementById('my-name').innerText = user.name;
    if(user.pfp) document.getElementById('my-pfp').src = user.pfp;
}

function loadApp() {
    db.transaction("videos").objectStore("videos").getAll().onsuccess = e => {
        const allVids = e.target.result;
        renderFeed(allVids);
        renderProfile(allVids);
    };
}

function renderFeed(list) {
    const f = document.getElementById('s-feed');
    f.innerHTML = '';
    list.sort(() => Math.random() - 0.5).forEach(v => {
        const src = v.isBot ? v.url : URL.createObjectURL(v.blob);
        const card = document.createElement('div');
        card.className = 'v-card';
        card.innerHTML = `
            <video src="${src}" loop playsinline muted></video>
            <div class="v-actions">
                <i class="fas fa-heart ${likes.includes(v.id)?'liked':''}" onclick="toggleLike('${v.id}', this)"></i>
                <i class="fas fa-comment" onclick="openViewer('${v.id}', '${src}', '${v.user}')"></i>
            </div>
        `;
        card.onclick = (e) => { if(e.target.tagName !== 'I') { const vid = card.querySelector('video'); vid.muted=false; vid.paused?vid.play():vid.pause(); } };
        f.appendChild(card);
        observer.observe(card);
    });
}

function renderProfile(list) {
    const gMy = document.getElementById('g-my');
    const gLiked = document.getElementById('g-liked');
    gMy.innerHTML = ''; gLiked.innerHTML = '';

    list.forEach(v => {
        const src = v.isBot ? v.url : URL.createObjectURL(v.blob);
        const html = `<div class="grid-item" onclick="openViewer('${v.id}', '${src}', '${v.user}')"><video src="${src}#t=0.5" muted></video></div>`;
        if(!v.isBot) gMy.innerHTML += html;
        if(likes.includes(v.id)) gLiked.innerHTML += html;
    });

    document.getElementById('c-vids').innerText = list.filter(v => !v.isBot).length;
    document.getElementById('c-likes').innerText = likes.length;
}

// Функционал
function toggleLike(id, el) {
    el.classList.toggle('liked');
    if(el.classList.contains('liked')) { if(!likes.includes(id)) likes.push(id); }
    else { likes = likes.filter(l => l !== id); }
    localStorage.setItem('user_likes', JSON.stringify(likes));
    loadApp();
}

function openViewer(id, src, author) {
    currentViewingId = id;
    const modal = document.getElementById('video-viewer');
    const vid = document.getElementById('viewer-video');
    modal.style.display = 'block';
    vid.src = src;
    vid.play();
    document.getElementById('viewer-author').innerText = author;
    renderComments();
}

function closeViewer() {
    document.getElementById('video-viewer').style.display = 'none';
    document.getElementById('viewer-video').pause();
}

function renderComments() {
    const box = document.getElementById('comment-list');
    box.innerHTML = '';
    const comms = comments[currentViewingId] || [];
    
    // Если комментариев нет, боты пишут первые
    if(comms.length === 0) {
        bots.forEach(b => box.innerHTML += `<div class="comment"><b>${b.name}</b>: ${b.text}</div>`);
    } else {
        comms.forEach(c => box.innerHTML += `<div class="comment"><b>${c.user}</b>: ${c.text}</div>`);
    }
}

function addComment() {
    const inp = document.getElementById('comm-text');
    if(!inp.value) return;
    if(!comments[currentViewingId]) comments[currentViewingId] = [];
    comments[currentViewingId].push({ user: 'Вы', text: inp.value });
    localStorage.setItem('user_comments', JSON.stringify(comments));
    inp.value = '';
    renderComments();
}

function handleUpload(e) {
    const file = e.target.files[0];
    if(file) {
        const tx = db.transaction("videos", "readwrite");
        tx.objectStore("videos").add({ blob: file, user: document.getElementById('my-name').innerText, isBot: false });
        tx.oncomplete = () => location.reload();
    }
}

function saveProfile() {
    localStorage.setItem('user_profile', JSON.stringify({
        name: document.getElementById('my-name').innerText,
        pfp: document.getElementById('my-pfp').src
    }));
}

function handlePfp(e) {
    const file = e.target.files[0];
    if(file) {
        const r = new FileReader();
        r.onload = ev => { document.getElementById('my-pfp').src = ev.target.result; saveProfile(); };
        r.readAsDataURL(file);
    }
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('s-' + id).classList.add('active');
}

function switchGrid(type, el) {
    document.querySelectorAll('.video-grid').forEach(g => g.classList.remove('active-grid'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('g-' + type).classList.add('active-grid');
    el.classList.add('active');
}

const observer = new IntersectionObserver(ents => {
    ents.forEach(e => { const v = e.target.querySelector('video'); e.isIntersecting ? v.play() : v.pause(); });
}, { threshold: 0.8 });
