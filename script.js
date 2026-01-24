* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #000; color: #fff; font-family: sans-serif; height: 100dvh; overflow: hidden; }
#app { width: 100%; max-width: 450px; margin: 0 auto; height: 100%; position: relative; }

.screen { display: none; height: calc(100% - 70px); overflow-y: auto; }
.active { display: block; }

/* Сетка профиля */
.profile-tabs { display: flex; border-top: 1px solid #222; border-bottom: 1px solid #222; margin-top: 20px; }
.tab-btn { flex: 1; text-align: center; padding: 12px; color: #888; cursor: pointer; }
.tab-btn.active { color: #fff; border-bottom: 2px solid #fff; }

.grid-content { display: none; grid-template-columns: repeat(3, 1fr); gap: 2px; }
.grid-content.active { display: grid; }
.grid-item { aspect-ratio: 3/4; background: #111; overflow: hidden; }
.grid-item video { width: 100%; height: 100%; object-fit: cover; }

/* Элементы видео в ленте */
.video-card { height: 100%; scroll-snap-align: start; position: relative; background: #000; }
video { width: 100%; height: 100%; object-fit: cover; }
.side-ui { position: absolute; right: 10px; bottom: 100px; display: flex; flex-direction: column; gap: 20px; z-index: 10; }
.side-ui i { font-size: 30px; text-shadow: 0 0 5px #000; }
.heart-active { color: #fe2c55; }

/* Анимация сердца */
.floating-heart {
    position: absolute; color: #fe2c55; font-size: 80px; z-index: 100;
    pointer-events: none; animation: heartFade 0.8s ease-out forwards;
}
@keyframes heartFade {
    0% { transform: scale(0); opacity: 0; }
    50% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1); opacity: 0; transform: translateY(-100px); }
}

.footer-nav { position: absolute; bottom: 0; width: 100%; height: 70px; display: flex; justify-content: space-around; align-items: center; background: #000; border-top: 1px solid #222; }
.plus-box { background: #fff; color: #000; padding: 5px 15px; border-radius: 8px; font-weight: bold; }
