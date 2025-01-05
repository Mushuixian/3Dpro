<template>
  <div class="editor-container">
    <div class="three-canvas" ref="threeTarge"></div>
  </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { ref, onMounted } from 'vue';


const threeTarge = ref<HTMLDivElement | null>(null);

onMounted(() => {
  let camera: THREE.PerspectiveCamera;
  let scene: THREE.Scene;
  let renderer: THREE.WebGLRenderer;

  function init() {
    // 设置相机
    camera = new THREE.PerspectiveCamera(45, threeTarge.value!.clientWidth / threeTarge.value!.clientHeight, 1, 10000);
    camera.position.set(0, -200, 500);

    // 设置场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // 加载字体并生成文本
    const loader = new FontLoader();
    loader.load('fonts/Microsoft YaHei_Regular.json', function (font) {
      const color = new THREE.Color(0x006699);

      const matLite = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });

      const message = '支持多人协作的三维编辑器';

      const shapes = font.generateShapes(message, 40); // 字体大小调整为40
      const geometry = new THREE.ShapeGeometry(shapes);

      // 居中调整
      geometry.computeBoundingBox();
      const xMid = -0.5 * (geometry.boundingBox!.max.x - geometry.boundingBox!.min.x);
      geometry.translate(xMid, 0, 0);

      // 创建填充文本 Mesh
      const text = new THREE.Mesh(geometry, matLite);
      text.position.z = -150;
      scene.add(text);

      // 创建线框文本
      const strokeText = new THREE.Group();

      shapes.forEach((shape) => {
        // 绘制轮廓线条
        drawLine(shape.getPoints(), strokeText, xMid);

        // 绘制孔洞线条
        shape.holes.forEach((hole) => {
          drawLine(hole.getPoints(), strokeText, xMid);
        });
      });

      scene.add(strokeText);

      render();

      // 加载次标题文本
      const subColor = new THREE.Color(0x00cc66);

      // 次标题材质
      const matLiteSub = new THREE.MeshBasicMaterial({
        color: subColor,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });

      const subMessage = '<-点击左侧按钮开始吧!';
      const subShapes = font.generateShapes(subMessage, 20); // 字体大小调整为20
      const subGeometry = new THREE.ShapeGeometry(subShapes);

      // 次标题居中调整
      subGeometry.computeBoundingBox();
      const xMidSub = -0.5 * (subGeometry.boundingBox!.max.x - subGeometry.boundingBox!.min.x);
      subGeometry.translate(xMidSub, 0, 0);

      // 创建次标题文本 Mesh
      const subText = new THREE.Mesh(subGeometry, matLiteSub);
      subText.position.set(0, -50, -150); // 次标题放在主标题下方
      scene.add(subText);

      render();

    });

    // 设置渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(threeTarge.value!.clientWidth, threeTarge.value!.clientHeight);
    threeTarge.value!.appendChild(renderer.domElement);

   // 设置轨道控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableZoom = false; // 禁用缩放
    controls.enablePan = false; // 禁用平移

    // 限制角度
    controls.minPolarAngle = THREE.MathUtils.degToRad(30); // 最小俯仰角（30度）
    controls.maxPolarAngle = THREE.MathUtils.degToRad(120); // 最大俯仰角（120度）
    controls.minAzimuthAngle = THREE.MathUtils.degToRad(-60); // 最小水平旋转角度（-60度）
    controls.maxAzimuthAngle = THREE.MathUtils.degToRad(60); // 最大水平旋转角度（60度）

    controls.update();
    controls.addEventListener('change', render);


    // 窗口调整
    window.addEventListener('resize', onWindowResize);

    function onWindowResize() {
      camera.aspect = threeTarge.value!.clientWidth / threeTarge.value!.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(threeTarge.value!.clientWidth, threeTarge.value!.clientHeight);
      render();
    }
  }

  function drawLine(points: THREE.Vector2[], group: THREE.Group, xMid: number) {
    // 将点转换为三维空间的 Vector3
    const points3D = points.map((p) => new THREE.Vector3(p.x, p.y, 0));

    // 创建线条几何
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points3D);

    // 创建线条材质，增大线宽
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x006699,
      linewidth: 50000, // 线宽增大至5
    });

    // 创建线条对象
    const line = new THREE.Line(lineGeometry, lineMaterial);

    // 居中调整
    lineGeometry.translate(xMid, 0, 0);

    // 添加到组
    group.add(line);
  }

  function render() {
    renderer.render(scene, camera);
  }

  init();
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
</style>
