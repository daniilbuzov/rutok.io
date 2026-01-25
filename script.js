let stream = null;
let mediaRecorder = null;
let chunks = [];
let currentFacing = "user"; // "user" или "environment"

// 1. Определение устройства и клика на Плюс
function handlePlusClick() {
    if (window.innerWidth > 900) {
        // ПК: сразу выбор файла
        document.getElementById('vid-input').click();
    } else {
        // Мобилка: меню
        document.getElementById('upload-menu').style.display = 'flex';
    }
}

// 2. Логика КАМЕРЫ
async function openCamera() {
    closeModals();
    document.getElementById('camera-screen').style.display = 'block';
    startStream();
}

async function startStream() {
    if (stream) stream.getTracks().forEach(t => t.stop());
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: currentFacing },
            audio: true
        });
        document.getElementById('cam-preview').srcObject = stream;
    } catch (err) {
        alert("Нет доступа к камере");
        closeCamera();
    }
}

function flipCamera() {
    currentFacing = currentFacing === "user" ? "environment" : "user";
    startStream();
}

function toggleRecording() {
    const btn = document.getElementById('record-btn');
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        // Старт
        chunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        mediaRecorder.onstop = saveRecordedVideo;
        mediaRecorder.start();
        btn.classList.add('recording');
    } else {
        // Стоп
        mediaRecorder.stop();
        btn.classList.remove('recording');
    }
}

function saveRecordedVideo() {
    const blob = new Blob(chunks, { type: 'video/mp4' });
    processVideoUpload(blob);
    closeCamera();
}

function closeCamera() {
    if (stream) stream.getTracks().forEach(t => t.stop());
    document.getElementById('camera-screen').style.display = 'none';
}

// 3. Загрузка (общая для камеры и файла)
function uploadFile(e) {
    const file = e.target.files[0];
    if (file) processVideoUpload(file);
    closeModals();
}

function processVideoUpload(blob) {
    // Тут твоя IndexedDB из прошлых версий
    alert("Видео успешно обработано и готово к сохранению!");
    // Добавь сюда свой код сохранения в базу данных
}

function closeModals() {
    document.getElementById('upload-menu').style.display = 'none';
}

// 4. Навигация
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('s-' + id).classList.add('active');
}
