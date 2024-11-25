<template>

</template>

<script lang="ts">

import { AmbientLight, BoxGeometry, DirectionalLight, GridHelper, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from "three"
import { OrbitControls } from "three/examples/jsm/Addons.js"
import { color } from "three/webgpu"

export class TEngine {

    private dom:HTMLElement
    private renderer:WebGLRenderer

    private scene: Scene
    private camera:PerspectiveCamera
    private plane: Mesh
    private pointer: Vector2
    private raycaster: Raycaster
    private isShiftDown = false

    private rollOverMesh: Mesh
    private rollOverMaterial: MeshBasicMaterial
    private cubeGeo: BoxGeometry
    private cubeMaterial: MeshLambertMaterial
    private selectedColor: string = "#000000";

    private object:Mesh[] = []

    private controls: OrbitControls;  // 用于切换模式控制的OrbitControls
    private is2DMode: boolean = false;  // 标记当前模式，默认为3D模式

    private ws: WebSocket | null = null;



    constructor (dom: HTMLElement) {

        this.initWebSocket();

        this.dom = dom
        this.renderer = new WebGLRenderer({ antialias: true })
        this.scene = new Scene()
        this.camera = new PerspectiveCamera(45, dom.offsetWidth / dom.offsetHeight, 1, 10000)

        this.camera.position.set(500, 500, 1300)
        this.camera.lookAt(new Vector3(0, 0, 0))
        this.camera.up = new Vector3(0, 1, 0)

        console.log(dom)
        dom.appendChild(this.renderer.domElement)
        this.renderer.setSize(dom.offsetWidth, dom.offsetHeight, true)

        const rollOverGeo = new BoxGeometry(50, 50, 50)
        this.rollOverMaterial = new MeshBasicMaterial({ color: 0xff0000, opacity: 0.5, transparent: true })
        this.rollOverMesh = new Mesh(rollOverGeo, this.rollOverMaterial)
        this.scene.add(this.rollOverMesh)

        this.cubeGeo = new BoxGeometry(50, 50, 50)
        this.cubeMaterial = new MeshLambertMaterial({color: 0x000000})

        const gridHelper = new GridHelper(  1000, 20  );
        this.scene.add( gridHelper );

        this.raycaster = new Raycaster()
        this.pointer = new Vector2()

        const geometry = new PlaneGeometry(1000, 1000)
        geometry.rotateX(- Math.PI / 2)

        this.plane = new Mesh( geometry, new MeshBasicMaterial({ visible:false}))
        this.scene.add(this.plane)

        this.object.push(this.plane)

        // 环境光：增强强度，接近真实颜色
        const ambientLight = new AmbientLight(0xffffff, 3); // 强环境光
        this.scene.add(ambientLight);

        // 方向光：弱化对颜色的影响
        const directionalLight = new DirectionalLight(0xffffff, 0.5); // 较低强度
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);

        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.addEventListener( 'change', () => this.render() );
        

        this.renderer.setClearColor('rgb(255, 255, 255)')
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.clear()
        this.renderer.setSize(dom.offsetWidth, window.innerHeight); // 画布高度适配
        this.renderer.render(this.scene, this.camera)

        this.dom.addEventListener('pointermove', this.onPointerMove.bind(this));
        document.addEventListener('pointerdown', this.onPointerDown.bind(this));
        document.addEventListener('keydown', this.onDocumentKeyDown.bind(this));
        document.addEventListener('keyup', this.onDocumentKeyUp.bind(this));
        window.addEventListener('resize', this.onWindowResize.bind(this));

        const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
        colorPicker.addEventListener('input', this.onColorChange.bind(this));

         // 监听模式切换按钮
         const modeSwitchButton = document.getElementById("modeSwitchButton") as HTMLButtonElement;
         modeSwitchButton.addEventListener('click', this.toggleMode.bind(this));

         const clearButton = document.getElementById("clearButton") as HTMLButtonElement;
         clearButton.addEventListener('click', this.clearScene.bind(this));
    }

    private initWebSocket() {
        this.ws = new WebSocket('ws://localhost:8080');
    
        this.ws.onopen = () => {
            console.log('Connected to WebSocket server');
        };
    
        this.ws.onmessage = (event) => {
            this.handleIncomingMessage(event);
        };
    
        this.ws.onclose = () => {
            console.log('Disconnected from WebSocket server');
        };
    
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    private async handleIncomingMessage(event: MessageEvent) {
        let messageData: any;
    
        try {
            if (typeof event.data === 'string') {
                messageData = JSON.parse(event.data);
            } else if (event.data instanceof Blob) {
                const text = await event.data.text();
                messageData = JSON.parse(text);
            } else {
                console.error('Unexpected message type:', event.data);
                return;
            }
    
            this.processMessage(messageData);
        } catch (error) {
            console.error('Failed to process WebSocket message:', error);
        }
    }
    

    private processMessage(message: any) {
        if (message.type === 'addObject') {
            this.addObjectFromRemote(message.data);
        } else if (message.type === 'removeObject') {
            this.removeObjectFromRemote(message.data);
        }
    }

    private sendMessage(type: string, data: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, data }));
        }
    }

    private addObjectFromRemote(data: any) {
        const { position, color } = data;

        const voxel = new Mesh(this.cubeGeo, new MeshLambertMaterial({ color }));
        voxel.position.set(position.x, position.y, position.z);
        this.scene.add(voxel);
        this.object.push(voxel);

        this.render();
    }

    private removeObjectFromRemote(data: any) {
        const { position } = data;

        const objectToRemove = this.object.find(
            (obj) =>
                obj.position.x === position.x &&
                obj.position.y === position.y &&
                obj.position.z === position.z
        );

        if (objectToRemove) {
            this.scene.remove(objectToRemove);
            this.object.splice(this.object.indexOf(objectToRemove), 1);
        }

        this.render();
    }


    private onPointerMove(event: PointerEvent) {
        this.pointer.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );

				this.raycaster.setFromCamera( this.pointer, this.camera );

				const intersects = this.raycaster.intersectObjects( this.object, false );

				if ( intersects.length > 0 ) {

					const intersect = intersects[ 0 ];

                    if (intersect.face) {
                        this.rollOverMesh.position.copy(intersect.point).add(intersect.face.normal);
                        this.rollOverMesh.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
                    }
                    
					this.render();

				}
    }

    private toggleMode() {
        const modeSwitchButton = document.getElementById("modeSwitchButton") as HTMLButtonElement;
        if (this.is2DMode) {
            // 切换到3D模式
            this.is2DMode = false;
            this.camera.position.set(500, 500, 1300);  // 重置摄像头位置
            this.camera.lookAt(new Vector3(0, 0, 0))
            this.controls.enabled = true;  // 启用OrbitControls
            modeSwitchButton.textContent = "切换到2D模式";
            
        } else {
            // 切换到2D模式
            this.is2DMode = true;
            this.camera.position.set(0, 1500, 0);  // 摄像头位置
            this.camera.lookAt(new Vector3(0, 0, 0))
            this.controls.enabled = false;  // 禁用OrbitControls
            modeSwitchButton.textContent = "切换到3D模式";
        }
        this.render();  // 切换模式后重新渲染
    }

    private clearScene() {
        // 移除所有非平面对象（立方体）
        for (let i = this.object.length - 1; i >= 0; i--) {
            const obj = this.object[i];
            if (obj !== this.plane) {  // 不删除平面
                this.scene.remove(obj);
                this.object.splice(i, 1);
            }
        }

        this.render();
    }

    private onPointerDown(event: PointerEvent) {
        this.pointer.set(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
    
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.object as Mesh[], false);
    
        if (intersects.length > 0) {
            const intersect = intersects[0];
            if (intersect.object instanceof Mesh && intersect.face) {
                if (this.isShiftDown) {
                    const position = intersect.object.position;
                    this.sendMessage('removeObject', { position });
                    this.removeObjectFromRemote({ position });
                } else {
                    const voxel = new Mesh(this.cubeGeo, new MeshLambertMaterial({ color: this.selectedColor }));
                    voxel.position.copy(intersect.point).add(intersect.face.normal);
                    voxel.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
    
                    const position = { x: voxel.position.x, y: voxel.position.y, z: voxel.position.z };
                    const color = this.selectedColor;
    
                    this.sendMessage('addObject', { position, color });
                    this.addObjectFromRemote({ position, color });
                }
            }
        }
    }
    
    
    private onDocumentKeyDown(event: KeyboardEvent) {
        switch ( event.keyCode ) {

            case 16: this.isShiftDown = true; break;

        }
    }
    
    private onDocumentKeyUp(event: KeyboardEvent) {
        switch ( event.keyCode ) {

            case 16: this.isShiftDown = false; break;

        }
    }
    
    onWindowResize() {
        const width = this.dom.offsetWidth;
        const height = this.dom.offsetHeight;
    
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    
        this.renderer.setSize(width, height);
        this.render();
    }
    

    private onColorChange(event: Event) {
        const colorPicker = event.target as HTMLInputElement;
        this.selectedColor = colorPicker.value; // 获取用户选择的颜色
    }

    private render() {
            this.renderer.render( this.scene, this.camera );
    }
    
}

</script>

<style>

</style>