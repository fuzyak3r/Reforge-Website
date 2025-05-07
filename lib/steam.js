const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const { MongoClient } = require('mongodb');

// Настройка стратегии Steam для passport
passport.use(new SteamStrategy({
  returnURL: `${process.env.WEBSITE_URL}/api/auth/steam/return`,
  realm: process.env.WEBSITE_URL,
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
      // Обновляем информацию о игроке, если он уже существует
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
        p: 0, // Начальные очки
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

// Экспортируем настроенный passport
module.exports = passport;