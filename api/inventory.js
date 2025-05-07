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
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    switch (req.method) {
      case 'GET':
        // Получение инвентаря игрока
        const { steamId } = req.query;
        
        // Если steamId не указан, используем steamId из токена авторизации
        let userId = steamId;
        if (!userId) {
          try {
            const user = authenticateUser(req);
            userId = user.steamId;
          } catch (error) {
            await client.close();
            return res.status(401).json({ error: error.message });
          }
        }
        
        if (!userId) {
          await client.close();
          return res.status(400).json({ error: "Отсутствует steamId" });
        }
        
        const inventory = await db.collection("inventory")
          .find({ pid: userId })
          .toArray();
          
        // Если нужны детали предметов, получаем их из коллекции items
        const itemIds = inventory.map(item => item.iid);
        const items = await db.collection("items")
          .find({ _id: { $in: itemIds } })
          .toArray();
          
        // Соединяем данные инвентаря с информацией о предметах
        const inventoryWithDetails = inventory.map(invItem => {
          const itemDetails = items.find(i => i._id.toString() === invItem.iid.toString());
          return { ...invItem, details: itemDetails };
        });
        
        await client.close();
        return res.status(200).json(inventoryWithDetails);
        
      case 'POST':
        // Проверка авторизации
        let user;
        try {
          user = authenticateUser(req);
        } catch (error) {
          await client.close();
          return res.status(401).json({ error: error.message });
        }
        
        // Добавление предмета в инвентарь игрока
        const { playerId, itemId } = req.body;
        
        // Только админы или сам игрок могут изменять инвентарь
        if (playerId !== user.steamId) {
          const isAdmin = await db.collection("admins").findOne({ steamId: user.steamId });
          if (!isAdmin) {
            await client.close();
            return res.status(403).json({ error: "Недостаточно прав" });
          }
        }
        
        if (!playerId || !itemId) {
          await client.close();
          return res.status(400).json({ error: "Отсутствуют необходимые данные" });
        }
        
        const result = await db.collection("inventory").insertOne({
          pid: playerId,
          iid: itemId,
          acquired: new Date()
        });
        
        await client.close();
        return res.status(201).json({ 
          success: true, 
          inventoryId: result.insertedId
        });
        
      default:
        await client.close();
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
}