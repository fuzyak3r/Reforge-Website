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
        // Получение данных игрока по steamID
        const { steamId } = req.query;
        if (steamId) {
          const player = await db.collection("players").findOne({ s: steamId });
          if (!player) {
            await client.close();
            return res.status(404).json({ error: "Игрок не найден" });
          }
          await client.close();
          return res.status(200).json(player);
        } else {
          // Получение списка игроков (с лимитом)
          const players = await db.collection("players")
            .find({})
            .limit(20)
            .toArray();
          await client.close();
          return res.status(200).json(players);
        }
      
      case 'POST':
        // Проверка авторизации для изменения данных
        let user;
        try {
          user = authenticateUser(req);
        } catch (error) {
          await client.close();
          return res.status(401).json({ error: error.message });
        }
        
        // Только админы или сам игрок могут обновлять данные
        const playerData = req.body;
        if (playerData.s !== user.steamId) {
          // Проверяем, является ли пользователь админом
          const isAdmin = await db.collection("admins").findOne({ steamId: user.steamId });
          if (!isAdmin) {
            await client.close();
            return res.status(403).json({ error: "Недостаточно прав" });
          }
        }
        
        // Создание или обновление игрока
        if (!playerData.s) {
          await client.close();
          return res.status(400).json({ error: "Отсутствует steamId" });
        }
        
        const result = await db.collection("players").updateOne(
          { s: playerData.s },
          { $set: playerData },
          { upsert: true }
        );
        
        await client.close();
        return res.status(200).json({ 
          success: true, 
          updated: result.modifiedCount > 0,
          created: result.upsertedCount > 0
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