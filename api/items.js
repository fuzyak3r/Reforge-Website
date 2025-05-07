import { MongoClient, ObjectId } from 'mongodb';

export default async function handler(req, res) {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    // Получение конкретного предмета по ID
    if (req.query.id) {
      let itemId;
      try {
        itemId = new ObjectId(req.query.id);
      } catch (e) {
        await client.close();
        return res.status(400).json({ error: 'Неверный формат ID' });
      }
      
      const item = await db.collection('items').findOne({ _id: itemId });
      
      if (!item) {
        await client.close();
        return res.status(404).json({ error: 'Предмет не найден' });
      }
      
      await client.close();
      return res.status(200).json(item);
    }
    
    // Получение списка предметов с фильтрацией
    const filter = {};
    if (req.query.rarity) {
      filter.rarity = req.query.rarity;
    }
    if (req.query.type) {
      filter.type = req.query.type;
    }
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }
    
    // Определение сортировки
    let sort = { name: 1 }; // По умолчанию - по имени
    if (req.query.sort === 'rarity') {
      const rarityOrder = {
        'common': 1,
        'uncommon': 2,
        'rare': 3,
        'mythical': 4,
        'legendary': 5,
        'ancient': 6
      };
      
      // Сортировка по редкости (через агрегацию)
      const items = await db.collection('items')
        .aggregate([
          { $match: filter },
          { $addFields: { 
            rarityOrder: { 
              $switch: {
                branches: [
                  { case: { $eq: ["$rarity", "common"] }, then: 1 },
                  { case: { $eq: ["$rarity", "uncommon"] }, then: 2 },
                  { case: { $eq: ["$rarity", "rare"] }, then: 3 },
                  { case: { $eq: ["$rarity", "mythical"] }, then: 4 },
                  { case: { $eq: ["$rarity", "legendary"] }, then: 5 },
                  { case: { $eq: ["$rarity", "ancient"] }, then: 6 }
                ],
                default: 0
              }
            }
          }},
          { $sort: { rarityOrder: -1, name: 1 } }
        ])
        .toArray();
      
      await client.close();
      return res.status(200).json(items);
    } else {
      // Обычная сортировка
      const items = await db.collection('items')
        .find(filter)
        .sort(sort)
        .toArray();
      
      await client.close();
      return res.status(200).json(items);
    }
    
  } catch (error) {
    console.error('Ошибка при получении данных о предметах:', error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}