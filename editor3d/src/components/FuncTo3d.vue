<template>
    <div class="editor-container">
      <div class="three-canvas" ref="threeTarge"></div>
      <div id="sidebar">
        <input type="text" v-model="inputFunc" title="输入函数" placeholder="输入z=？">
        <button ref="loadNewSceneButton">生成新场景</button>
      </div>
    </div>
  </template>
  
  <script lang="ts" setup>
  import * as THREE from 'three';
  import { onMounted, ref } from 'vue';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // 引入 OrbitControls
  import * as math from 'mathjs';
  
  const threeTarge = ref<HTMLElement | null>(null);
  const inputFunc = ref('z = x + y'); // 默认输入
  const loadNewSceneButton = ref<HTMLButtonElement | null>(null); // 用 ref 获取按钮
  
  // 保存当前的图形对象
  let mesh: THREE.Mesh | null = null;
  let cubeEdges: THREE.LineSegments | null = null; // 用于存储立方体
  let xAxis: THREE.ArrowHelper | null = null;
  let yAxis: THREE.ArrowHelper | null = null;
  let zAxis: THREE.ArrowHelper | null = null;
  let xLabel: THREE.Sprite | null = null;
  let yLabel: THREE.Sprite | null = null;
  let zLabel: THREE.Sprite | null = null;
  
  onMounted(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
  
    // 设置白色背景
    scene.background = new THREE.Color(0xffffff);
  
    const width = threeTarge.value?.clientWidth || window.innerWidth;
    const height = threeTarge.value?.clientHeight || window.innerHeight;
  
    if (threeTarge.value) {
      renderer.setSize(width, height);
      threeTarge.value.appendChild(renderer.domElement);
    }
  
    // 修改摄像头位置，使Z轴指向上方
    camera.position.set(0, 5, 5); // 调整摄像头位置，保持Z轴向上
  
    // 创建 OrbitControls 控制器，设置控制器的目标为 (0, 0, 0)，使其围绕原点旋转
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0); // 设定旋转中心为 (0, 0, 0)
    controls.update();
  
    // 添加环境光和点光源
    const ambientLight = new THREE.AmbientLight(0x404040, 10); // 环境光
    scene.add(ambientLight);
  
    const pointLight = new THREE.PointLight(0xffffff, 1, 1000); // 点光源
    pointLight.position.set(10, 10, 10); // 设置光源位置
    scene.add(pointLight);
  
    // 生成立方体
    const geometry = new THREE.BoxGeometry(4, 4, 4);
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    cubeEdges = new THREE.LineSegments(edges, lineMaterial);
    scene.add(cubeEdges);
  
    // 设置坐标轴，箭头长度设置为与立方体一致
    const axisMaterial = new THREE.LineBasicMaterial({ color: 0x808080 });
    const arrowLength = 2;
    const headLength = 0.4;
    const headWidth = 0.2;
    
    xAxis = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), arrowLength, 0x808080, headLength, headWidth);
    yAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), arrowLength, 0x808080, headLength, headWidth);
    zAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), arrowLength, 0x808080, headLength, headWidth);
    
    scene.add(xAxis);
    scene.add(yAxis);
    scene.add(zAxis);
  
    // 在坐标轴上添加刻度
    const addTicks = (axis: THREE.ArrowHelper, axisDirection: THREE.Vector3, ticksCount: number, axisLength: number, color: number) => {
      const tickMaterial = new THREE.LineBasicMaterial({ color: color });
      for (let i = 1; i < ticksCount; i++) {
        const tickLength = axisLength * i / ticksCount;
        const start = axis.position.clone().add(axisDirection.clone().multiplyScalar(tickLength));
        const end = start.clone().add(axisDirection.clone().multiplyScalar(0.1)); // 刻度线长度
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const tick = new THREE.Line(geometry, tickMaterial);
        scene.add(tick);
      }
    };
  
    // 在X、Y、Z轴上添加刻度
    addTicks(xAxis, new THREE.Vector3(1, 0, 0), 5, arrowLength, 0x000000);
    addTicks(yAxis, new THREE.Vector3(0, 1, 0), 5, arrowLength, 0x000000);
    addTicks(zAxis, new THREE.Vector3(0, 0, 1), 5, arrowLength, 0x000000);
  
    // 创建2D文本标签
    const createLabel = (text: string, position: THREE.Vector3, color: number): THREE.Sprite => {
      const texture = new THREE.CanvasTexture(generateTextCanvas(text, color));
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(position);
      return sprite;
    };
  
    // 生成2D文字画布
    const generateTextCanvas = (text: string, color: number): HTMLCanvasElement => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        context.font = '30px Arial';
        const textWidth = context.measureText(text).width;
        canvas.width = textWidth + 10;
        canvas.height = 40;
        context.font = '30px Arial';
        context.fillStyle = `#${color.toString(16)}`;
        context.fillText(text, 5, 30);
      }
      return canvas;
    };
  
    // 添加X、Y、Z标签
    xLabel = createLabel('X', new THREE.Vector3(arrowLength + 0.5, 0, 0), 0x555555);
    yLabel = createLabel('Y', new THREE.Vector3(0, arrowLength + 0.5, 0), 0x555555);
    zLabel = createLabel('Z', new THREE.Vector3(0, 0, arrowLength + 0.5), 0x555555);
  
    scene.add(xLabel);
    scene.add(yLabel);
    scene.add(zLabel);
  
    // 创建网格平面
    const gridHelper = new THREE.GridHelper(4, 16);
    gridHelper.position.set(0, 0, 0); // 使网格平面与立方体面平行
    scene.add(gridHelper);
  
    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
  
    animate();
  
    // 生成平面函数
    const generateGraph = (func: string) => {
      if (mesh) {
        scene.remove(mesh);
      }
  
      const geometry = new THREE.PlaneGeometry(4, 4, 500, 500);
      const positions = geometry.attributes.position.array;
  
      const step = 0.1;
  
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
  
        try {
          const z = math.evaluate(func, { x, y });
  
          if (x >= -2 && x <= 2 && y >= -2 && y <= 2 && z >= -2 && z <= 2) {
            positions[i + 2] = z;
          } else {
            positions[i + 2] = NaN;
          }
        } catch (error) {
          console.error("Invalid function", error);
        }
      }
  
      const material = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    wireframe: false,
    roughness: 0.5,
    metalness: 0.3,
    side: THREE.DoubleSide // 设置双面渲染
  });
  
      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
    };
  
    const handleGenerateGraph = () => {
      const func = inputFunc.value;
      generateGraph(func);
    };
  
    if (loadNewSceneButton.value) {
      loadNewSceneButton.value.addEventListener('click', handleGenerateGraph);
    }
  });
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
    
    </style>
    