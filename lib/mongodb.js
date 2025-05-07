import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error('Пожалуйста, добавьте переменную окружения MONGODB_URI в Vercel');
}

// В режиме разработки используем глобальную переменную
// для предотвращения создания новых соединений при каждой перезагрузке
if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // В производственном режиме лучше использовать новый экземпляр соединения
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

// Функция-помощник для подключения к базе данных
export async function connectToDatabase() {
  const client = await clientPromise;
  return client.db();
}