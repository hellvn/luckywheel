<script setup lang="ts">
import api from '../axiosInstance';
import { ref, onMounted, onUnmounted } from 'vue'
import Results from '../components/Results.vue';
import WinnerPopup from './WinnerPopup.vue';

type Prize = { prize: string; color: string; chance: number }
const size = 420
const wheelCanvas = ref<HTMLCanvasElement | null>(null)
const ledCanvas = ref<HTMLCanvasElement | null>(null)
const isSpinning = ref(false)
const rotation = ref(0) // radians

// prizes editable
const prizes = ref<Prize[]>([])
const showPopup = ref(false);
const currentPrize = ref({
  name: '',
  prize: ''
});
const player = ref({ name: '', phone: '', address: '' })
const apiKey = import.meta.env.VITE_GOOGLE_SHEET_API_KEY;
const sheetId = import.meta.env.VITE_GOOGLE_SHEET_ID;

const appScriptKey = import.meta.env.VITE_GOOGLE_APP_SCRIPT_KEY;
// const fakePrizes = [
//   'Giải đặc biệt',
//   'Voucher 10%',
//   'MyQ Implant',
//   'Yesbiotech Implant',
//   'Biologitech Implant'
// ];

const names = [
  'Vũ Phương Thảo',
  'Nguyễn Ngọc Duy',
  'Phùng Ngọc Thắng',
  'Nguyễn Nhật Quang',
  'Dương Thị Phượng',
  'Lương Xuân Giang',
  'Vũ Thị Nga',
  'Nguyễn Minh Giang',
  'Hoàng Thị Mai Hiên',
  'Trịnh Thị Ninh',
  'Trần Kiều Oanh',
  'Vũ Hùng Thế',
  'Phạm Tuấn Anh',
  'Bằng Văn Trần',
  'Tạ Thị Thu Hương',
  'Đỗ Trương Long',
  'Đỗ Xuân Hoạt',
  'Lê Thị Bình',
  'Nguyễn Thị Huệ',
  'Nguyễn Thị Diệp Ngọc',
  'Đinh Văn Tình',
  'Phạm Văn Tuyền',
  'Dương Văn Hoàng',
  'Đỗ Dương Long',
  'Nguyễn Thị Lý',
  'Trần Văn Thạch',
  'Phạm Thị Duyên',
  'Nguyễn Hà Duy',
  'Gia Đạt',
  'Hà Văn Thắng',
  'Dương Thanh Thủy',
  'Nguyễn Quốc Đạt',
];

function getRandomWinner() {
  const name = names[Math.floor(Math.random() * names.length)];
  const chosen = pickByChance()
  const prize = prizes.value[chosen || 0].prize;
  return {
    id: Date.now() + Math.random(), // unique key
    name,
    prize: prize
  }
}

const results = ref<{
  id: number;
  name: string;
  prize: string;
}[]>([])

// LED animation state
let ledAnimId = 0
let ledOffset = 0

// helpers
function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3) }

// DRAW WHEEL (canvas)
function drawWheel() {
  const canvas = wheelCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // HiDPI
  const dpr = window.devicePixelRatio || 1
  if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, size, size)

  const center = size / 2
  const outerR = center - 12
  const innerR = 60
  const arc = (2 * Math.PI) / prizes.value.length

  // gold outer ring (back)
  ctx.beginPath()
  ctx.arc(center, center, outerR + 10, 0, Math.PI * 2)
  ctx.fillStyle = '#f59e0b'
  ctx.fill()

  // wheel slices — rotate by rotation.value
  ctx.save()
  ctx.translate(center, center)
  ctx.rotate(rotation.value)
  for (let i = 0; i < prizes.value.length; i++) {
    const start = i * arc
    const end = start + arc
    const p = prizes.value[i]
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, outerR, start, end)
    ctx.closePath()
    const g = ctx.createLinearGradient(
      Math.cos(start + arc / 2) * -outerR, Math.sin(start + arc / 2) * -outerR,
      Math.cos(start + arc / 2) * outerR, Math.sin(start + arc / 2) * outerR
    )
    g.addColorStop(0, lighten(p.color, 0.12))
    g.addColorStop(1, p.color)
    ctx.fillStyle = g

    ctx.fill()
    ctx.lineWidth = 6
    ctx.strokeStyle = '#fff'
    ctx.stroke()

    // label
    ctx.save()
    ctx.rotate(start + arc / 2)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 14px Inter, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = "middle";
    wrapText(ctx, p.prize, innerR + 26, 0, outerR / 2, 16);
    ctx.restore()
  }
  ctx.restore()

  // center rings (static; drawn by wheel canvas)
  ctx.beginPath()
  ctx.arc(center, center, innerR + 10, 0, Math.PI * 2)
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.lineWidth = 6
  ctx.strokeStyle = '#f59e0b'
  ctx.stroke()
}

// Hàm chia text thành nhiều dòng
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  const lines = [];
  let line = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = line ? (line + ' ' + words[n]) : words[n];
    if (ctx.measureText(testLine).width > maxWidth) {
      if (line) {
        lines.push(line);
        line = words[n];
      } else {
        // một từ quá dài -> tách theo ký tự
        let fragment = '';
        for (const ch of words[n]) {
          if (ctx.measureText(fragment + ch).width > maxWidth) {
            if (fragment) lines.push(fragment);
            fragment = ch;
          } else {
            fragment += ch;
          }
        }
        line = fragment;
      }
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);

  // căn dọc: đặt tâm dọc của block text bằng y
  const totalHeight = (lines.length - 1) * lineHeight;
  const startY = y - totalHeight / 2;

  lines.forEach((l, i) => {
    ctx.fillText(l, x, startY + i * lineHeight);
  });
}

// LED layer draws bulbs and cycles through colors
function drawLEDs() {
  const canvas = ledCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, size, size)

  const center = size / 2
  const outerR = center - 6
  const bulbCount = Math.max(20, prizes.value.length * 2)
  const bulbRadius = 6
  const palette = ['#fff', '#ffe9b0', '#ffd27f', '#ffbe4f', '#ffea94']

  for (let i = 0; i < bulbCount; i++) {
    const angle = (i / bulbCount) * Math.PI * 2
    const bx = center + Math.cos(angle) * (outerR + 10)
    const by = center + Math.sin(angle) * (outerR + 10)

    const colorIndex = (i + ledOffset) % palette.length
    ctx.beginPath()
    ctx.fillStyle = palette[colorIndex]
    ctx.shadowColor = palette[colorIndex]
    ctx.shadowBlur = 8
    ctx.arc(bx, by, bulbRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }
}

// LED animation loop (runs always)
function startLEDAnimation() {
  const step = () => {
    ledOffset = (ledOffset + 1) % 1000 // big cycle
    drawLEDs()
    ledAnimId = requestAnimationFrame(step)
  }
  if (!ledAnimId) ledAnimId = requestAnimationFrame(step)
}
function stopLEDAnimation() {
  if (ledAnimId) cancelAnimationFrame(ledAnimId)
  ledAnimId = 0
}

// pick by chance ignoring zero
function pickByChance(): number | null {
  const pairs = prizes.value.map((p, i) => ({ i, w: Math.max(0, Number(p.chance || 0)) })).filter(x => x.w > 0)
  if (pairs.length === 0) return null
  const total = pairs.reduce((s, x) => s + x.w, 0)
  let r = Math.random() * total
  for (const p of pairs) {
    if (r <= p.w) return p.i
    r -= p.w
  }
  return pairs[pairs.length - 1].i
}

// spin logic animate wheel to chosen slice
function spinWheel() {
  if (isSpinning.value) return
  if (!player.value.name || !player.value.phone || !player.value.address) {
    alert('Vui lòng nhập họ tên, số điện thoại, địa chỉ trước khi quay.')
    return
  }

  const chosen = pickByChance()
  if (chosen === null) {
    alert('Không có giải hợp lệ (tất cả chance = 0).')
    return
  }

  isSpinning.value = true

  const num = prizes.value.length
  const sliceDeg = 360 / num
  const midDeg = chosen * sliceDeg + sliceDeg / 2
  const fullSpins = 6
  const targetDeg = fullSpins * 360 - midDeg
  const startDeg = (rotation.value * 180 / Math.PI) % 360
  const duration = 4200
  const t0 = performance.now()

  function animate(now: number) {
    const elapsed = now - t0
    const t = Math.min(1, elapsed / duration)
    const eased = easeOutCubic(t)
    const overshoot = Math.sin(t * Math.PI) * 6 * (1 - t) // small bounce at end
    const currentDeg = startDeg + (targetDeg - startDeg) * eased + overshoot
    rotation.value = currentDeg * Math.PI / 180
    drawWheel()
    // drawLEDs (LEDs already animate independently)
    if (t < 1) {
      requestAnimationFrame(animate)
    } else {
      isSpinning.value = false
      const prizeLabel = prizes.value[chosen || 0].prize
      results.value.unshift({
        id: Date.now() + Math.random(), // unique key
        name: player.value.name,
        prize: prizeLabel
      })
      onSpinEnd(player.value.name, prizeLabel);
      // send to webhook if set
      sendResultToSheet({
        date_time: formatDateTimeGMT7(),
        name: player.value.name,
        phone: player.value.phone,
        address: player.value.address,
        prize: prizeLabel
      })
    }
  }
  requestAnimationFrame(animate)
}

function onSpinClick() { spinWheel() }


// fetch prizes from API (optional)
async function fetchPrizes() {
  const range = "prizes!A2:C"; // tuỳ chỉnh
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
  try {
    const response = await api.get(url);
    if (response.status !== 200) {
      throw new Error(`Fetch failed with status ${response.status}`);
    }
    const json = response.data;
    if (!Array.isArray(json.values)) throw new Error('invalid format')
    prizes.value = json.values.map((p: any) => ({ prize: p[0], color: p[1], chance: Number(p[2]) }))
    drawWheel();
    drawLEDs();
    startLEDAnimation();
  } catch (error) {
    console.error(error);
  }
}

// send result
async function sendResultToSheet(payload: Record<string, any>) {
  if (!appScriptKey) return
  try {
    const params = new URLSearchParams(payload)
    await fetch(`https://script.google.com/macros/s/${appScriptKey}/exec?${params.toString()}`)
  } catch (e) { console.error('send webhook failed', e) }
  finally {
    player.value = { name: '', phone: '', address: '' }
  }
}

// color lighten
function lighten(hex: string, amt = 0.12) {
  const c = hex.replace('#', '')
  const num = parseInt(c, 16)
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * amt))
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amt))
  const b = Math.min(255, (num & 0xff) + Math.round(255 * amt))
  return `rgb(${r},${g},${b})`
}

function formatDateTimeGMT7() {
  const date = new Date();

  const gmt7Date = new Date(date.getTime() + 7 * 60 * 60 * 1000);

  const pad = (n: number) => (n < 10 ? "0" + n : n);

  const day = pad(gmt7Date.getUTCDate());
  const month = pad(gmt7Date.getUTCMonth() + 1);
  const year = gmt7Date.getUTCFullYear();

  const hours = pad(gmt7Date.getUTCHours());
  const minutes = pad(gmt7Date.getUTCMinutes());
  const seconds = pad(gmt7Date.getUTCSeconds());

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

function onSpinEnd(name: string, prize: string) {
  currentPrize.value = {
    name: name,
    prize: prize
  };
  showPopup.value = true;
}
// lifecycle
onMounted(async () => {
  await fetchPrizes()
  window.setInterval(() => {
    results.value.unshift(getRandomWinner());
    if (results.value.length > 20) results.value.pop(); // giữ danh sách gọn
  }, 3000); // mỗi 3 giây thêm 1 kết quả giả

})
onUnmounted(() => {
  stopLEDAnimation()
})
</script>

<template>
  <div class="w-full max-w-6xl bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg grid md:grid-cols-2 gap-6">
    <!-- LEFT: Wheel + LEDs -->
    <div class="flex flex-col items-center justify-center">
      <div class="relative" :style="{ width: size + 'px', height: size + 'px' }">
        <!-- wheel canvas (rotates) -->
        <canvas ref="wheelCanvas" :width="size" :height="size" class="rounded-full"></canvas>
        <!-- LED canvas (top layer, does not rotate with wheel) -->
        <canvas ref="ledCanvas" :width="size" :height="size" class="absolute left-0 top-0 pointer-events-none"></canvas>

        <!-- center button (does not rotate) -->
        <button :disabled="isSpinning" @click="onSpinClick" class="absolute z-30 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform"
          :class="isSpinning ? 'bg-gray-400' : 'bg-gradient-to-br from-yellow-400 to-orange-500 hover:scale-105'" title="Quay">
          <span v-if="!isSpinning">QUAY</span>
          <span v-else>ĐANG QUAY</span>

          <!-- pointer attached to button (to the right) -->
          <div class="absolute rotate-180 left-full top-1/2 -translate-y-1/2">
            <svg width="36" height="36" viewBox="0 0 24 24" class="drop-shadow">
              <path fill="#f59e0b" d="M2 12L22 6v12L2 12z"></path>
            </svg>
          </div>
        </button>
      </div>
    </div>

    <!-- RIGHT: Controls -->
    <div>
      <h2 class="text-2xl font-bold mb-3">Thông tin người chơi</h2>

      <!-- player form -->
      <div class="bg-white p-3 rounded-md shadow mb-4">
        <label class="text-sm text-gray-600">Họ tên</label>
        <input v-model="player.name" class="w-full border rounded px-3 py-2 mt-2" placeholder="Họ và tên" />

        <label class="text-sm text-gray-600 mt-3">Số điện thoại</label>
        <input v-model="player.phone" class="w-full border rounded px-3 py-2 mt-2" placeholder="Số điện thoại" />

        <label class="text-sm text-gray-600 mt-3">Địa chỉ</label>
        <input v-model="player.address" class="w-full border rounded px-3 py-2 mt-2" placeholder="Địa chỉ" />
      </div>

      <!-- results -->
      <div class="bg-white p-3 rounded-md shadow">
        <h3 class="font-semibold mb-2">Lịch sử kết quả</h3>
        <Results :winners="results" />
      </div>
    </div>
  </div>
  <WinnerPopup :show="showPopup" :prize="currentPrize" @close="showPopup = false" />
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

:root {
  font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
}

canvas {
  display: block;
  border-radius: 9999px;
}

/* small safety in case Tailwind not loaded */
.bg-white\/80 {
  background-color: rgba(255, 255, 255, 0.8)
}

@keyframes vertical-down {
  0% {
    transform: translateY(-50%);
  }

  100% {
    transform: translateY(0);
  }
}

.animate-vertical-down {
  animation: vertical-down 20s linear infinite;
}
</style>