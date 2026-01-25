const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Разрешаем запросы и настраиваем папки
app.use(cors());
app.use(express.static('public')); 
app.use('/uploads', express.static('uploads'));

// Создаем папку для видео, если её нет
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

// Настройка загрузки файлов
const storage = multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Роут для загрузки видео
app.post('/upload', upload.single('video'), (req, res) => {
    if (!req.file) return res.status(400).send({ error: 'Файл не выбран' });
    const videoUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    res.json({ url: videoUrl });
});

app.listen(PORT, () => {
    console.log(`✅ Сервер летит на http://localhost:${PORT}`);
});