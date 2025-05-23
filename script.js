// Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCPt2bgKtewN1tfCg34Ngh_f0moeqlxusk",
  authDomain: "tapdrawcolor.firebaseapp.com",
  databaseURL: "https://tapdrawcolor-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tapdrawcolor",
  storageBucket: "tapdrawcolor.firebasestorage.app",
  messagingSenderId: "199258807774",
  appId: "1:199258807774:web:fa5a2b7022489773aa514f",
  measurementId: "G-7S67T61290"
};

// Khởi tạo Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Thiết lập canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const pixelSize = 10;
const canvasSize = 500;
canvas.width = canvasSize;
canvas.height = canvasSize;

// Vẽ nền trắng và lưới
ctx.fillStyle = '#FFFFFF';
ctx.fillRect(0, 0, canvasSize, canvasSize);
for (let x = 0; x < canvasSize; x += pixelSize) {
  for (let y = 0; y < canvasSize; y += pixelSize) {
    ctx.strokeStyle = '#E0E0E0';
    ctx.strokeRect(x, y, pixelSize, pixelSize);
  }
}

// Lắng nghe thay đổi từ Firebase
const canvasRef = db.ref('canvas');
canvasRef.on('value', (snapshot) => {
  const data = snapshot.val();
  if (data) {
    for (let key in data) {
      const [x, y] = key.split('_').map(Number);
      ctx.fillStyle = data[key].color;
      ctx.fillRect(x, y, pixelSize, pixelSize);
    }
  }
});

// Xử lý sự kiện chạm để đặt pixel
canvas.addEventListener('touchstart', async (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.touches[0].clientX - rect.left) / pixelSize) * pixelSize;
  const y = Math.floor((e.touches[0].clientY - rect.top) / pixelSize) * pixelSize;
  const color = document.getElementById('colorPicker').value;
  const userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  // Kiểm tra thời gian đặt pixel
  const lastPlacedRef = db.ref(`users/${userId}/lastPlaced`);
  const lastPlaced = await lastPlacedRef.once('value');
  const now = Date.now();
  if (lastPlaced.val() && now - lastPlaced.val() < 5 * 60 * 1000) {
    showMessage('Vui lòng chờ 5 phút trước khi đặt pixel tiếp theo');
    return;
  }

  // Lưu pixel và thời gian
  await db.ref(`canvas/${x}_${y}`).set({ color });
  await lastPlacedRef.set(now);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, pixelSize, pixelSize);
  showMessage('Pixel đặt thành công!');
});

// Xử lý phóng to/thu nhỏ
const zoomBtn = document.getElementById('zoomBtn');
let zoomed = false;
zoomBtn.addEventListener('click', () => {
  zoomed = !zoomed;
  canvas.classList.toggle('zoomed', zoomed);
  zoomBtn.textContent = zoomed ? 'Thu nhỏ' : 'Phóng to';
});

// Hiển thị thông báo
function showMessage(text) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = text;
  setTimeout(() => (messageDiv.textContent = ''), 3000);
}