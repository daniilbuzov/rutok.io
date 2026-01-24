let db;

// 1. Создаем базу данных
const request = indexedDB.open("TikTokDB", 1);
request.onupgradeneeded = (e) => {
    e.target.result.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
};
request.onsuccess = (e) => {
    db = e.target.result;
    loadFeed();
};

// 2. Загрузка ленты
function loadFeed() {
    const feed = document.getElementById('feed');
    feed.innerHTML = '';

    db.transaction("videos").objectStore("videos").getAll().onsuccess = (e) => {
        const videos = e.target.result.reverse();

        if (videos.length === 0) {
            feed.innerHTML = `
                <div style="color:white; text-align:center; padding-top:200px; font-family:sans-serif;">
                    <i class="fas fa-video" style="font-size:50px; opacity:0.3"></i>
                    <p style="margin-top:20px">Лента пуста.<br>Нажми на + снизу!</p>
                </div>`;
            return;
        }

        videos.forEach(item => {
            const blobUrl = URL.createObjectURL(item.file);
            const card = document.createElement('div');
            card.className = 'video-card';
            card.innerHTML = `
                <video src="${blobUrl}" loop playsinline muted></video>
                <div class="video-info">
                    <h3>@my_video</h3>
                    <p>Загружено в TikTok Clone</p>
                </div>
            `;

            // Управление Play/Pause
            card.onclick = () => {
                const v = card.querySelector('video');
                v.muted = false;
                v.paused ? v.play() : v.pause();
            };

            feed.appendChild(card);
            observer.observe(card);
        });
    };
}

// 3. Автоплей при скролле
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        const v = entry.target.querySelector('video');
        if (entry.isIntersecting) v.play();
        else v.pause();
    });
}, { threshold: 0.7 });

// 4. Добавление видео
function uploadVideo(event) {
    const file = event.target.files[0];
    if (file) {
        const tx = db.transaction("videos", "readwrite");
        tx.objectStore("videos").add({ file: file });
        tx.oncomplete = () => location.reload();
    }
}
