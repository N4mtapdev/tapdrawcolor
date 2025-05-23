import { useRef, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';

const firebaseConfig = {
  // Thay bằng cấu hình Firebase của bạn
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function Home() {
  const canvasRef = useRef(null);
  const [color, setColor] = useState('#000000');
  const [zoom, setZoom] = useState(false);
  const [message, setMessage] = useState('');
  const pixelSize = 10;
  const canvasSize = 500;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Vẽ nền trắng
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Vẽ lưới
    for (let x = 0; x < canvasSize; x += pixelSize) {
      for (let y = 0; y < canvasSize; y += pixelSize) {
        ctx.strokeStyle = '#E0E0E0';
        ctx.strokeRect(x, y, pixelSize, pixelSize);
      }
    }

    // Lắng nghe thay đổi từ Firebase
    const canvasRefDb = ref(db, 'canvas');
    onValue(canvasRefDb, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        for (let key in data) {
          const [x, y] = key.split('_').map(Number);
          ctx.fillStyle = data[key].color;
          ctx.fillRect(x, y, pixelSize, pixelSize);
        }
      }
    });
  }, []);

  const placePixel = async (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.touches[0].clientX - rect.left) / pixelSize) * pixelSize;
    const y = Math.floor((e.touches[0].clientY - rect.top) / pixelSize) * pixelSize;

    // Tạo userId tạm thời (dựa trên thời gian và ngẫu nhiên)
    const userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    try {
      const res = await fetch('/api/place-pixel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y, color, userId }),
      });

      if (res.ok) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, pixelSize, pixelSize);
        setMessage('Pixel placed successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const { error } = await res.json();
        setMessage(error || 'Error placing pixel');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    }
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        className={zoom ? 'zoomed' : ''}
        onTouchStart={placePixel}
      />
      <div className="controls">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <button onClick={() => setZoom(!zoom)}>
          {zoom ? 'Zoom Out' : 'Zoom In'}
        </button>
      </div>
      {message && <div className="message">{message}</div>}
    </div>
  );
}