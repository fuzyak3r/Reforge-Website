const passport = require('./steam');
const session = require('express-session');
const jwt = require('jsonwebtoken');

// Настройка сессий
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

// Обработчик запуска Steam авторизации
module.exports = (req, res) => {
  passportMiddleware(req, res, () => {
    passport.authenticate('steam', { failureRedirect: '/' })(req, res, () => {
      // Этот код никогда не выполнится, так как Steam перенаправляет пользователя
    });
  });
};