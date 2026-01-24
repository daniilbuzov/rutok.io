// Если ты используешь Supabase, убедись, что ссылки на видео рабочие.
// Для теста я добавлю одно стандартное видео, чтобы ты сразу увидел результат.

const testVideos = [
    { url: 'https://v.ftcdn.net/05/52/63/14/700_F_552631481_f9T7Y5jWn5Xq7zVl9f0jH3rWfGfQ6YmS_ST.mp4', desc: 'Тестовое видео #1' }
];

function renderFeed(videos) {
    const feed = document.getElementById('feed');
    feed.innerHTML = ''; // Очищаем

    if (videos.length === 0) {
        feed.innerHTML = '<div style="color:white; text-align:center; padding-top:50dvh;">Лента пуста. Загрузите видео!</div>';
        return;
    }

    videos.forEach(item => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
            <video src="${item.url}" loop muted playsinline></video>
            <div class="ui-overlay">
                <div class="video-info">
                    <h3>@creator</h3>
                    <p>${item.desc}</p>
                </div>
            </div>
        `;

        card.onclick = () => {
            const v = card.querySelector('video');
            v.muted = false;
            v.paused ? v.play() : v.pause();
        };

        feed.appendChild(card);
        observer.observe(card);
    });
}

// Автоплей при скролле
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        const v = entry.target.querySelector('video');
        if (entry.isIntersecting) {
            v.play().catch(() => console.log("Браузер ждет клика для звука"));
        } else {
            v.pause();
        }
    });
}, { threshold: 0.6 });

// Запуск с тестовыми данными
renderFeed(testVideos);
