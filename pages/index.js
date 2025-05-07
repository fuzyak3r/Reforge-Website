// Простая страница-заглушка, которая будет перенаправлять на статический index.html
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Перенаправить на статический HTML
    window.location.href = '/index.html';
  }, []);
  
  // Возвращаем что-то, пока не произошло перенаправление
  return <div>Loading...</div>;
}