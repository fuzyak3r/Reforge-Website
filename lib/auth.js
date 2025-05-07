import jwt from 'jsonwebtoken';
import { connectToDatabase } from './mongodb';

// Middleware для проверки авторизации
export function authenticateUser(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    throw new Error('Требуется авторизация');
  }
  
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Недействительный токен');
  }
}

// Проверка является ли пользователь администратором
export async function isAdmin(steamId) {
  const db = await connectToDatabase();
  const admin = await db.collection('admins').findOne({ steamId });
  return !!admin;
}

// Получение данных пользователя
export async function getUserData(steamId) {
  const db = await connectToDatabase();
  return await db.collection('players').findOne({ s: steamId });
}