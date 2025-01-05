<template>
  <div class="signalscene-gallery">
    <signalscene v-for="(item, index) in galleryItems" :key="index" :data="item" />
  </div>
</template>


<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Signalscene from './Savescene.vue';
import { WebSocketManager } from './websocketmanager';

const galleryItems = ref<any[]>([]);

let webSocketManager: WebSocketManager;

onMounted(() => {
  webSocketManager = new WebSocketManager((message: any) => {
    const parsedMessage = message;

    if (parsedMessage.type === 'galleryItem') {
      galleryItems.value.push(parsedMessage.data);
    }

    if (parsedMessage.type === 'galleryDone') {
      console.log('All gallery items received.');
    }
  });

  webSocketManager.on('open', () => {
    console.log('WebSocket connected, sending getgallery request...');
    webSocketManager.sendMessage('getgallery', {});
  });
});

const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input?.files?.[0];

  if (file && file.type === 'application/json') {
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        const jsonData = JSON.parse(reader.result as string);
        webSocketManager.sendMessage('uploadGallery', jsonData);
        console.log('File uploaded successfully');
      } catch (e) {
        console.error('Invalid JSON file', e);
      }
    };

    reader.onerror = () => {
      console.error('Error reading the file');
    };

    reader.readAsText(file);
  } else {
    console.error('Please upload a valid JSON file');
  }
};
</script>


<style scoped>
/* 整体画廊容器 */
.signalscene-gallery {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 20px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-sizing: border-box;
}

/* 为每个 signalscene 设置大小 */
.signalscene-gallery signalscene {
  width: 300px;
  height: 200px;
  transition: transform 0.3s ease, box-shadow 0.3s ease; /* 加入平滑过渡效果 */
}

/* 为每个 signalscene 设置 hover 效果 */
.signalscene-gallery signalscene:hover {
  transform: scale(1.05); /* 放大效果 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* 加入阴影效果 */
}


/* 响应式布局，在较小屏幕上调整信号场景的大小 */
@media (max-width: 768px) {
  .signalscene-gallery signalscene {
    width: 100%; /* 屏幕较小，信号场景宽度改为100% */
    height: auto; /* 高度自动调整 */
  }
}

</style>

