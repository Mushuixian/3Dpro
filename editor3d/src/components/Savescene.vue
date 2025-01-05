<template>
  <div id="signalscene">
    <div ref="canvasContainer" class="canvas-container"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch, defineProps } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // 引入 OrbitControls

export default defineComponent({
  name: 'signalscene',
  props: {
    data: {
      type: Array as () => { 
        position: { x: number; y: number; z: number }; 
        color: string; 
        size: { x: number; y: number; z: number }; 
      }[], 
      required: true,
    },
  },
  setup(props) {
    const canvasContainer = ref<HTMLDivElement | null>(null);

    const initGallery = () => {
      if (!canvasContainer.value) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
      camera.position.set(500, 500, 500);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(300, 200);
      canvasContainer.value.appendChild(renderer.domElement);
      renderer.setClearColor(0xdddddd, 1);

      const cubes: THREE.Mesh[] = [];
      props.data.forEach((item) => {
        const geometry = new THREE.BoxGeometry(item.size.x, item.size.y, item.size.z);
        const material = new THREE.MeshLambertMaterial({ color: parseInt(item.color, 16) });
        const cube = new THREE.Mesh(geometry, material);

        cube.position.set(item.position.x, item.position.y - 200, item.position.z);
        scene.add(cube);
        cubes.push(cube);
      });

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      controls.screenSpacePanning = false;

      const ambientLight = new THREE.AmbientLight(0xffffff, 4);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 8);
      directionalLight.position.set(0, 1, 1).normalize();
      scene.add(directionalLight);

      const animate = () => {
        requestAnimationFrame(animate);

        scene.rotation.y += 0.01;

        controls.update();

        renderer.render(scene, camera);
      };

      animate();
    };

    onMounted(initGallery);
    watch(() => props.data, initGallery, { immediate: true });
    return {
      canvasContainer,
    };
  },
});
</script>




  
<style scoped>
#signalscene {
  position: relative;
  flex: 0 0 350px; /* 固定宽度为 250px，保持其子元素的宽度 */
  height: 300px;  /* 固定高度为 200px */
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1em 0.5em; /* 设置与其他 #signalscene 组件之间的间距 */
}
  
.canvas-container {
  display: inline-block;
  margin: 1em 0.5em; /* 水平间距调整为 0.5em */
  padding: 1em;
  box-shadow: 1px 2px 4px 0px rgba(0, 0, 0, 0.25);
}

  </style>     