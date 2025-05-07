// JavaScript для страницы кейсов

document.addEventListener('DOMContentLoaded', async function() {
    // Инициализация
    const casesGrid = document.querySelector('.cases-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const caseOpenModal = document.getElementById('caseOpenModal');
    const caseResultModal = document.getElementById('caseResultModal');
    const userData = await loadUserData();
    
    let cases = [];
    
    // Загрузка кейсов
    async function loadCases() {
        try {
            cases = await API.getCases();
            renderCases(cases);
        } catch (error) {
            console.error('Ошибка загрузки кейсов:', error);
            casesGrid.innerHTML = `
                <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 40px; color: #e74c3c; margin-bottom: 20px;"></i>
                    <p style="color: #d1d4ff;">Не удалось загрузить кейсы. Пожалуйста, попробуйте позже.</p>
                </div>
            `;
        }
    }
    
    // Отображение кейсов на странице
    function renderCases(casesToRender) {
        if (casesToRender.length === 0) {
            casesGrid.innerHTML = `
                <div class="empty-message" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <i class="fas fa-box-open" style="font-size: 40px; color: rgba(209, 212, 255, 0.3); margin-bottom: 20px;"></i>
                    <p style="color: #d1d4ff;">Кейсы скоро появятся. Следите за обновлениями!</p>
                </div>
            `;
            return;
        }
        
        casesGrid.innerHTML = '';
        
        casesToRender.forEach(caseItem => {
            const caseCard = document.createElement('div');
            caseCard.className = 'case-card fade-in';
            caseCard.dataset.id = caseItem._id;
            caseCard.dataset.category = caseItem.category || 'all';
            
            // Определяем тег для кейса
            let tagHTML = '';
            if (caseItem.isNew) {
                tagHTML = `<div class="case-tag tag-new">Новинка</div>`;
            } else if (caseItem.isPopular) {
                tagHTML = `<div class="case-tag tag-popular">Популярный</div>`;
            } else if (caseItem.isSpecial) {
                tagHTML = `<div class="case-tag tag-special">Специальный</div>`;
            }
            
            caseCard.innerHTML = `
                ${tagHTML}
                <div class="case-image-container">
                    <img src="images/cases/${caseItem.image}" alt="${caseItem.name}" loading="lazy">
                </div>
                <div class="case-info">
                    <h3 class="case-name">${caseItem.name}</h3>
                    <p class="case-description">${caseItem.description}</p>
                    <div class="case-footer">
                        <div class="case-price">
                            <span class="price-value">${caseItem.price}</span>
                            <span class="price-currency">очков</span>
                        </div>
                        <button class="open-btn" data-case-id="${caseItem._id}">Открыть</button>
                    </div>
                </div>
            `;
            
            casesGrid.appendChild(caseCard);
        });
        
        // Инициализируем анимацию fade-in
        setupFadeInAnimation();
        
        // Добавляем обработчики событий для кнопок открытия кейсов
        document.querySelectorAll('.open-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const caseId = this.getAttribute('data-case-id');
                showCaseModal(caseId);
            });
        });
    }
    
    // Фильтрация кейсов
    function filterCases(category) {
        let filteredCases;
        
        if (category === 'all') {
            filteredCases = cases;
        } else if (category === 'new') {
            filteredCases = cases.filter(caseItem => caseItem.isNew);
        } else if (category === 'popular') {
            filteredCases = cases.filter(caseItem => caseItem.isPopular);
        } else if (category === 'special') {
            filteredCases = cases.filter(caseItem => caseItem.isSpecial);
        } else {
            filteredCases = cases.filter(caseItem => caseItem.category === category);
        }
        
        renderCases(filteredCases);
    }
    
    // Обработчики кнопок фильтрации
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            filterCases(filter);
        });
    });
    
    // Показать модальное окно кейса
    async function showCaseModal(caseId) {
        try {
            const caseData = await API.getCaseById(caseId);
            if (!caseData) {
                console.error('Кейс не найден');
                return;
            }
            
            // Заполняем данные в модальном окне
            document.querySelector('.case-modal-name').textContent = caseData.name;
            document.querySelector('.case-modal-description').textContent = caseData.description;
            document.querySelector('.case-modal-image').src = `images/cases/${caseData.image}`;
            document.querySelector('.price-value').textContent = caseData.price;
            
            // Заполняем список предметов
            const itemsGrid = document.querySelector('.items-grid');
            itemsGrid.innerHTML = '';
            
            if (caseData.items && caseData.items.length > 0) {
                caseData.items.forEach(item => {
                    const itemPreview = document.createElement('div');
                    itemPreview.className = 'item-preview';
                    
                    itemPreview.innerHTML = `
                        <div class="item-rarity rarity-${item.rarity}"></div>
                        <img src="images/items/${item.image}" alt="${item.name}" loading="lazy">
                        <span class="item-preview-name">${item.name}</span>
                    `;
                    
                    itemsGrid.appendChild(itemPreview);
                });
            } else {
                itemsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: rgba(209, 212, 255, 0.5);">Информация о предметах недоступна</p>';
            }
            
            // Добавляем обработчик для кнопки открытия кейса
            const openCaseBtn = document.querySelector('.open-case-btn');
            openCaseBtn.dataset.caseId = caseId;
            openCaseBtn.addEventListener('click', handleOpenCase);
            
            // Показываем модальное окно
            caseOpenModal.classList.add('active');
            
            // Закрытие модального окна по клику на крестик
            caseOpenModal.querySelector('.close-modal').addEventListener('click', function() {
                caseOpenModal.classList.remove('active');
            });
            
            // Закрытие модального окна по клику вне него
            caseOpenModal.addEventListener('click', function(event) {
                if (event.target === caseOpenModal) {
                    caseOpenModal.classList.remove('active');
                }
            });
        } catch (error) {
            console.error('Ошибка при получении данных кейса:', error);
            alert('Не удалось загрузить данные кейса. Пожалуйста, попробуйте позже.');
        }
    }
    
    // Обработчик открытия кейса
    async function handleOpenCase() {
        const caseId = this.dataset.caseId;
        
        // Проверяем авторизацию
        if (!isLoggedIn()) {
            alert('Для открытия кейса необходимо авторизоваться');
            return;
        }
        
        try {
            // Закрываем модальное окно с информацией о кейсе
            caseOpenModal.classList.remove('active');
            
            // Открываем модальное окно с результатами
            caseResultModal.classList.add('active');
            
            // Создаем и анимируем рулетку перед показом результата
            const resultAnimation = document.querySelector('.result-animation');
            const rouletteContainer = document.querySelector('.result-roulette');
            const resultItem = document.querySelector('.result-item');
            
            resultAnimation.style.display = 'block';
            resultItem.style.display = 'none';
            
            // Создаем рулетку предметов
            rouletteContainer.innerHTML = '';
            rouletteContainer.style.transform = 'translateX(0)';
            
            // Добавляем указатель центра
            resultAnimation.innerHTML = `
                <div class="result-roulette"></div>
                <div class="result-pointer"></div>
            `;
            
            // Получаем обновленную ссылку
            const roulette = document.querySelector('.result-roulette');
            
            // Анимация загрузки результата
            for (let i = 0; i < 30; i++) {
                // Создаем случайные предметы для анимации
                const randomItem = document.createElement('div');
                randomItem.className = 'roulette-item';
                
                // Каждый 15-й элемент будет победным (для демонстрации)
                if (i === 15) {
                    randomItem.classList.add('winning-item');
                    randomItem.innerHTML = `
                        <div class="spinner"></div>
                    `;
                } else {
                    const rarity = getRandomRarity();
                    randomItem.innerHTML = `
                        <div class="item-rarity rarity-${rarity}"></div>
                        <div style="width: 80px; height: 80px; background: rgba(255, 255, 255, 0.05);"></div>
                    `;
                }
                
                roulette.appendChild(randomItem);
            }
            
            // Запускаем анимацию рулетки
            setTimeout(() => {
                roulette.style.transition = 'transform 8s cubic-bezier(0.215, 0.610, 0.355, 1.000)';
                roulette.style.transform = `translateX(calc(-50% - 65px + 50vw))`;
                
                // Открываем кейс после начала анимации
                openCaseAndShowResult(caseId);
            }, 100);
        } catch (error) {
            console.error('Ошибка при обработке открытия кейса:', error);
            alert('Произошла ошибка при открытии кейса. Попробуйте позже.');
            caseResultModal.classList.remove('active');
        }
    }
    
    // Функция для получения случайной редкости (для анимации рулетки)
    function getRandomRarity() {
        const rarities = ['common', 'uncommon', 'rare', 'mythical', 'legendary', 'ancient'];
        const weights = [50, 25, 15, 7, 2.5, 0.5]; // Вероятности (в процентах)
        
        const random = Math.random() * 100;
        let cumulativeWeight = 0;
        
        for (let i = 0; i < rarities.length; i++) {
            cumulativeWeight += weights[i];
            if (random < cumulativeWeight) {
                return rarities[i];
            }
        }
        
        return rarities[0]; // На всякий случай возвращаем common
    }
    
    // Отправляем запрос на открытие кейса и показываем результат
    async function openCaseAndShowResult(caseId) {
        try {
            // Отправляем запрос на сервер
            const result = await API.openCase(caseId);
            
            if (!result.success) {
                throw new Error(result.error || 'Произошла ошибка при открытии кейса');
            }
            
            // Обновляем баланс пользователя
            document.querySelectorAll('.user-points').forEach(el => {
                el.textContent = result.newBalance;
            });
            
            // После анимации рулетки показываем результат
            setTimeout(() => {
                // Скрываем анимацию и показываем результат
                document.querySelector('.result-animation').style.display = 'none';
                document.querySelector('.result-item').style.display = 'flex';
                
                // Заполняем данные о выпавшем предмете
                const item = result.item;
                document.querySelector('.item-image').src = `images/items/${item.image}`;
                document.querySelector('.item-name').textContent = item.name;
                document.querySelector('.item-rarity').textContent = getRarityName(item.rarity);
                document.querySelector('.item-rarity').className = `item-rarity rarity-text-${item.rarity}`;
                document.querySelector('.item-rarity-overlay').className = `item-rarity-overlay bg-${item.rarity}`;
                
                // Добавляем обработчики для кнопок
                document.querySelector('.view-inventory-btn').addEventListener('click', function() {
                    window.location.href = 'inventory.html';
                });
                
                document.querySelector('.open-again-btn').addEventListener('click', function() {
                    caseResultModal.classList.remove('active');
                    showCaseModal(caseId);
                });
            }, 8000); // Немного больше времени, чем длительность анимации
        } catch (error) {
            console.error('Ошибка при открытии кейса:', error);
            
            // Показываем ошибку пользователю
            setTimeout(() => {
                alert(`Ошибка: ${error.message}`);
                caseResultModal.classList.remove('active');
            }, 500);
        }
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
    
    // Закрытие модального окна с результатом по клику на крестик
    caseResultModal.querySelector('.close-modal').addEventListener('click', function() {
        caseResultModal.classList.remove('active');
    });
    
    // Инициализация
    if (isLoggedIn()) {
        loadCases();
    }
});