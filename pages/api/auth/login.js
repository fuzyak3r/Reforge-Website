// Вместо импорта из lib используем прямой импорт модулей
import passport from 'passport';
import { Strategy as SteamStrategy } from 'passport-steam';
import { MongoClient } from 'mongodb';
import session from 'express-session';
import jwt from 'jsonwebtoken';

// Инициализируем Passport с Steam стратегией
passport.use(new SteamStrategy({
  returnURL: `${process.env.WEBSITE_URL || 'http://localhost:3000'}/api/auth/steam/return`,
  realm: process.env.WEBSITE_URL || 'http://localhost:3000',
  apiKey: process.env.STEAM_API_KEY
}, async (identifier, profile, done) => {
  try {
    // Получаем SteamID
    const steamId = profile.id;
    
    // Подключаемся к базе данных
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    // Ищем или создаем игрока
    const player = await db.collection('players').findOne({ s: steamId });
    
    if (player) {
      // Обновляем информацию о игроке
      await db.collection('players').updateOne(
        { s: steamId },
        { 
          $set: { 
            n: profile.displayName,
            avatar: profile._json.avatarfull,
            lastLogin: new Date()
          } 
        }
      );
    } else {
      // Создаем нового игрока
      await db.collection('players').insertOne({
        s: steamId,
        n: profile.displayName,
        p: 0,
        avatar: profile._json.avatarfull,
        created: new Date(),
        lastLogin: new Date()
      });
    }
    
    await client.close();
    
    // Возвращаем профиль
    return done(null, profile);
  } catch (error) {
    console.error('Ошибка при авторизации через Steam:', error);
    return done(error);
  }
}));

// Сериализация и десериализация пользователя
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Настройка сессий
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'reforge-session',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
});

// Обработчик API-маршрута
export default function handler(req, res) {
  sessionMiddleware(req, res, () => {
    passport.initialize()(req, res, () => {
      passport.session()(req, res, () => {
        passport.authenticate('steam', { failureRedirect: '/' })(req, res, () => {
          // Этот код обычно не выполняется, так как Steam перенаправляет пользователя
        });
      });
    });
  });
}