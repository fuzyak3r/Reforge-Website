import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';

// Middleware для проверки авторизации
const authenticateUser = (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    throw new Error('Требуется авторизация');
  }
  
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Недействительный токен');
  }
};

export default async function handler(req, res) {
  try {
    // Проверка авторизации
    let user;
    try {
      user = authenticateUser(req);
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
    
    // Проверка метода запроса
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Метод не поддерживается' });
    }
    
    // Получаем ID кейса из тела запроса
    const { caseId } = req.body;
    if (!caseId) {
      return res.status(400).json({ error: 'ID кейса не указан' });
    }
    
    // Подключаемся к базе данных
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    // Получаем информацию о кейсе
    const caseInfo = await db.collection('cases').findOne({ _id: caseId });
    if (!caseInfo) {
      await client.close();
      return res.status(404).json({ error: 'Кейс не найден' });
    }
    
    const casePrice = caseInfo.price || 1000; // Цена кейса
    
    // Получаем данные игрока
    const player = await db.collection('players').findOne({ s: user.steamId });
    if (!player) {
      await client.close();
      return res.status(404).json({ error: 'Игрок не найден' });
    }
    
    // Проверяем достаточно ли очков
    if (player.p < casePrice) {
      await client.close();
      return res.status(400).json({ error: 'Недостаточно очков для открытия кейса' });
    }
    
    // Начинаем транзакцию
    const session = client.startSession();
    let openedItem;
    
    try {
      await session.withTransaction(async () => {
        // 1. Списываем очки
        await db.collection('players').updateOne(
          { s: user.steamId },
          { $inc: { p: -casePrice } },
          { session }
        );
        
        // 2. Определяем выпавший предмет на основе вероятностей
        const items = caseInfo.items || [];
        openedItem = getRandomItemByRarity(items);
        
        if (!openedItem) {
          throw new Error('Ошибка определения выпавшего предмета');
        }
        
        // 3. Добавляем предмет в инвентарь
        await db.collection('inventory').insertOne({
          pid: user.steamId,
          iid: openedItem._id,
          acquired: new Date(),
          source: 'case_open',
          caseId: caseId
        }, { session });
        
        // 4. Логируем транзакцию
        await db.collection('transactions').insertOne({
          type: 'case_open',
          userId: user.steamId,
          amount: -casePrice,
          itemId: openedItem._id,
          caseId: caseId,
          timestamp: new Date()
        }, { session });
      });
      
      // Обновляем данные игрока после транзакции
      const updatedPlayer = await db.collection('players').findOne({ s: user.steamId });
      
      // Получаем полную информацию о предмете
      const item = await db.collection('items').findOne({ _id: openedItem._id });
      
      await session.endSession();
      await client.close();
      
      // Возвращаем успешный результат с информацией о выпавшем предмете
      return res.status(200).json({
        success: true,
        item: item,
        newBalance: updatedPlayer.p
      });
      
    } catch (error) {
      await session.endSession();
      await client.close();
      console.error('Ошибка при открытии кейса:', error);
      return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  } catch (error) {
    console.error('Общая ошибка:', error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

// Функция для выбора случайного предмета с учетом редкости
function getRandomItemByRarity(items) {
  if (!items || items.length === 0) return null;
  
  // Распределение вероятностей по редкости
  const rarityWeights = {
    'common': 0.5,      // 50%
    'uncommon': 0.25,   // 25%
    'rare': 0.15,       // 15%
    'mythical': 0.07,   // 7%
    'legendary': 0.025, // 2.5%
    'ancient': 0.005    // 0.5%
  };
  
  // Группируем предметы по редкости
  const itemsByRarity = {};
  for (const item of items) {
    if (!itemsByRarity[item.rarity]) {
      itemsByRarity[item.rarity] = [];
    }
    itemsByRarity[item.rarity].push(item);
  }
  
  // Сначала выбираем редкость
  const random = Math.random();
  let cumulativeProbability = 0;
  let selectedRarity = 'common'; // По умолчанию
  
  for (const [rarity, probability] of Object.entries(rarityWeights)) {
    cumulativeProbability += probability;
    if (random < cumulativeProbability && itemsByRarity[rarity]?.length > 0) {
      selectedRarity = rarity;
      break;
    }
  }
  
  // Затем случайный предмет выбранной редкости
  const rarityItems = itemsByRarity[selectedRarity] || items;
  const randomIndex = Math.floor(Math.random() * rarityItems.length);
  return rarityItems[randomIndex];
}