<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';

const props = defineProps({
    winners: {
        type: Array,
        default: () => []
    }
});

const doubledWinners = computed(() => [...props.winners, ...props.winners]);

const offset = ref(0);
let height = 0;
let speed = 0.1; // px mỗi frame
let rafId;

const container = ref(null);
const content = ref(null);

function loop() {
    offset.value += speed;
    if (offset.value >= height ) {
        offset.value = 0; // reset khi đã đi hết nửa danh sách
    }
    rafId = requestAnimationFrame(loop);
}

function startScroll() {
    cancelAnimationFrame(rafId);
    offset.value = 0;
    height = content.value.scrollHeight;
    loop();
}

onMounted(() => {
    startScroll();
});

// Khi winners thay đổi thì khởi động lại scroll
watch(doubledWinners, () => {
    startScroll();
});

onUnmounted(() => cancelAnimationFrame(rafId));
</script>

<template>
    <div ref="container" class="overflow-hidden h-20 relative">
        <div ref="content" class="flex flex-col absolute w-full bottom-0" :style="{ transform: `translateY(${offset}px)` }">
            <span v-for="(winner, index) in doubledWinners" :key="index" class="py-1 px-2">
                🎉 {{ winner }}
            </span>
        </div>
    </div>
</template>