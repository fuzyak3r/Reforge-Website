import jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';

// Middleware для проверки авторизации
const authenticateUser = (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    throw new Error('Требуется авторизация');
  }
  
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'reforge-jwt-secret');
  } catch (error) {
    throw new Error('Недействительный токен');
  }
};

// API для получения данных пользователя
export default async function handler(req, res) {
  try {
    // Проверка авторизации
    let user;
    try {
      user = authenticateUser(req);
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
    
    // Получаем данные пользователя из базы
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    const player = await db.collection('players').findOne({ s: user.steamId });
    
    await client.close();
    
    if (!player) {
      return res.status(404).json({ error: 'Игрок не найден' });
    }
    
    // Возвращаем данные пользователя
    return res.status(200).json({
      steamId: player.s,
      name: player.n,
      points: player.p || 0,
      avatar: player.avatar,
      created: player.created,
      lastLogin: player.lastLogin
    });
    
  } catch (error) {
    console.error('Ошибка получения данных пользователя:', error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}