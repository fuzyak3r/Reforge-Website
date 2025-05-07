// Перенаправляем на основной HTML-файл
export default function Home() {
  return null;
}

// Серверный рендеринг для перенаправления на HTML-файл
export async function getServerSideProps({ res }) {
  res.writeHead(301, { Location: '/index.html' });
  res.end();
  
  return { props: {} };
}