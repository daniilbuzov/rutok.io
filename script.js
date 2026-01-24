let db;

// 1. Открываем базу данных
const request = indexedDB.open("TikTokDB", 1);
request.onupgradeneeded = (e) => {
    e.target.result.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
};
request.onsuccess = (e) => {
    db = e.target.result;
    loadVideos();
};

// 2. Функция загрузки видео в ленту
function loadVideos() {
    const feed = document.getElementById('feed');
    feed.innerHTML = '';
    
    db.transaction("videos").objectStore("videos").getAll().onsuccess = (e) => {
        const videos = e.target.result.reverse();
        if (videos.length === 0) {
            feed.innerHTML = '<div style="padding: 50% 20px; text-align: center;">Нажмите +, чтобы добавить видео</div>';
        }
        
        videos.forEach(item => {
            const url = URL.createObjectURL(item.file);
            const card = document.createElement('div');
            card.className = 'video-card';
            card.innerHTML = `
                <video src="${url}" loop playsinline muted></video>
                <div class="side-bar">
                    <i class="fas fa-heart" onclick="this.style.color='red'"></i>
                    <i class="fas fa-comment" onclick="alert('Комменты скоро!')"></i>
                </div>
                <div class="overlay">
                    <h3>@user</h3>
                    <p>Твое крутое видео!</p>
                </div>
            `;
            
            // Включаем звук и видео по клику
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

// 3. Автозапуск видео при скролле
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const v = entry.target.querySelector('video');
        if (entry.isIntersecting) v.play();
        else { v.pause(); v.currentTime = 0; }
    });
}, { threshold: 0.7 });

// 4. Сохранение нового видео
function uploadVideo(event) {
    const file = event.target.files[0];
    if (file) {
        const transaction = db.transaction("videos", "readwrite");
        transaction.objectStore("videos").add({ file: file });
        transaction.oncomplete = () => location.reload();
    }
}
