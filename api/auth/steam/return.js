const passport = require('../steam');
const session = require('express-session');
const jwt = require('jsonwebtoken');

// Настройка сессий (аналогично api/auth/login.js)
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'reforge-session',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
});

// Инициализация Passport и сессии
const passportMiddleware = (req, res, next) => {
  sessionMiddleware(req, res, () => {
    passport.initialize()(req, res, () => {
      passport.session()(req, res, next);
    });
  });
};

// Обработчик возвращения из Steam авторизации
module.exports = (req, res) => {
  passportMiddleware(req, res, () => {
    passport.authenticate('steam', { failureRedirect: '/' })(req, res, () => {
      // Успешная авторизация
      if (req.user) {
        // Создаем JWT токен с ограниченным временем жизни
        const token = jwt.sign(
          { 
            steamId: req.user.id,
            displayName: req.user.displayName
          }, 
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        
        // Перенаправляем на главную страницу с токеном
        res.redirect(`/?token=${token}`);
      } else {
        res.redirect('/?error=auth_failed');
      }
    });
  });
};