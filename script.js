let localDB;
let stream = null;
let mediaRecorder = null;
let chunks = [];
let facing = "user";

const req = indexedDB.open("TikTokProFix", 4);
req.onupgradeneeded = e => e.target.result.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
req.onsuccess = e => { localDB = e.target.result; init(); };

function init() {
    loadContent();
    const user = JSON.parse(localStorage.getItem('user')) || { name: '@web_king' };
    document.getElementById('user-name').innerText = user.name;
}

// Показать выбор на телефоне или сразу окно файла на ПК
function handlePlusClick() {
    if (window.innerWidth > 900) document.getElementById('vid-input').click();
    else document.getElementById('upload-menu').style.display = 'flex';
}

// --- КАМЕРА ---
async function openCamera() {
    document.getElementById('upload-menu').style.display = 'none';
    document.getElementById('cam-overlay').style.display = 'block';
    startStream();
}

async function startStream() {
    if(stream) stream.getTracks().forEach(t => t.stop());
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: true });
    document.getElementById('cam-preview').srcObject = stream;
}

function flipCamera() {
    facing = facing === "user" ? "environment" : "user";
    startStream();
}

function toggleRecording() {
    const btn = document.getElementById('rec-btn');
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        chunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        mediaRecorder.onstop = () => saveVideo(new Blob(chunks, { type: 'video/mp4' }));
        mediaRecorder.start();
        btn.classList.add('recording');
    } else {
        mediaRecorder.stop();
        btn.classList.remove('recording');
        closeCamera();
    }
}

function closeCamera() {
    if(stream) stream.getTracks().forEach(t => t.stop());
    document.getElementById('cam-overlay').style.display = 'none';
}

// --- ЗАГРУЗКА ---
function uploadFile(e) {
    if(e.target.files[0]) saveVideo(e.target.files[0]);
}

function saveVideo(blob) {
    const tx = localDB.transaction("videos", "readwrite");
    tx.objectStore("videos").add({ blob, date: Date.now() });
    tx.oncomplete = () => location.reload();
}

function loadContent() {
    const tx = localDB.transaction("videos").objectStore("videos");
    tx.getAll().onsuccess = e => {
        const vids = e.target.result.reverse();
        render(vids);
    };
}

function render(list) {
    const feed = document.getElementById('s-feed');
    const grid = document.getElementById('grid-my');
    feed.innerHTML = ''; grid.innerHTML = '';

    list.forEach(v => {
        const url = URL.createObjectURL(v.blob);
        // Лента
        const card = document.createElement('div');
        card.className = 'v-card';
        card.innerHTML = `<video src="${url}" loop playsinline muted></video>`;
        card.onclick = () => { const vid = card.querySelector('video'); vid.muted=false; vid.paused?vid.play():vid.pause(); };
        feed.appendChild(card);
        obs.observe(card);

        // Сетка
        grid.innerHTML += `<div class="grid-item"><video src="${url}#t=0.5" muted></video></div>`;
    });
    document.getElementById('v-count').innerText = list.length;
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('s-' + id).classList.add('active');
}

const obs = new IntersectionObserver(ents => {
    ents.forEach(e => { const v = e.target.querySelector('video'); e.isIntersecting ? v.play() : v.pause(); });
}, { threshold: 0.8 });
