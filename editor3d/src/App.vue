<template>
  <div id="app">
    <!-- 页面背景 -->
    <div class="page-container">
      <!-- 内容卡片 -->
      <div class="content-card">
        <!-- 导航栏 -->
        <div class="sidebar">
          <div class="nav-title">功能导航</div>
          <div class="nav-links">
            <RouterLink to="/">首页</RouterLink>
            <RouterLink to="/editor">编辑器</RouterLink>
            <RouterLink to="/gallery">画廊</RouterLink>
            <RouterLink to="/functo3d">函数3D</RouterLink>
            <a href="#">关于</a>
          </div>
        </div>
        <!-- 画布区域 -->
        <div class="canvas-area">
            <RouterView v-slot="{ Component }">
              <component :is="Component" />
            </RouterView>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { RouterLink, RouterView } from "vue-router";
</script>


<style>
/* 页面背景样式 */
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  font-family: Arial, sans-serif;
  background: linear-gradient(135deg, #ecf0f1, #bdc3c7); /* 背景渐变 */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 页面主容器 */
.page-container {
  width: 100%; /* 调整为浏览器全宽 */
  height: 100%; /* 调整为浏览器全高 */
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto; /* 启用滚动 */
  position: relative;
}

/* 内容卡片样式 */
.content-card {
  display: flex;
  width: 90%; /* 占用宽度更多 */
  height: 90%; /* 高度占浏览器窗口更多 */
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); /* 阴影效果 */
  border-radius: 12px;
  overflow: hidden;
}

/* 导航栏 */
.sidebar {
  flex: 0.2; /* 缩小导航栏比例，占20%宽度 */
  background: #2c3e50;
  color: #ecf0f1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-sizing: border-box;
}

.nav-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
  text-align: center;
}

.nav-links {
  display: flex;
  flex-direction: column;
}

.nav-links a {
  text-decoration: none;
  color: #ecf0f1;
  padding: 10px 15px;
  margin-bottom: 10px;
  border-radius: 6px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.nav-links a:hover {
  background: #1abc9c;
  color: #ffffff;
}

/* 画布区域 */
.canvas-area {
  flex: 0.8; /* 扩大画布区域比例，占80%宽度 */
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ecf0f1;
  padding: 20px;
  box-sizing: border-box;
}

.three-canvas {
  width: 100%;
  height: 100%;
  background: #bdc3c7;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2); /* 添加画布阴影 */
}

      /* 让 #app 占满整个页面 */
      #app {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center; /* 可选：内容水平居中 */
        align-items: center;    /* 可选：内容垂直居中 */
        background-color: #ffffff; /* 背景白色 */
      }
      
</style>
