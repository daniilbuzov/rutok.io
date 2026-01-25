let db;
let currentVidId = null;
let likes = JSON.parse(localStorage.getItem('L')) || [];
let comms = JSON.parse(localStorage.getItem('C')) || {};

// 10 Тестовых видео (Разные авторы и контент)
const bots = [
    {id: 'b1', user: '@nature', desc: 'Водопад 🌊', url: 'https://v.ftcdn.net/05/52/63/14/700_F_552631481_f9T7Y5jWn5Xq7zVl9f0jH3rWfGfQ6YmS_ST.mp4'},
    {id: 'b2', user: '@cooking', desc: 'Пицца 🍕', url: 'https://v.ftcdn.net/02/94/80/34/700_F_294803405_T0L9i8Zq5mPqS2e9r7H6A5GjN1XyW.mp4'},
    {id: 'b3', user: '@cars', desc: 'Дрифт 🏎️', url: 'https://v.ftcdn.net/04/18/39/39/700_F_418393931_mI7N6L9mN8R8y5Zl4E7H8v9B2F5G6.mp4'},
    {id: 'b4', user: '@space', desc: 'Звезды ✨', url: 'https://v.ftcdn.net/01/82/73/45/700_F_182734567_mXyZ1W2V3U4T5S6R7Q8P9.mp4'},
    {id: 'b5', user: '@dance', desc: 'Танцы 💃', url: 'https://v.ftcdn.net/03/44/12/34/700_F_344123456_nBvC1XzZ2W3Y4U5I6O7P8.mp4'},
    {id: 'b6', user: '@cats', desc: 'Котик 🐈', url: 'https://v.ftcdn.net/02/11/44/55/700_F_211445566_fGhJ1K2L3M4N5P6O7I8U.mp4'},
    {id: 'b7', user: '@travel', desc: 'Горы 🏔️', url: 'https://v.ftcdn.net/04/55/22/11/700_F_455221133_qWeR1T2Y3U4I5O6P7A8S.mp4'},
    {id: 'b8', user: '@sport', desc: 'Гол! ⚽', url: 'https://v.ftcdn.net/01/22/33/44/700_F_122334455_zXcV1B2N3M4L5K6J7H8G.mp4'},
    {id: 'b9', user: '@art', desc: 'Рисование 🎨', url: 'https://v.ftcdn.net/05/66/77/88/700_F_566778899_pOiU1Y2T3R4E5W6Q7A8S.mp4'},
    {id: 'b10', user: '@tech', desc: 'Робот 🤖', url: 'https://v.ftcdn.net/02/33/44/11/700_F_233441122_lKjH1G2F3D4S5A6P7O8I.mp4'}
];

const req = indexedDB.open("TikTokV3", 1);
req.onupgradeneeded = e => e.target.result.createObjectStore("v", { keyPath: "id", autoIncrement: true });
req.onsuccess = e => { db = e.target.result; load(); };

function load() {
    db.transaction("v").objectStore("v").getAll().onsuccess = e => {
        const myVids = e.target.result.map(v => ({...v, user: '@me', url: URL.createObjectURL(v.blob)}));
        renderFeed([...myVids, ...bots]);
    };
}

function renderFeed(list) {
    const f = document.getElementById('s-feed');
    f.innerHTML = '';
    list.forEach(v => {
        const div = document.createElement('div');
        div.className = 'v-card';
        div.innerHTML = `
            <video src="${v.url}" loop playsinline></video>
            <div class="v-ui">
                <i class="fas fa-heart ${likes.includes(v.id)?'liked':''}" onclick="like('${v.id}', this)"></i>
                <i class="fas fa-comment" onclick="openComments('${v.id}')"></i>
            </div>
            <div style="position:absolute; bottom:20px; left:15px; text-shadow:1px 1px 5px #000">
                <b onclick="showScreen('profile')" style="cursor:pointer">${v.user}</b>
                <p>${v.desc || ''}</p>
            </div>
        `;
        div.onclick = (e) => { if(e.target.tagName !== 'I' && e.target.tagName !== 'B') { const vid = div.querySelector('video'); vid.paused ? vid.play() : vid.pause(); } };
        f.appendChild(div);
        obs.observe(div);
    });
}

function like(id, el) {
    el.classList.toggle('liked');
    likes.includes(id) ? likes = likes.filter(i => i !== id) : likes.push(id);
    localStorage.setItem('L', JSON.stringify(likes));
}

function openComments(id) {
    currentVidId = id;
    document.getElementById('comm-side').style.display = 'flex';
    renderComms();
}

function closeComments() { document.getElementById('comm-side').style.display = 'none'; }

function renderComms() {
    const list = document.getElementById('comm-list');
    list.innerHTML = (comms[currentVidId] || []).map(c => `<p style="margin-bottom:10px"><b>User:</b> ${c}</p>`).join('') || 'Нет комментариев';
}

function sendComment() {
    const msg = document.getElementById('comm-msg');
    if (!msg.value) return;
    if (!comms[currentVidId]) comms[currentVidId] = [];
    comms[currentVidId].push(msg.value);
    localStorage.setItem('C', JSON.stringify(comms));
    msg.value = '';
    renderComms();
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('s-' + id).classList.add('active');
    if (id === 'profile') loadProfile();
}

function loadProfile() {
    db.transaction("v").objectStore("v").getAll().onsuccess = e => {
        const grid = document.getElementById('p-grid');
        grid.innerHTML = e.target.result.map(v => `<div class="grid-item"><video src="${URL.createObjectURL(v.blob)}"></video></div>`).join('');
        document.getElementById('p-v-count').innerText = e.target.result.length;
    };
}

function handlePlus() { document.getElementById('f-vid').click(); }

function uploadFile(e) {
    const file = e.target.files[0];
    if (file) {
        db.transaction("v", "readwrite").objectStore("v").add({blob: file, id: 'my'+Date.now()});
        setTimeout(() => location.reload(), 500);
    }
}

const obs = new IntersectionObserver(es => {
    es.forEach(e => { const v = e.target.querySelector('video'); e.isIntersecting ? v.play() : v.pause(); });
}, { threshold: 0.8 });
