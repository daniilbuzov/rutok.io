let db;
let likes = JSON.parse(localStorage.getItem('likes')) || [];

const initDB = indexedDB.open("TikTokUIFix", 1);
initDB.onupgradeneeded = e => e.target.result.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
initDB.onsuccess = e => { db = e.target.result; loadApp(); };

function loadApp() {
    db.transaction("videos").objectStore("videos").getAll().onsuccess = e => {
        const vids = e.target.result.reverse();
        render(vids);
    };
}

// Логика кнопки +
function handleMobileAdd() {
    if (window.innerWidth < 900) {
        document.getElementById('mob-upload-menu').style.display = 'flex';
    }
}

function uploadFile(e) {
    const file = e.target.files[0];
    if (file) {
        const tx = db.transaction("videos", "readwrite");
        tx.objectStore("videos").add({ blob: file, timestamp: Date.now() });
        tx.oncomplete = () => location.reload();
    }
}

function render(list) {
    const feed = document.getElementById('s-feed');
    const grid = document.getElementById('grid-my');
    feed.innerHTML = ''; grid.innerHTML = '';

    list.forEach(v => {
        const url = URL.createObjectURL(v.blob);
        
        // Лента
        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `<video src="${url}" loop playsinline muted></video>`;
        
        // Клик для звука/паузы
        card.onclick = () => {
            const vid = card.querySelector('video');
            vid.muted = false;
            vid.paused ? vid.play() : vid.pause();
        };

        feed.appendChild(card);
        observer.observe(card);

        // Сетка в профиле
        grid.innerHTML += `<div class="g-item"><video src="${url}#t=0.5" muted></video></div>`;
    });
    
    document.getElementById('v-count').innerText = list.length;
}

// Переключение экранов
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('s-' + id).classList.add('active');
    
    // Обновляем активную иконку на ПК
    document.querySelectorAll('.pc-item').forEach(i => i.classList.remove('active'));
    // (тут можно добавить логику подстветки нужного пункта в сайдбаре)
}

// Автоплей при скролле
const observer = new IntersectionObserver(ents => {
    ents.forEach(e => {
        const v = e.target.querySelector('video');
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
    });
}, { threshold: 0.7 });
