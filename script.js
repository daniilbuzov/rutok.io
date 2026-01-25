let db;
let likes = JSON.parse(localStorage.getItem('L_DB')) || [];

// 10 Тестовых видео
const testVids = [
    {id: 't1', user: '@cat_life', desc: 'Милый котик 🐈', url: 'https://v.ftcdn.net/02/11/44/55/700_F_211445566_fGhJ1K2L3M4N5P6O7I8U.mp4'},
    {id: 't2', user: '@chef', desc: 'Готовим бургер 🍔', url: 'https://v.ftcdn.net/02/94/80/34/700_F_294803405_T0L9i8Zq5mPqS2e9r7H6A5GjN1XyW.mp4'},
    {id: 't3', user: '@nature', desc: 'Красивый лес 🌲', url: 'https://v.ftcdn.net/05/52/63/14/700_F_552631481_f9T7Y5jWn5Xq7zVl9f0jH3rWfGfQ6YmS_ST.mp4'},
    {id: 't4', user: '@fast_cars', desc: 'Суперкар 🏎️', url: 'https://v.ftcdn.net/04/18/39/39/700_F_418393931_mI7N6L9mN8R8y5Zl4E7H8v9B2F5G6.mp4'},
    {id: 't5', user: '@travel', desc: 'Вид на море 🌊', url: 'https://v.ftcdn.net/04/55/22/11/700_F_455221133_qWeR1T2Y3U4I5O6P7A8S.mp4'},
    {id: 't6', user: '@tech', desc: 'Новый гаджет 📱', url: 'https://v.ftcdn.net/02/33/44/11/700_F_233441122_lKjH1G2F3D4S5A6P7O8I.mp4'},
    {id: 't7', user: '@art', desc: 'Рисуем портрет 🎨', url: 'https://v.ftcdn.net/05/66/77/88/700_F_566778899_pOiU1Y2T3R4E5W6Q7A8S.mp4'},
    {id: 't8', user: '@fitness', desc: 'Тренировка 💪', url: 'https://v.ftcdn.net/01/22/33/44/700_F_122334455_zXcV1B2N3M4L5K6J7H8G.mp4'},
    {id: 't9', user: '@dance', desc: 'Крутой танец 💃', url: 'https://v.ftcdn.net/03/44/12/34/700_F_344123456_nBvC1XzZ2W3Y4U5I6O7P8.mp4'},
    {id: 't10', user: '@space', desc: 'Луна в телескопе 🌕', url: 'https://v.ftcdn.net/01/82/73/45/700_F_182734567_mXyZ1W2V3U4T5S6R7Q8P9.mp4'}
];

const openDB = indexedDB.open("TikTokDB", 1);
openDB.onupgradeneeded = e => e.target.result.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
openDB.onsuccess = e => { db = e.target.result; load(); };

function load() {
    db.transaction("videos").objectStore("videos").getAll().onsuccess = e => {
        const myVids = e.target.result.map(v => ({...v, user: '@me', url: URL.createObjectURL(v.blob)}));
        renderFeed([...testVids, ...myVids]);
    };
}

function renderFeed(all) {
    const feed = document.getElementById('s-feed');
    feed.innerHTML = '';
    all.forEach(v => {
        const card = document.createElement('div');
        card.className = 'v-card';
        card.innerHTML = `
            <video src="${v.url}" loop playsinline></video>
            <div class="v-ui">
                <i class="fas fa-heart ${likes.includes(v.id)?'liked':''}" onclick="toggleLike('${v.id}', this)"></i>
                <i class="fas fa-comment"></i>
            </div>
            <div class="v-info">
                <b>${v.user}</b>
                <p>${v.desc || ''}</p>
            </div>
        `;
        card.onclick = () => { const vid = card.querySelector('video'); vid.paused ? vid.play() : vid.pause(); };
        feed.appendChild(card);
        obs.observe(card);
    });
}

function toggleLike(id, el) {
    el.classList.toggle('liked');
    likes.includes(id) ? likes = likes.filter(i => i !== id) : likes.push(id);
    localStorage.setItem('L_DB', JSON.stringify(likes));
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('s-' + id).classList.add('active');
    if (id === 'profile') renderProfile();
}

function renderProfile() {
    db.transaction("videos").objectStore("videos").getAll().onsuccess = e => {
        const grid = document.getElementById('p-grid');
        grid.innerHTML = e.target.result.map(v => `<div class="g-item"><video src="${URL.createObjectURL(v.blob)}"></video></div>`).join('');
    };
}

function upload(e) {
    const file = e.target.files[0];
    if (file) {
        db.transaction("videos", "readwrite").objectStore("videos").add({blob: file, id: 'm'+Date.now()});
        setTimeout(() => location.reload(), 500);
    }
}

const obs = new IntersectionObserver(es => {
    es.forEach(e => { const v = e.target.querySelector('video'); e.isIntersecting ? v.play() : v.pause(); });
}, { threshold: 0.8 });
