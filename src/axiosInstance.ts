// axiosInstance.js
import axios from 'axios';
import { ref } from 'vue';

export const loading = ref(false); // Biến reactive theo dõi loading

const api = axios.create({
  baseURL: 'https://api.example.com', // đổi sang base URL của bạn
  timeout: 10000,
});

// Bắt đầu request → bật loading
api.interceptors.request.use(
  (config) => {
    loading.value = true;
    return config;
  },
  (error) => {
    loading.value = false;
    return Promise.reject(error);
  }
);

// Hoàn tất request → tắt loading
api.interceptors.response.use(
  (response) => {
    loading.value = false;
    return response;
  },
  (error) => {
    loading.value = false;
    return Promise.reject(error);
  }
);

export default api;
