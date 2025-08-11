<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';

const props = defineProps({
    winners: {
        type: Array,
        default: () => []
    }
});
</script>

<template>
    <div ref="container" class="overflow-hidden h-50 relative">
        <transition-group name="slide" tag="ul" class="space-y-2">
            <li v-for="winner in winners" :key="winner.id" class="bg-white shadow p-2 rounded">
                Chúc mừng <span class="font-bold text-red-500">{{ winner.name }}</span> đã trúng: <span class="font-bold text-blue-500">{{ winner.prize }}</span>
            </li>
        </transition-group>
    </div>
</template>
<style scoped>
.slide-enter-active,
.slide-leave-active {
    transition: all 0.5s ease;
}

.slide-enter-from {
    opacity: 0;
    transform: translateY(-20px);
}

.slide-leave-to {
    opacity: 0;
    transform: translateY(20px);
}
</style>