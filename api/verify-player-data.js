import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  // Проверяем, что запрос пришёл с нужным API ключом от игрового сервера
  const serverApiKey = req.headers['x-server-api-key'];
  if (!serverApiKey || serverApiKey !== process.env.GAME_SERVER_API_KEY) {
    return res.status(401).json({ error: 'Недействительный API ключ сервера' });
  }
  
  try {
    const { steamId, expectedPoints, action } = req.body;
    
    // Валидация данных
    if (!steamId || typeof expectedPoints !== 'number') {
      return res.status(400).json({ error: 'Неверные параметры запроса' });
    }
    
    // Подключаемся к базе данных
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    // Получаем актуальные данные игрока
    const player = await db.collection('players').findOne({ s: steamId });
    if (!player) {
      await client.close();
      return res.status(404).json({ error: 'Игрок не найден' });
    }
    
    // Сравниваем очки в базе с ожидаемыми очками от игрового сервера
    const actualPoints = player.p || 0;
    const isValid = actualPoints === expectedPoints;
    
    // Логируем проверку для аудита
    await db.collection('verifications').insertOne({
      steamId,
      expectedPoints,
      actualPoints,
      isValid,
      action,
      timestamp: new Date(),
      source: 'game_server'
    });
    
    // Если обнаружено расхождение и требуется автоматическая коррекция
    if (!isValid && action === 'auto_fix') {
      await db.collection('players').updateOne(
        { s: steamId },
        { $set: { p: expectedPoints } }
      );
      
      await db.collection('transactions').insertOne({
        type: 'auto_correction',
        userId: steamId,
        previousAmount: actualPoints,
        newAmount: expectedPoints,
        difference: expectedPoints - actualPoints,
        timestamp: new Date(),
        reason: 'Data integrity verification'
      });
      
      await client.close();
      return res.status(200).json({ 
        valid: false, 
        corrected: true,
        actualPoints: expectedPoints,
        previousPoints: actualPoints
      });
    }
    
    await client.close();
    return res.status(200).json({
      valid: isValid,
      actualPoints,
      expectedPoints,
      difference: actualPoints - expectedPoints
    });
    
  } catch (error) {
    console.error('Ошибка верификации данных игрока:', error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}