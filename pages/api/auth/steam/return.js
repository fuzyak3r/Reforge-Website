import passport from 'passport';
import session from 'express-session';
import jwt from 'jsonwebtoken';
import { Strategy as SteamStrategy } from 'passport-steam';
import { MongoClient } from 'mongodb';

// Инициализируем стратегию (дублируем код для этого API endpoint)
if (!passport._strategies.steam) {
  passport.use(new SteamStrategy({
    returnURL: `${process.env.WEBSITE_URL || 'http://localhost:3000'}/api/auth/steam/return`,
    realm: process.env.WEBSITE_URL || 'http://localhost:3000',
    apiKey: process.env.STEAM_API_KEY
  }, async (identifier, profile, done) => {
    try {
      const steamId = profile.id;
      
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      const db = client.db();
      
      const player = await db.collection('players').findOne({ s: steamId });
      
      if (player) {
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
      
      return done(null, profile);
    } catch (error) {
      console.error('Ошибка при авторизации через Steam:', error);
      return done(error);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((obj, done) => {
    done(null, obj);
  });
}

// Настройка сессий
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'reforge-session',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
});

export default function handler(req, res) {
  sessionMiddleware(req, res, () => {
    passport.initialize()(req, res, () => {
      passport.session()(req, res, () => {
        passport.authenticate('steam', { failureRedirect: '/' })(req, res, () => {
          // Успешная авторизация
          if (req.user) {
            // Создаем JWT токен
            const token = jwt.sign(
              { 
                steamId: req.user.id,
                displayName: req.user.displayName
              }, 
              process.env.JWT_SECRET || 'reforge-jwt-secret',
              { expiresIn: '7d' }
            );
            
            // Перенаправляем на главную страницу с токеном
            res.redirect(`/?token=${token}`);
          } else {
            res.redirect('/?error=auth_failed');
          }
        });
      });
    });
  });
}