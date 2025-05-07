// Функции для работы с авторизацией через Steam

// Проверяем, есть ли токен авторизации
function isLoggedIn() {
    return localStorage.getItem('auth_token') !== null;
}

// Получаем токен из URL после авторизации через Steam
function processAuthToken() {
    // Получаем параметры URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    // Если есть токен в параметрах, сохраняем его и очищаем URL
    if (token) {
        localStorage.setItem('auth_token', token);
        
        // Очищаем URL от токена для безопасности
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        window.history.replaceState({}, document.title, url.toString());
        
        return true;
    }
    
    return false;
}

// Загрузка данных пользователя
async function loadUserData() {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    
    try {
        const response = await fetch('/api/auth/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Токен недействителен или истек
                localStorage.removeItem('auth_token');
                return null;
            }
            throw new Error('Ошибка получения данных пользователя');
        }
        
        const userData = await response.json();
        return userData;
    } catch (error) {
        console.error('Ошибка:', error);
        return null;
    }
}

// Выход из аккаунта
function logout() {
    localStorage.removeItem('auth_token');
    window.location.href = '/';
}

// Функция для отображения данных пользователя на странице
async function updateUserInterface() {
    // Проверяем авторизацию из URL
    const newAuth = processAuthToken();
    
    // Элементы для авторизованного и неавторизованного состояния
    const authElements = document.querySelectorAll('.auth-required');
    const noAuthElements = document.querySelectorAll('.no-auth-required');
    
    if (isLoggedIn()) {
        // Пользователь авторизован
        const userData = await loadUserData();
        
        if (userData) {
            // Обновляем интерфейс с данными пользователя
            const userNameElements = document.querySelectorAll('.user-name');
            const userPointsElements = document.querySelectorAll('.user-points');
            const userAvatarElements = document.querySelectorAll('.user-avatar');
            
            userNameElements.forEach(el => el.textContent = userData.name);
            userPointsElements.forEach(el => el.textContent = userData.points);
            userAvatarElements.forEach(el => {
                if (el.tagName === 'IMG') {
                    el.src = userData.avatar;
                    el.alt = userData.name;
                } else {
                    el.style.backgroundImage = `url(${userData.avatar})`;
                }
            });
            
            // Показываем элементы для авторизованных пользователей
            authElements.forEach(el => el.style.display = '');
            noAuthElements.forEach(el => el.style.display = 'none');
            
            // Если это новая авторизация, обновляем страницу для полного обновления интерфейса
            if (newAuth) {
                // Опционально: перезагрузка страницы для полного обновления
                // window.location.reload();
            }
        } else {
            // Ошибка получения данных пользователя, показываем как неавторизованного
            authElements.forEach(el => el.style.display = 'none');
            noAuthElements.forEach(el => el.style.display = '');
        }
    } else {
        // Пользователь не авторизован
        authElements.forEach(el => el.style.display = 'none');
        noAuthElements.forEach(el => el.style.display = '');
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', updateUserInterface);