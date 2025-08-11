<script setup lang="ts">
import LuckyWheel from './components/LuckyWheel.vue'
import { loading } from './axiosInstance.js';


</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-pink-200 via-yellow-200 to-orange-200 p-6 flex items-center justify-center">
    <transition name="fade">
      <div v-if="loading" class="fixed inset-0 bg-black opacity-50 flex items-center justify-center z-50">
        <div class="flex flex-col items-center gap-3">
          <div class="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          <span class="text-white text-lg font-semibold">Đang tải...</span>
        </div>
      </div>
    </transition>

    <lucky-wheel />
  </div>
</template>
<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>