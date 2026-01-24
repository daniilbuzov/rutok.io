// Вставь свои данные из Supabase
const SUPABASE_URL = 'https://vbqvemcwbwqnobenupzq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_MQ0U2ZayrZA9vCGemk0-fQ_b1vc6tqH';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. Загрузка видео в ОБЛАКО
async function publishVideo() {
    const file = document.getElementById('fileInp').files[0];
    const desc = document.getElementById('descInp').value;
    
    if (!file) return;

    // Загружаем файл в Storage
    const fileName = `${Date.now()}_${file.name}`;
    const { data: storageData, error: storageError } = await supabase.storage
        .from('videos')
        .upload(fileName, file);

    if (storageError) return alert('Ошибка загрузки файла');

    // Получаем прямую ссылку на видео
    const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(fileName);

    // Сохраняем информацию в таблицу (базу данных)
    const { error: dbError } = await supabase
        .from('videos')
        .insert([{ url: publicUrl, description: desc, author: localStorage.getItem('nick') || 'Guest' }]);

    if (!dbError) location.reload();
}

// 2. Получение видео со ВСЕГО МИРА
async function loadFeed() {
    const feed = document.getElementById('feed');
    const { data: videos, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return console.log('Ошибка получения ленты');

    videos.forEach(item => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
            <video src="${item.url}" loop muted playsinline></video>
            <div class="ui-layer">
                <div class="video-desc">
                    <h3>@${item.author}</h3>
                    <p>${item.description}</p>
                </div>
            </div>
        `;
        // Логика клика (Play/Pause)
        card.onclick = () => {
            const v = card.querySelector('video');
            v.muted = false;
            v.paused ? v.play() : v.pause();
        };
        feed.appendChild(card);
    });
}

loadFeed();
