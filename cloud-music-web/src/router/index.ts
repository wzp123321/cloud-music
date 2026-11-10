import { createRouter, createWebHistory } from 'vue-router';
import routes from './modules';

export default createRouter({
  history: createWebHistory(),
  routes,
});
