<template>
  <div class="editor-container">
    <div class="three-canvas" ref="threeTarge"></div>
    <div id="sidebar">
      <button id="modeSwitchButton">切换到2D模式</button>
      <input type="color" id="colorPicker" title="选择颜色"/>
      <button id="paintBucketButton">油漆桶</button>
      <button id="colorPickerButton">颜色拾取器</button>
      <button id="clearButton">清空所有立方体</button>

      <!-- 房间操作-->
      <div class="room-section">
        <button id="roomButton" @click="toggleRoomOptions">房间操作</button>
        <div v-show="showRoomOptions" class="room-options">
          <button id="createButton">创建房间</button>
          <input type="text" id="inputRoom" title="输入房间号" placeholder="输入房间号">
          <button id="joinButton">加入房间</button>
        </div>
      </div>

      <!-- 场景操作 -->
      <div class="scene-section">
        <button id="sceneButton" @click="toggleSceneOptions">场景操作</button>
        <div v-show="showSceneOptions" class="scene-options">
          <button id="exportSceneButton">导出场景</button>
          <button id="loadNewSceneButton">导入场景</button>
        </div>
      </div>

      <!-- 立方体尺寸 -->
      <div class="cube-size-section">
        <button id="cubeSizeButton" @click="toggleCubeSizeOptions">
          选择尺寸 (当前: {{ selectedSize }})
        </button>
        <div v-show="showCubeSizeOptions" class="cube-size-options">
          <button
            v-for="size in cubeSizes"
            :key="size"
            @click="selectCubeSize(size)"
          >
            {{ size }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>


<script lang="ts" setup name="Editor">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { TEngine } from '@/assets/Eigen';

const threeTarge = ref(null);

const showRoomOptions = ref(false);
const showSceneOptions = ref(false);
const showCubeSizeOptions = ref(false);

const cubeSizes = [0.25, 0.5, 1, 2];
const selectedSize = ref(1);

const toggleRoomOptions = () => {
  showRoomOptions.value = !showRoomOptions.value;
};

const toggleSceneOptions = () => {
  showSceneOptions.value = !showSceneOptions.value;
};

const toggleCubeSizeOptions = () => {
  showCubeSizeOptions.value = !showCubeSizeOptions.value;
};

const selectCubeSize = (size: number) => {
  selectedSize.value = size;
  showCubeSizeOptions.value = false;
  console.log("选中了立方体尺寸：", size);
  if (TE) {
    TE.updateCubeSize(selectedSize.value);
  }
};

  const handleGlobalClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;

  const isRoomButton = target.closest('#roomButton') || target.closest('.room-options');
  const isSceneButton = target.closest('#sceneButton') || target.closest('.scene-options');
  const isCubeSizeButton = target.closest('#cubeSizeButton') || target.closest('.cube-size-options');

  if (!isRoomButton) showRoomOptions.value = false;
  if (!isSceneButton) showSceneOptions.value = false;
  if (!isCubeSizeButton) showCubeSizeOptions.value = false;
};

let TE: TEngine | null = null;

onMounted(() => {
  if (threeTarge.value) {
    TE = new TEngine(threeTarge.value); // 初始化 TEngine
    console.log('Three canvas ref:', threeTarge.value);
    loadDraft();
  }
  document.addEventListener('click', handleGlobalClick);

  // 添加刷新/关闭页面前的事件监听
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onBeforeUnmount(() => {
  if (TE) {
    saveDraft();
    TE.webSocketManager.closeConnection()
    TE = null;
  }
  document.removeEventListener('click', handleGlobalClick);

  // 移除刷新/关闭页面前的事件监听
  window.removeEventListener('beforeunload', handleBeforeUnload);
});

// 保存草稿
const saveDraft = () => {
  if (TE) {
    const draft = TE.exportSceneToJSON();
    localStorage.setItem('editorDraft', JSON.stringify(draft));
    console.log('草稿已保存');
  }
};

// 加载草稿
const loadDraft = () => {
  const draft = localStorage.getItem('editorDraft');
  if (draft && TE) {
    TE.loadScene(JSON.parse(draft));
    console.log('草稿已加载');
  }
};

// 处理刷新/关闭事件
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  saveDraft();

};


</script>

<style scoped>
/* 整体容器样式 */
.editor-container {
  display: flex;
  justify-content: flex-start; /* 保证内容在水平方向左对齐 */
  width: 100%;
  height: 100%;
}

/* 画布区域样式 */
.three-canvas {
  flex: 1; 
  background-color: #bdc3c7;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

/* 按钮容器样式 */
#sidebar {
  display: flex;
  flex-direction: column; /* 垂直排列按钮 */
  justify-content: space-around; /* 平均排列按钮 */
  padding: 20px;
  width: 100px; /* 限制按钮容器的宽度 */
  background-color: #a4b1be; /* 背景颜色 */
  color: white;
  border-radius: 8px;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
}

/* 按钮样式 */
#sidebar button,
#sidebar input {
  background-color: #34495e;
  color: white;
  border: none;
  padding: 12px 18px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

#sidebar button:hover,
#sidebar input:hover {
  background-color: #1abc9c;
}

/* 输入框样式 */
#sidebar input[type="color"] {
  padding: 0; /* 移除默认的输入框间距 */
  height: 40px;
  width: auto; /* 保持自动宽度 */
}

/* 房间选项和场景选项展开样式 */
/* 房间选项和场景选项展开样式 */
.room-options,
.scene-options {
  position: absolute;
  right: 100%; /* 将内容向左对齐展开 */
  top: 0;
  background-color: #2c3e50;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 100;
  display: flex;
  flex-direction: row; /* 垂直排列按钮 */
  gap: 10px; /* 使用 gap 让按钮之间有固定间隔 */
}

.room-options button,
.scene-options button {
  background-color: #34495e;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.room-options button:hover,
.scene-options button:hover {
  background-color: #1abc9c;
}


/* 房间和场景容器定位样式 */
.room-section,
.scene-section {
  position: relative;
}

/* 立方体尺寸选择按钮样式 */
.cube-size-section {
  position: relative;
}

.cube-size-options {
  display: flex;
  flex-direction: row; /* 水平排列 */
  justify-content: flex-end; /* 向左对齐排列 */
  position: absolute; /* 绝对定位 */
  right: 100%; /* 向左展开 */
  top: 0; /* 与主按钮顶部对齐 */
  background-color: #2c3e50;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 100;
}

.cube-size-options button {
  background-color: #34495e;
  color: white;
  border: none;
  padding: 10px;
  margin: 0 5px; /* 水平方向间距 */
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.cube-size-options button:hover {
  background-color: #1abc9c;
}
</style>
