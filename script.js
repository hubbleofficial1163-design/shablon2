// Скрипт для свадебного сайта
document.addEventListener('DOMContentLoaded', function() {
    console.log('Свадебный сайт загружен');
    
    // Таймер
    updateCountdown();
    setInterval(updateCountdown, 1000);
    
    // Инициализация плеера
    initMusicPlayer();
    
    // Инициализация формы RSVP
    initRSVPForm();
});

// Таймер отсчета до свадьбы
function updateCountdown() {
    const weddingDate = new Date('2026-06-08T15:30:00');
    const now = new Date();
    const diff = weddingDate - now;
    
    if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');
        
        if (daysEl) daysEl.textContent = days.toString().padStart(3, '0');
        if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
        if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
        if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
    }
}

// Музыкальный плеер
function initMusicPlayer() {
    const playButton = document.getElementById('playButton');
    const weddingMusic = document.getElementById('weddingMusic');
    const circlePlayer = document.querySelector('.circle-player');
    
    if (!playButton || !weddingMusic || !circlePlayer) return;
    
    let isPlaying = false;
    
    playButton.addEventListener('click', function() {
        if (isPlaying) {
            weddingMusic.pause();
            weddingMusic.currentTime = 0;
            playButton.classList.remove('playing');
            circlePlayer.classList.remove('music-playing');
            isPlaying = false;
        } else {
            weddingMusic.play()
                .then(() => {
                    playButton.classList.add('playing');
                    circlePlayer.classList.add('music-playing');
                    isPlaying = true;
                })
                .catch(error => {
                    console.log('Для воспроизведения нажмите еще раз');
                    playButton.classList.add('playing');
                    circlePlayer.classList.add('music-playing');
                    isPlaying = true;
                });
        }
    });
    
    document.addEventListener('visibilitychange', function() {
        if (document.hidden && isPlaying) {
            weddingMusic.pause();
            weddingMusic.currentTime = 0;
            isPlaying = false;
            playButton.classList.remove('playing');
            circlePlayer.classList.remove('music-playing');
        }
    });
}

// Обработчик формы RSVP
function initRSVPForm() {
    const rsvpForm = document.querySelector('.rsvp-form');
    if (!rsvpForm) return;
    
    rsvpForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Показать индикатор загрузки
        const submitBtn = this.querySelector('.submit-button');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Отправка...';
        submitBtn.disabled = true;
        
        try {
            // Сбор данных формы
            const formData = {
                name: this.querySelector('input[type="text"]').value.trim(),
                phone: this.querySelector('input[type="tel"]').value.trim(),
                guests: this.querySelector('.form-select').value || '1',
                attendance: this.querySelector('input[name="attendance"]:checked')?.value
            };
            
            console.log('Отправляемые данные:', formData);
            
            // Проверка
            if (!formData.name || !formData.phone || !formData.attendance) {
                throw new Error('Пожалуйста, заполните все обязательные поля');
            }
            
            // Отправка через JSONP (работает с CORS)
            sendToGoogleSheetsJSONP(formData, function(success, message) {
                // Восстановить кнопку
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                
                if (success) {
                    if (formData.attendance === 'yes') {
                        alert('✅ Спасибо! Мы будем ждать вас на нашей свадьбе 8 июня 2026 года!');
                    } else {
                        alert('📝 Спасибо за ваш ответ!');
                    }
                    
                    // Очистка формы
                    rsvpForm.reset();
                } else {
                    alert('❌ Ошибка: ' + message);
                }
            });
            
        } catch (error) {
            console.error('Ошибка отправки:', error);
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            alert('❌ Ошибка: ' + error.message);
        }
    });
}

// Функция отправки через JSONP
function sendToGoogleSheetsJSONP(formData, callback) {
    // Замените на ваш URL Google Apps Script
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyum29eKLlqq0ARRQLxfqugjPXJ4W0A5IAR-1e4Tfv_j1m4LeLFpw5ahHDx9hbWeqQI/exec';
    
    // Создаем уникальное имя для callback функции
    const callbackName = 'jsonp_callback_' + Date.now();
    
    // Добавляем параметры к URL
    const params = new URLSearchParams({
        name: formData.name,
        phone: formData.phone,
        guests: formData.guests,
        attendance: formData.attendance,
        callback: callbackName
    });
    
    const url = SCRIPT_URL + '?' + params.toString();
    
    // Создаем функцию обратного вызова
    window[callbackName] = function(response) {
        console.log('Ответ от сервера:', response);
        
        // Удаляем callback
        delete window[callbackName];
        
        if (response && response.success) {
            callback(true, response.message || 'Успешно отправлено');
        } else {
            callback(false, response?.message || 'Ошибка сервера');
        }
    };
    
    // Создаем script элемент
    const script = document.createElement('script');
    script.src = url;
    
    // Обработка ошибок
    script.onerror = function() {
        console.error('Ошибка загрузки скрипта');
        delete window[callbackName];
        callback(false, 'Ошибка подключения к серверу');
    };
    
    // Добавляем скрипт на страницу
    document.body.appendChild(script);
    
    // Удаляем скрипт после загрузки
    setTimeout(() => {
        if (document.body.contains(script)) {
            document.body.removeChild(script);
        }
    }, 10000); // 10 секунд таймаут
}

// Для отладки: вызовите testConnection() в консоли браузера
window.testConnection = testConnection;

// Исправление для мобильного viewport (проблема с адресной строкой)
// Исправление для мобильного viewport (особенно для Telegram)
function setMobileHeroHeight() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    // Устанавливаем высоту равной внутренней высоте окна
    const vh = window.innerHeight;
    hero.style.height = vh + 'px';
    hero.style.minHeight = vh + 'px';
    
    // Проверяем, открыт ли сайт в Telegram
    const isTelegram = navigator.userAgent.toLowerCase().includes('telegram');
    
    if (isTelegram) {
        // Дополнительная корректировка для Telegram
        const heroPhoto = document.querySelector('.hero-photo');
        const heroContent = document.querySelector('.hero-content');
        
        if (heroPhoto && heroContent) {
            // Если фото все еще наезжает, добавляем отступ
            const contentBottom = heroContent.getBoundingClientRect().bottom;
            const photoTop = heroPhoto.getBoundingClientRect().top;
            
            if (photoTop < contentBottom + 20) {
                heroContent.style.paddingBottom = '20px';
            }
        }
    }
}

// Вызываем при загрузке
setMobileHeroHeight();

// Вызываем при изменении ориентации или размера окна
window.addEventListener('resize', () => {
    setMobileHeroHeight();
});

// Для некоторых мобильных браузеров нужно также при скролле
window.addEventListener('scroll', () => {
    // Только если адресная строка скрывается/показывается
    const hero = document.querySelector('.hero');
    if (hero && window.innerHeight !== parseInt(hero.style.height)) {
        setMobileHeroHeight();
    }
});

// Также полезно для Safari на iOS
window.addEventListener('orientationchange', () => {
    setTimeout(setMobileHeroHeight, 100);
});

// Вызываем при загрузке
setMobileHeroHeight();

// Вызываем при изменении ориентации или размера окна
window.addEventListener('resize', () => {
    setMobileHeroHeight();
});

// Для некоторых мобильных браузеров нужно также при скролле
window.addEventListener('scroll', () => {
    // Только если адресная строка скрывается/показывается
    if (window.innerHeight !== parseInt(document.querySelector('.hero').style.height)) {
        setMobileHeroHeight();
    }
});

// Также полезно для Safari на iOS
window.addEventListener('orientationchange', () => {
    setTimeout(setMobileHeroHeight, 100);
});
