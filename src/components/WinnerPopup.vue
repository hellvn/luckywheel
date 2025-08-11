<template>
  <div v-if="show" class="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    <div class="bg-white rounded-xl shadow-xl p-6 w-lg text-center relative animate-fadeIn">
      <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-800" @click="closePopup">
        ✖
      </button>

      <h2 class="text-xl font-bold text-green-600 mb-2">{{ `🎉 Chúc mừng ${prize.name}! 🎉` }}</h2>
      <p class="text-gray-700 mb-4">
        <span class="font-bold text-blue-500" v-if="prize.prize !== 'Lời chúc'">
          {{ `Bạn đã trúng ${prize.prize}!` }}
        </span>
        <span class="font-bold text-blue-500" v-else>
          Bạn đã có một ngày tại sự kiện VIDEC 2025 thành công vui vẻ!
        </span>
      </p>

      <button @click="closePopup" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
        Đóng
      </button>
    </div>
  </div>
</template>

<script setup>
import confetti from "canvas-confetti";
import { watch } from "vue";

const { show, prize } = defineProps({
  show: Boolean,
  prize: {
    name: String,
    prize: String
  }
});
const emit = defineEmits(["close"]);

function closePopup() {
  emit("close");
}

function launchConfetti() {
  const duration = 2 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      return clearInterval(interval);
    }
    const particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    });
  }, 250);
}

watch(() => show, (newVal) => {
  if (newVal) {
    launchConfetti();
  }
});
</script>

<style scoped>
@keyframes fadeIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
</style>