const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 1. ПРЕДЗАГРУЗКА КАРТИНОК ЁЖИКА
const hedgehogImages = {
    'left-top': new Image(),
    'left-bottom': new Image(),
    'right-top': new Image(),
    'right-bottom': new Image()
};

hedgehogImages['left-top'].src = 'hedgehog_left_top.png';
hedgehogImages['left-bottom'].src = 'hedgehog_left_bottom.png';
hedgehogImages['right-top'].src = 'hedgehog_right_top.png';
hedgehogImages['right-bottom'].src = 'hedgehog_right_bottom.png';

// 2. ПРЕДЗАГРУЗКА КАРТИНКИ ЯБЛОКА
const appleImage = new Image();
appleImage.src = 'apple.png';

// 3. ОСНОВНЫЕ ПЕРЕМЕННЫЕ ИГРЫ
let hedgehogPosition = 'left-bottom';
let apples = [];
let score = 0;
let misses = 0;
let gameInterval = null;
let gameSpeed = 1000;
let currentMode = 'A';

// Переменная для случайного динамического ускорения
let nextSpeedDrop = 0;

const allLanes = ['left-top', 'left-bottom', 'right-top', 'right-bottom'];
let activeLanes = ['left-top', 'right-top', 'right-bottom'];

// 4. УПРАВЛЕНИЕ ДВИЖЕНИЕМ ЕЖИКА
function moveHedgehog(position) {
    hedgehogPosition = position;
    draw();
}

// Отслеживание клавиатуры ПК (для тестов: Q, А, Р, L)
window.addEventListener('keydown', (e) => {
    // Поддерживаем оба регистра и русскую раскладку
    if (e.key === 'q' || e.key === 'Q' || e.key === 'й' || e.key === 'Й') moveHedgehog('left-top');
    if (e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф') moveHedgehog('left-bottom');
    if (e.key === 'p' || e.key === 'P' || e.key === 'з' || e.key === 'З') moveHedgehog('right-top');
    if (e.key === 'l' || e.key === 'L' || e.key === 'д' || e.key === 'Д') moveHedgehog('right-bottom');
});

// 5. ЛОГИКА ПЕРЕКЛЮЧЕНИЯ СЛОЖНОСТИ И СТАРТА
function switchDifficulty(mode) {
    currentMode = mode;
    resetGame();

    if (mode === 'A') {
        activeLanes = ['left-top', 'right-top', 'right-bottom'];
        gameSpeed = 1000; // Стартовая скорость для Игры А
        document.getElementById('gameModeDisplay').innerText = 'ИГРА А';
    } else if (mode === 'B') {
        activeLanes = [...allLanes];
        gameSpeed = 800; // Стартовая скорость для Игры Б
        document.getElementById('gameModeDisplay').innerText = 'ИГРА Б';
    }

    // Рассчитываем первый случайный порог ускорения (через 5-10 очков)
    setNextSpeedDropThreshold();

    // Запускаем игровой цикл
    gameInterval = setInterval(updateGame, gameSpeed);
}

// Расчет следующего случайного порога для ускорения
function setNextSpeedDropThreshold() {
    const randomStep = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
    nextSpeedDrop = score + randomStep;
    console.log(`Следующее ускорение будет на счете: ${nextSpeedDrop}. Текущая скорость: ${gameSpeed}мс`);
}

// Появление нового яблока
function spawnApple() {
    const randomLane = activeLanes[Math.floor(Math.random() * activeLanes.length)];
    apples.push({ lane: randomLane, step: 0 });
}

// 6. ГЛАВНЫЙ ИГРОВОЙ ЦИКЛ ОБНОВЛЕНИЯ
function updateGame() {
    // Логика появления яблок (например, шанс 40% каждый такт, если яблок мало)
    if (Math.random() < 0.4 && apples.length < 3) {
        spawnApple();
    }

    for (let i = apples.length - 1; i >= 0; i--) {
        apples[i].step++;

        // Если яблоко докатилось до конца ветки (шаг 5)
        if (apples[i].step === 5) {
            // Проверяем, поймал ли его Ёжик
            if (hedgehogPosition === apples[i].lane) {
                score++;
                document.getElementById('score').innerText = String(score).padStart(3, '0');

                // Проверка достижения случайного порога ускорения
                if (score === nextSpeedDrop) {
                    accelerateGame();
                }
            } else {
                misses++;
                document.getElementById('misses').innerText = 'X'.repeat(misses);
                if (misses >= 3) {
                    clearInterval(gameInterval);
                    alert('Игра окончена! Собрано яблок: ' + score);
                    switchDifficulty(currentMode); // Автоматический перезапуск текущего раунда
                    return;
                }
            }
            apples.splice(i, 1);
        }
    }
    
    // Перерисовываем экран после каждого изменения
    draw();
}

// С шансом 40% генерируем новое яблоко на каждом такте времени
if (Math.random() < 0.4) spawnApple();
draw();

// Функция плавного разгона игры
function accelerateGame() {
    if (gameSpeed > 250) { // Не даем игре стать быстрее 250мс (физический предел)
        gameSpeed -= 50;

        // Перезапускаем игровой таймер на новой скорости
        clearInterval(gameInterval);
        gameInterval = setInterval(updateGame, gameSpeed);
    }

    // Задаем новый случайный барьер для следующего разгона
    setNextSpeedDropThreshold();
}

// 7. ОТРИСОВКА ГРАФИКИ НА CANVAS (С ЗАПАСНЫМИ ВАРИАНТАМИ)
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // РИСУЕМ ЁЖИКА
    const currentHedgehogImg = hedgehogImages[hedgehogPosition];

    // Безопасная проверка: если картинка существует, загружена и файл не пустой
    if (currentHedgehogImg && currentHedgehogImg.complete && currentHedgehogImg.naturalWidth !== 0) {
        ctx.drawImage(currentHedgehogImg, 140, 60, 120, 140);
    } else {
        // Запасной вариант: синий квадрат на месте Ёжика
        ctx.fillStyle = '#3498db';
        if (hedgehogPosition === 'left-top') ctx.fillRect(120, 80, 40, 40);
        if (hedgehogPosition === 'left-bottom') ctx.fillRect(120, 150, 40, 40);
        if (hedgehogPosition === 'right-top') ctx.fillRect(240, 80, 40, 40);
        if (hedgehogPosition === 'right-bottom') ctx.fillRect(240, 150, 40, 40);
    }
	
    // РИСУЕМ ЯБЛОКИ
    apples.forEach(apple => {
        let x, y;
        // Расчет траекторий качения яблок
        if (apple.lane === 'left-top') { x = 20 + apple.step * 20; y = 60 + apple.step * 10; }
        if (apple.lane === 'left-bottom') { x = 20 + apple.step * 20; y = 140 + apple.step * 10; }
        if (apple.lane === 'right-top') { x = 380 - apple.step * 20; y = 60 + apple.step * 10; }
        if (apple.lane === 'right-bottom') { x = 380 - apple.step * 20; y = 140 + apple.step * 10; }

        // Безопасная проверка загрузки картинки яблока
        if (appleImage && appleImage.complete && appleImage.naturalWidth !== 0) {
            ctx.drawImage(appleImage, x - 9, y - 9, 18, 18);
        } else {
            // Запасной вариант: красные кружочки вместо яблок
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(x, y, 7, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

// Сброс параметров перед новой игрой
function resetGame() {
    if (gameInterval) clearInterval(gameInterval);
    score = 0;
    misses = 0;
    apples = []; // Исправлено на правильный массив
    document.getElementById('score').innerText = '000';
    document.getElementById('misses').innerText = '';
}

// АВТОМАТИЧЕСКИЙ СТАРТ ИГРЫ ПРИ ПЕРВОМ ЗАПУСКЕ СТРАНИЦЫ
switchDifficulty('A');
