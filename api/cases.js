import { MongoClient, ObjectId } from 'mongodb';

export default async function handler(req, res) {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    // Получение конкретного кейса по ID
    if (req.query.id) {
      let caseId;
      try {
        caseId = new ObjectId(req.query.id);
      } catch (e) {
        await client.close();
        return res.status(400).json({ error: 'Неверный формат ID' });
      }
      
      const caseData = await db.collection('cases').findOne({ _id: caseId });
      
      if (!caseData) {
        await client.close();
        return res.status(404).json({ error: 'Кейс не найден' });
      }
      
      // Получаем данные о предметах в кейсе
      if (caseData.items && caseData.items.length > 0) {
        const itemIds = caseData.items.map(item => {
          try {
            return new ObjectId(item._id);
          } catch (e) {
            return null;
          }
        }).filter(Boolean);
        
        const items = await db.collection('items').find({
          _id: { $in: itemIds }
        }).toArray();
        
        // Объединяем данные о предметах с информацией о редкости из кейса
        const enrichedItems = items.map(item => {
          const caseItemInfo = caseData.items.find(cItem => cItem._id.toString() === item._id.toString());
          return {
            ...item,
            rarity: caseItemInfo?.rarity || item.rarity
          };
        });
        
        caseData.items = enrichedItems;
      }
      
      await client.close();
      return res.status(200).json(caseData);
    }
    
    // Получение списка кейсов с фильтрацией
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    // Определение сортировки
    let sort = { createdAt: -1 }; // По умолчанию - сначала новые
    if (req.query.sort === 'price-asc') {
      sort = { price: 1 };
    } else if (req.query.sort === 'price-desc') {
      sort = { price: -1 };
    } else if (req.query.sort === 'popular') {
      sort = { openCount: -1 };
    }
    
    // Получаем кейсы
    const cases = await db.collection('cases')
      .find(filter)
      .sort(sort)
      .toArray();
    
    await client.close();
    return res.status(200).json(cases);
    
  } catch (error) {
    console.error('Ошибка при получении данных о кейсах:', error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}