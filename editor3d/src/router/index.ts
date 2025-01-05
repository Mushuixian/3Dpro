import { createRouter, createWebHistory } from "vue-router";

import Editor from '@/components/Editor.vue';
import Home from "@/components/Home.vue";
import Gallery from "@/components/Gallery.vue";
import FuncTo3d from "@/components/FuncTo3d.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: Home,
    },
    {
      path: '/editor',
      component: Editor,
    },
    {
      path: '/gallery',
      component: Gallery,
    },
    {
      path: '/functo3d',
      component: FuncTo3d,
    },
  ],
});

export default router;
