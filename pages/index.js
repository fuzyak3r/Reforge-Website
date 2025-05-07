import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Перенаправить на основной HTML-файл
    window.location.href = '/index.html';
  }, []);
  
  return <div>Redirecting...</div>;
}