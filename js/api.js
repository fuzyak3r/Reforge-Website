// API для работы с игроками и инвентарем

const API = {
    // Получение данных игрока по steamId
    getPlayer: async (steamId) => {
        try {
            const token = localStorage.getItem('auth_token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            const response = await fetch(`/api/players?steamId=${steamId}`, { headers });
            if (!response.ok) {
                throw new Error('Ошибка получения данных игрока');
            }
            return await response.json();
        } catch (error) {
            console.error('Ошибка:', error);
            return null;
        }
    },
    
    // Сохранение данных игрока
    savePlayer: async (playerData) => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                throw new Error('Требуется авторизация');
            }
            
            const response = await fetch('/api/players', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(playerData)
            });
            
            if (!response.ok) {
                throw new Error('Ошибка сохранения данных игрока');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Ошибка:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Получение инвентаря игрока
    getInventory: async (steamId) => {
        try {
            const token = localStorage.getItem('auth_token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            const response = await fetch(`/api/inventory?steamId=${steamId || ''}`, { headers });
            if (!response.ok) {
                throw new Error('Ошибка получения инвентаря');
            }
            return await response.json();
        } catch (error) {
            console.error('Ошибка:', error);
            return [];
        }
    },
    
    // Получение списка кейсов
    getCases: async () => {
        try {
            const response = await fetch('/api/cases');
            if (!response.ok) {
                throw new Error('Ошибка получения списка кейсов');
            }
            return await response.json();
        } catch (error) {
            console.error('Ошибка:', error);
            return [];
        }
    },
    
    // Получение данных о кейсе по ID
    getCaseById: async (caseId) => {
        try {
            const response = await fetch(`/api/cases?id=${caseId}`);
            if (!response.ok) {
                throw new Error('Ошибка получения данных кейса');
            }
            return await response.json();
        } catch (error) {
            console.error('Ошибка:', error);
            return null;
        }
    },
    
    // Открытие кейса
    openCase: async (caseId) => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                throw new Error('Требуется авторизация');
            }
            
            const response = await fetch('/api/open-case', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ caseId })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка открытия кейса');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Ошибка:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Получение данных предмета
    getItemDetails: async (itemId) => {
        try {
            const response = await fetch(`/api/items?id=${itemId}`);
            if (!response.ok) {
                throw new Error('Ошибка получения данных предмета');
            }
            return await response.json();
        } catch (error) {
            console.error('Ошибка:', error);
            return null;
        }
    }
};