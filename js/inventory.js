// JavaScript для страницы инвентаря

document.addEventListener('DOMContentLoaded', async function() {
    // Инициализация
    const inventoryGrid = document.querySelector('.inventory-grid');
    const inventoryEmpty = document.querySelector('.inventory-empty');
    const inventoryLoading = document.querySelector('.inventory-loading');
    const inventoryPagination = document.querySelector('.inventory-pagination');
    const searchInput = document.getElementById('inventorySearch');
    const rarityFilter = document.getElementById('rarityFilter');
    const typeFilter = document.getElementById('typeFilter');
    const sortOrder = document.getElementById('sortOrder');
    const itemModal = document.getElementById('itemModal');
    const userData = await loadUserData();
    
    // Переменные для пагинации
    const itemsPerPage = 16;
    let currentPage = 1;
    let totalPages = 1;
    let allItems = [];
    let filteredItems = [];
    
    // Загрузка инвентаря
    async function loadInventory() {
        try {
            // Если пользователь не авторизован, не загружаем инвентарь
            if (!isLoggedIn()) {
                return;
            }
            
            // Показываем индикатор загрузки
            inventoryLoading.style.display = 'flex';
            inventoryGrid.innerHTML = '';
            
            // Получаем данные из API
            allItems = await API.getInventory();
            
            // Скрываем индикатор загрузки
            inventoryLoading.style.display = 'none';
            
            // Проверяем, есть ли предметы в инвентаре
            if (allItems.length === 0) {
                inventoryEmpty.style.display = 'flex';
                inventoryPagination.style.display = 'none';
                return;
            }
            
            // Сортируем предметы по времени получения (сначала новые)
            allItems.sort((a, b) => new Date(b.acquired) - new Date(a.acquired));
            
            // Отображаем предметы на первой странице
            applyFiltersAndRender();
            
        } catch (error) {
            console.error('Ошибка загрузки инвентаря:', error);
            inventoryLoading.style.display = 'none';
            inventoryGrid.innerHTML = `
                <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 40px; color: #e74c3c; margin-bottom: 20px;"></i>
                    <p style="color: #d1d4ff;">Не удалось загрузить инвентарь. Пожалуйста, попробуйте позже.</p>
                </div>
            `;
        }
    }
    
    // Фильтрация и отображение предметов
    function applyFiltersAndRender() {
        // Получаем значения фильтров
        const searchQuery = searchInput.value.toLowerCase();
        const rarityValue = rarityFilter.value;
        const typeValue = typeFilter.value;
        const sortValue = sortOrder.value;
        
        // Фильтруем предметы
        filteredItems = allItems.filter(item => {
            // Поиск по названию
            const nameMatch = item.details.name.toLowerCase().includes(searchQuery);
            
            // Фильтр по редкости
            const rarityMatch = rarityValue === 'all' || item.details.rarity === rarityValue;
            
            // Фильтр по типу
            const typeMatch = typeValue === 'all' || item.details.type === typeValue;
            
            return nameMatch && rarityMatch && typeMatch;
        });
        
        // Сортировка
        filteredItems.sort((a, b) => {
            switch (sortValue) {
                case 'newest':
                    return new Date(b.acquired) - new Date(a.acquired);
                case 'oldest':
                    return new Date(a.acquired) - new Date(b.acquired);
                case 'rarity':
                    const rarityOrder = {
                        'ancient': 6,
                        'legendary': 5,
                        'mythical': 4,
                        'rare': 3,
                        'uncommon': 2,
                        'common': 1
                    };
                    return rarityOrder[b.details.rarity] - rarityOrder[a.details.rarity];
                case 'name':
                    return a.details.name.localeCompare(b.details.name);
                default:
                    return 0;
            }
        });
        
        // Обновляем пагинацию
        totalPages = Math.ceil(filteredItems.length / itemsPerPage);
        currentPage = 1; // При изменении фильтров всегда возвращаемся на первую страницу
        updatePagination();
        
        // Отображаем предметы текущей страницы
        renderItems();
    }
    
    // Отображение предметов на текущей странице
    function renderItems() {
        // Очищаем контейнер
        inventoryGrid.innerHTML = '';
        
        // Если нет предметов после фильтрации
        if (filteredItems.length === 0) {
            inventoryGrid.innerHTML = `
                <div class="empty-search" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <i class="fas fa-search" style="font-size: 40px; color: rgba(209, 212, 255, 0.3); margin-bottom: 20px;"></i>
                    <p style="color: #d1d4ff;">Ничего не найдено. Попробуйте изменить параметры поиска.</p>
                </div>
            `;
            inventoryPagination.style.display = 'none';
            return;
        }
        
        // Вычисляем диапазон предметов для текущей страницы
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredItems.length);
        const currentItems = filteredItems.slice(startIndex, endIndex);
        
        // Отображаем предметы
        currentItems.forEach(item => {
            const inventoryItem = document.createElement('div');
            inventoryItem.className = 'inventory-item fade-in';
            inventoryItem.dataset.id = item._id;
            
            // Форматируем дату получения
            const acquiredDate = new Date(item.acquired);
            const formattedDate = acquiredDate.toLocaleDateString('ru-RU');
            
            inventoryItem.innerHTML = `
                <div class="item-rarity-bar rarity-${item.details.rarity}"></div>
                <img src="images/items/${item.details.image}" alt="${item.details.name}" loading="lazy">
                <div class="inventory-item-name">${item.details.name}</div>
                <div class="inventory-item-rarity rarity-${item.details.rarity}">${getRarityName(item.details.rarity)}</div>
                <div class="inventory-item-date">${formattedDate}</div>
            `;
            
            // Добавляем обработчик клика для открытия модального окна
            inventoryItem.addEventListener('click', function() {
                showItemModal(item);
            });
            
            inventoryGrid.appendChild(inventoryItem);
        });
        
        // Показываем пагинацию, если есть больше одной страницы
        inventoryPagination.style.display = totalPages > 1 ? 'flex' : 'none';
        
        // Инициализируем анимацию fade-in
        setupFadeInAnimation();
    }
    
    // Обновление пагинации
    function updatePagination() {
        document.getElementById('currentPage').textContent = currentPage;
        document.getElementById('totalPages').textContent = totalPages;
        
        // Блокируем/разблокируем кнопки пагинации
        document.querySelector('[data-page="prev"]').disabled = currentPage === 1;
        document.querySelector('[data-page="next"]').disabled = currentPage === totalPages;
    }
    
    // Показать модальное окно с информацией о предмете
    function showItemModal(item) {
        // Заполняем информацию о предмете в модальном окне
        document.querySelector('.modal-item-image').src = `images/items/${item.details.image}`;
        document.querySelector('.modal-item-name').textContent = item.details.name;
        document.querySelector('.modal-item-rarity').textContent = `Редкость: ${getRarityName(item.details.rarity)}`;
        document.querySelector('.modal-item-rarity').className = `modal-item-rarity rarity-${item.details.rarity}`;
        document.querySelector('.modal-item-type').textContent = `Тип: ${getItemTypeName(item.details.type)}`;
        document.querySelector('.modal-item-date').textContent = new Date(item.acquired).toLocaleDateString('ru-RU');
        document.querySelector('.modal-item-source').textContent = getSourceName(item.source);
        document.querySelector('.modal-rarity').className = `modal-rarity bg-${item.details.rarity}`;
        
        // Показываем модальное окно
        itemModal.classList.add('active');
        
        // Устанавливаем обработчик на кнопку "Просмотр в игре"
        document.querySelector('.view-in-game-btn').addEventListener('click', function() {
            alert('Функция просмотра в игре будет доступна позже.');
        });
        
        // Закрытие модального окна по клику на крестик
        itemModal.querySelector('.close-modal').addEventListener('click', function() {
            itemModal.classList.remove('active');
        });
        
        // Закрытие модального окна по клику вне него
        itemModal.addEventListener('click', function(event) {
            if (event.target === itemModal) {
                itemModal.classList.remove('active');
            }
        });
    }
    
    // Функция для получения названия редкости
    function getRarityName(rarity) {
        const names = {
            'common': 'Обычный',
            'uncommon': 'Необычный',
            'rare': 'Редкий',
            'mythical': 'Мифический',
            'legendary': 'Легендарный',
            'ancient': 'Древний'
        };
        
        return names[rarity] || 'Неизвестная редкость';
    }
    
    // Функция для получения названия типа предмета
    function getItemTypeName(type) {
        const names = {
            'weapon': 'Оружие',
            'knife': 'Нож',
            'gloves': 'Перчатки',
            'sticker': 'Наклейка'
        };
        
        return names[type] || 'Предмет';
    }
    
    // Функция для получения названия источника предмета
    function getSourceName(source) {
        const names = {
            'case_open': 'Открытие кейса',
            'trade': 'Обмен',
            'gift': 'Подарок',
            'achievement': 'Достижение',
            'purchase': 'Покупка'
        };
        
        return names[source] || 'Получено в игре';
    }
    
    // Обработчики событий фильтрации и поиска
    searchInput.addEventListener('input', debounce(applyFiltersAndRender, 300));
    rarityFilter.addEventListener('change', applyFiltersAndRender);
    typeFilter.addEventListener('change', applyFiltersAndRender);
    sortOrder.addEventListener('change', applyFiltersAndRender);
    
    // Обработчики кнопок пагинации
    document.querySelector('[data-page="prev"]').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            updatePagination();
            renderItems();
            // Прокрутка к верху контейнера инвентаря
            window.scrollTo({
                top: document.querySelector('.inventory-section').offsetTop - 100,
                behavior: 'smooth'
            });
        }
    });
    
    document.querySelector('[data-page="next"]').addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            updatePagination();
            renderItems();
            // Прокрутка к верху контейнера инвентаря
            window.scrollTo({
                top: document.querySelector('.inventory-section').offsetTop - 100,
                behavior: 'smooth'
            });
        }
    });
    
    // Функция debounce для задержки обработки ввода в поле поиска
    function debounce(func, delay) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }
    
    // Инициализация
    if (isLoggedIn()) {
        loadInventory();
    }
});