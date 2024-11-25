<template>
  <div id="app">
    <!-- 左侧导航栏 -->
    <div :class="['sidebar', { collapsed: isCollapsed }]">
      <div class="toggle-button" @click="toggleSidebar">
        <span v-if="!isCollapsed">收起</span>
        <span v-else>+</span> <!-- 只显示一个小的按钮，折叠后显示 "+" -->
      </div>
      <div class="nav-links">
        <a href="#">首页</a>
        <a href="#">编辑器</a>
        <a href="#">画廊</a>
      </div>
    </div>
    <!-- 内容区 -->
    <div class="content">
      <div class="three-canvas" ref="threeTarge"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import { TEngine } from './components/TEngine.vue';

export default defineComponent({
  setup() {
    const isCollapsed = ref(false);

    const toggleSidebar = () => {
      isCollapsed.value = !isCollapsed.value;
    };

    const threeTarge = ref(null);

    onMounted(() => {
    const TE = new TEngine(threeTarge.value!);
     window.addEventListener("resize", () => {
      TE.onWindowResize(); 
    });
  });


    return {
      isCollapsed,
      toggleSidebar,
      threeTarge,
    };
  },
});
</script>

<style>
/* 页面基础样式 */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden; /* 禁止页面出现滚动条 */
  font-family: Arial, sans-serif;
}

#app {
  display: flex;
  height: 100%;
  width: 100%;
  /* 确保左右布局填满页面 */
}

/* 左侧导航栏 */
.sidebar {
  width: 200px;
  background-color: #2c3e50;
  color: #ecf0f1;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: width 0.3s ease;
}

.sidebar.collapsed {
  width: 60px; /* 折叠时缩小 */
}

.toggle-button {
  background-color: #34495e;
  color: #ecf0f1;
  padding: 10px;
  text-align: center;
  cursor: pointer;
  font-size: 18px; /* 更大的按钮 */
  user-select: none;
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
}

.nav-links {
  display: flex;
  flex-direction: column;
  margin-top: 20px;
  transition: opacity 0.3s ease; /* 添加平滑过渡效果 */
}

.nav-links a {
  text-decoration: none;
  color: #ecf0f1;
  padding: 10px;
  margin: 5px 0;
  text-align: center;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.nav-links a:hover {
  background-color: #1abc9c;
  color: #ffffff;
}

/* 内容区样式 */
.content {
  flex: 1; /* 确保内容区占据剩余空间 */
  display: flex;
  position: relative;
  background-color: #ecf0f1;
  overflow: hidden;
  transition: margin-left 0.3s ease; /* 平滑过渡 */
  padding: 0; /* 去掉内边距 */
  margin: 0; /* 去掉外边距 */
  border: none; /* 去掉边框 */
}

/* Three.js 画布容器 */
.three-canvas {
  width: 100%; /* 占据父容器的全部宽度 */
  height: 100%; /* 占据父容器的全部高度 */
  position: relative;
  margin: 0; /* 去掉画布周围的间距 */
  padding: 0; /* 去掉画布内边距 */
  border: none; /* 去掉画布边框 */
}



/* 使折叠时导航项隐藏 */
.sidebar.collapsed .nav-links {
  opacity: 0; /* 隐藏导航链接 */
  pointer-events: none; /* 禁止点击 */
}

.sidebar.collapsed .toggle-button {
  background-color: #34495e;
}

/* 内容区在侧边栏折叠时扩展 */
.sidebar.collapsed ~ .content {
  margin-left: 60px; /* 侧边栏折叠时，内容区右移填补空间 */
}
</style>
