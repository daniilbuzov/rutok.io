let db;
const testVids = [
    "https://v.ftcdn.net/05/52/63/14/700_F_552631481_f9T7Y5jWn5Xq7zVl9f0jH3rWfGfQ6YmS_ST.mp4",
    "https://v.ftcdn.net/02/10/50/30/700_F_210503038_SHevj06B0jVvK15i1rG0M7Bf6ZgY4K.mp4"
];

const request = indexedDB.open("TikTokV20", 1);
request.onupgradeneeded = e => e.target.result.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
request.onsuccess = e => { db = e.target.result; renderAll(); };

function renderAll() {
    const feed = document.getElementById('feed');
    const myGrid = document.getElementById('my-vids');
    const likedGrid = document.getElementById('liked-vids');
    
    feed.innerHTML = '';
    myGrid.innerHTML = '';
    likedGrid.innerHTML = '';

    db.transaction("videos").objectStore("videos").getAll().onsuccess = e => {
        let userVids = e.target.result || [];
        
        // Создаем массив из 20 видео (смесь реальных и тестовых)
        let fullList = [...userVids];
        for (let i = fullList.length; i < 20; i++) {
            fullList.push({ id: 'test'+i, url: testVids[i % testVids.length], desc: "Тестовое видео " + i, isTest: true });
        }

        fullList.forEach(vid => {
            const url = vid.isTest ? vid.url : URL.createObjectURL(vid.blob);
            
            // 1. В ленту
            const card = document.createElement('div');
            card.className = 'video-card';
            card.innerHTML = `
                <video src="${url}" loop playsinline muted></video>
                <div class="side-ui">
                    <i class="fas fa-heart" onclick="toggleLike(this, '${url}')"></i>
                    <i class="fas fa-comment"></i>
                </div>
            `;
            
            // Лайк по двойному клику
            let lastClick = 0;
            card.onclick = (e) => {
                if(Date.now() - lastClick < 300) { showHeart(e); toggleLike(card.querySelector('.fa-heart'), url, true); }
                else { togglePlay(card.querySelector('video')); }
                lastClick = Date.now();
            };
            
            feed.appendChild(card);
            observer.observe(card);

            // 2. В профиль (в мои видео)
            const thumb = document.createElement('div');
            thumb.className = 'grid-item';
            thumb.innerHTML = `<video src="${url}" muted></video>`;
            myGrid.appendChild(thumb);
        });
    };
}

function toggleLike(el, url, force = false) {
    el.classList.toggle('heart-active', force || !el.classList.contains('heart-active'));
    if(el.classList.contains('heart-active')) {
        addToLikedTab(url);
    }
}

function addToLikedTab(url) {
    const likedGrid = document.getElementById('liked-vids');
    const thumb = document.createElement('div');
    thumb.className = 'grid-item';
    thumb.innerHTML = `<video src="${url}" muted></video>`;
    likedGrid.appendChild(thumb);
    document.getElementById('likeCount').innerText = likedGrid.children.length;
}

function showHeart(e) {
    const h = document.createElement('i');
    h.className = 'fas fa-heart floating-heart';
    h.style.left = (e.clientX - 40) + 'px';
    h.style.top = (e.clientY - 40) + 'px';
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 800);
}

function switchProfileTab(tabId, btn) {
    document.querySelectorAll('.grid-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
}

function togglePlay(v) { v.muted = false; v.paused ? v.play() : v.pause(); }

function changeTab(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function uploadVideo(e) {
    const file = e.target.files[0];
    if(file) {
        const tx = db.transaction("videos", "readwrite");
        tx.objectStore("videos").add({ blob: file, desc: "Мое видео" });
        tx.oncomplete = () => location.reload();
    }
}

const observer = new IntersectionObserver(ents => {
    ents.forEach(en => {
        const v = en.target.querySelector('video');
        en.isIntersecting ? v.play() : v.pause();
    });
}, { threshold: 0.8 });
