<script setup lang="ts">
import { onMounted } from 'vue';
import LuckyWheel from './components/LuckyWheel.vue'

declare interface Window {
  gapi: any;
}

onMounted(() => {
  window.gapi.load('client:auth2', () => {
    window.gapi.client.init({
      clientId: 'YOUR_CLIENT_ID',
      scope: 'https://www.googleapis.com/auth/spreadsheets'
    }).then(() => {
      // gapi ready
    });
  });
})
</script>

<template>
  <lucky-wheel />
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>