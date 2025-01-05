import { AmbientLight, Box3, BoxGeometry, DirectionalLight, GridHelper, Material, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshStandardMaterial, ObjectLoader, PerspectiveCamera, PlaneGeometry, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from "three"
import { OrbitControls } from "three/examples/jsm/Addons.js"
import { WebSocketManager } from "@/components/websocketmanager";

export class TEngine {

    public webSocketManager: WebSocketManager;
    private roomId: string | null = null; 
    private roomIdText: HTMLElement;
    
    private dom:HTMLElement
    private renderer:WebGLRenderer

    private scene: Scene
    private camera:PerspectiveCamera
    private plane: Mesh
    private pointer: Vector2
    private raycaster: Raycaster
    private isShiftDown = false
    private isPickingColor = false;
    private isPainting = false; 

    private rollOverMesh: Mesh
    private rollOverMaterial: MeshBasicMaterial
    private cubeGeo: BoxGeometry
    private cubeMaterial: MeshLambertMaterial
    private selectedColor: string = "#000000";
    private cubeSize: number = 50;
    private rollOverGeo

    private object:Mesh[] = []

    private controls: OrbitControls;  
    is2DMode: any;

    private participantCount: number = 0;  // 存储当前的参与者人数


    constructor (dom: HTMLElement) {

        this.webSocketManager = new WebSocketManager((message) => {
            this.processMessage(message);
        });

        this.dom = dom
        this.renderer = new WebGLRenderer({ antialias: true })
        this.scene = new Scene()
        
        dom.appendChild(this.renderer.domElement)
        this.renderer.setSize(this.dom.offsetWidth, this.dom.offsetHeight);

        this.roomIdText = document.createElement('div');
        this.roomIdText.style.position = 'absolute';
        this.roomIdText.style.top = '10px';
        this.roomIdText.style.left = '10px';
        this.roomIdText.style.fontSize = '16px';
        this.roomIdText.style.color = '#000000';
        this.roomIdText.style.zIndex = '10';
        dom.appendChild(this.roomIdText);
        this.roomIdText.innerHTML = '未加入房间'

        //相机初始化
        this.camera = new PerspectiveCamera(45, this.dom.offsetWidth / this.dom.offsetHeight, 1, 10000)
        this.camera.position.set(500, 500, 1300)
        this.camera.lookAt(new Vector3(0, 0, 0))
        this.camera.up = new Vector3(0, 1, 0)

        //隐形方块
        this.rollOverGeo = new BoxGeometry(50, 50, 50)
        this.rollOverMaterial = new MeshBasicMaterial({ color: 0xff0000, opacity: 0.5, transparent: true })
        this.rollOverMesh = new Mesh(this.rollOverGeo, this.rollOverMaterial)
        this.scene.add(this.rollOverMesh)

        //方块
        this.cubeGeo = new BoxGeometry(50, 50, 50)
        this.cubeMaterial = new MeshLambertMaterial({color: 0x000000})

        //坐标系
        const gridHelper = new GridHelper(  1000, 20  );
        this.scene.add( gridHelper );

        //射线检测
        this.raycaster = new Raycaster()
        this.pointer = new Vector2()

        //场景地面
        const geometry = new PlaneGeometry(1000, 1000)
        geometry.rotateX(- Math.PI / 2)
        this.plane = new Mesh( geometry, new MeshBasicMaterial({ visible:false}))
        this.scene.add(this.plane)
        this.object.push(this.plane)

        // 环境光
        const ambientLight = new AmbientLight(0xffffff, 2); 
        this.scene.add(ambientLight);

        // 方向光
        const directionalLight = new DirectionalLight(0xffffff, 4); 
        directionalLight.position.set(10, 20, 10);
        this.scene.add(directionalLight);

        //控制器
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.addEventListener( 'change', () => this.render() );
        
        //渲染
        this.renderer.setClearColor(0xdddddd, 1);
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.clear()
        this.renderer.setSize(dom.offsetWidth, window.innerHeight); 
        this.renderer.render(this.scene, this.camera)

        //添加事件
        this.dom.addEventListener('pointermove', this.onPointerMove.bind(this));
        document.addEventListener('pointerdown', this.onPointerDown.bind(this));
        document.addEventListener('keydown', this.onDocumentKeyDown.bind(this));
        document.addEventListener('keyup', this.onDocumentKeyUp.bind(this));
        window.addEventListener('resize', this.onWindowResize.bind(this));

        //按钮监听
        const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
        colorPicker.addEventListener('input', this.onColorChange.bind(this));

         const modeSwitchButton = document.getElementById("modeSwitchButton") as HTMLButtonElement;
         modeSwitchButton.addEventListener('click', this.toggleMode2d.bind(this));

         const clearButton = document.getElementById("clearButton") as HTMLButtonElement;
         clearButton.addEventListener('click', this.clearScene.bind(this));

         const createButton = document.getElementById("createButton") as HTMLButtonElement;
         createButton.addEventListener('click', this.createRoom.bind(this));

         const exportSecneButton = document.getElementById("exportSceneButton") as HTMLButtonElement;
         exportSecneButton.addEventListener('click', this.exportScene.bind(this));

         const loadNewSceneButton = document.getElementById("loadNewSceneButton") as HTMLButtonElement;
         loadNewSceneButton.addEventListener('click', this.createFileInput.bind(this));

         const colorPickerButton = document.getElementById("colorPickerButton") as HTMLButtonElement;
         colorPickerButton.addEventListener("click", () => this.enableColorPicking());
         document.addEventListener("pointerdown", (event) => this.pickColor(event));


         const paintBucketButton = document.getElementById("paintBucketButton") as HTMLButtonElement;
         paintBucketButton.addEventListener("click", () => this.togglePaintBucket());         

         
         const joinButton = document.getElementById("joinButton") as HTMLButtonElement;
         joinButton.addEventListener('click', (event: MouseEvent) => {
             const roomIdInput = (document.getElementById("inputRoom") as HTMLInputElement).value;
             if (roomIdInput) {
                 this.joinRoom(roomIdInput);
             } else {
                 alert('请输入房间号');
             }
         });
         
    }  


    //立方体尺寸
    updateCubeSize(size: number) {
        this.cubeSize = size * 50;
        this.cubeGeo = new BoxGeometry(this.cubeSize, this.cubeSize, this.cubeSize);
        this.rollOverGeo = new BoxGeometry(this.cubeSize, this.cubeSize, this.cubeSize);
    
        this.rollOverMesh.geometry.dispose(); 
        this.rollOverMesh.geometry = this.rollOverGeo;
    
        console.log(size);
    }


    //颜色操作
    private enableColorPicking() {
        this.isPickingColor = true;
        this.updateButtonColor("colorPickerButton", "blue");
        console.log("颜色拾取模式已启用");
    }

    private deactivateColorPicking() {
        this.isPickingColor = false;
        this.updateButtonColor("colorPickerButton", "");
        console.log("颜色拾取模式模式已停用");
    }

    private pickColor(event: MouseEvent) {
        if (!this.isPickingColor) return;
    
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
    
        this.pointer.set(
            (mouseX / rect.width) * 2 - 1,
            -(mouseY / rect.height) * 2 + 1
        );
    
        this.raycaster.setFromCamera(this.pointer, this.camera);
    
        const intersects = this.raycaster.intersectObjects(this.scene.children, false);
    
        if (intersects.length > 0) {
            const intersect = intersects[0];
            const selectedObject = intersect.object as Mesh;
            const material = selectedObject.material as Material;
    
            if (material instanceof MeshLambertMaterial) {
                const color = material.color.getStyle(); 
                console.log("拾取到颜色:", color);
                this.updateColorPicker(color); 
                this.selectedColor = color;
                this.deactivateColorPicking()
            } else {
                console.log("拾取到的物体材质不是 MeshLambertMaterial:", material);
            }
        } else {
            this.deactivateColorPicking()
            console.log("未检测到任何交点");
        }
    }
    
    private updateColorPicker(color: string) {
        const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
        if (colorPicker) {
            colorPicker.value = this.convertColorToHex(color); 
        }
    }

    private convertColorToHex(color: string): string {
        const ctx = document.createElement("canvas").getContext("2d");
        if (!ctx) return "#ffffff"; 
        ctx.fillStyle = color;
        return ctx.fillStyle; 
    }
    
    private activatePaintBucket() {
        this.isPainting = true;
        this.isPickingColor = false; 
        this.updateButtonColor("paintBucketButton", "blue");
        console.log("油漆桶模式已激活");
    }

    private deactivatePaintBucket() {
        this.isPainting = false;
        this.updateButtonColor("paintBucketButton", "");
        console.log("油漆桶模式已停用");
    }

    private updateButtonColor(buttonId: string, color: string) {
        const button = document.getElementById(buttonId) as HTMLButtonElement;
        if (color) {
            button.style.backgroundColor = color;
        } else {
            button.style.backgroundColor = "";
        }
    }

    private paintObject(event: MouseEvent) {
        if (!this.isPainting) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        this.pointer.set(
            (mouseX / rect.width) * 2 - 1,
            -(mouseY / rect.height) * 2 + 1
        );

        this.raycaster.setFromCamera(this.pointer, this.camera);

        const intersects = this.raycaster.intersectObjects(this.scene.children, false);

        if (intersects.length > 0) {
            const intersect = intersects[0];
            const selectedObject = intersect.object as Mesh;
            const material = selectedObject.material as Material;

            if (material instanceof MeshLambertMaterial) {
                material.color.set(this.selectedColor); 
                console.log(`物体已涂色为: ${this.selectedColor}`);
                 // 检查 WebSocket 连接是否存在
            if (this.webSocketManager.ifconnecting()) {
                // 将位置和颜色打包为一个对象
                const data = {
                    position: {
                        x: selectedObject.position.x,
                        y: selectedObject.position.y,
                        z: selectedObject.position.z,
                    },
                    color: this.selectedColor,
                };
                this.webSocketManager.sendMessage('changeColor', data);
            }
                this.render();
            } else {
                console.log("选中的物体材质不是 MeshLambertMaterial:", material);
            }
        } else {
            this.deactivatePaintBucket()
            console.log("未检测到任何交点");
        }
    }

    changecolor(changedata: any) {
        try {
            // 如果数据已经是对象，则直接使用
            const data = typeof changedata === 'string' ? JSON.parse(changedata) : changedata;
            const { position, color } = data;
    
            if (!position || !color) {
                console.error("接收到的数据格式不正确：", data);
                return;
            }
    
            // 在场景中查找位置匹配的物体
            const object = this.scene.children.find(child => {
                const mesh = child as Mesh;
                return (
                    mesh.position.x === position.x &&
                    mesh.position.y === position.y &&
                    mesh.position.z === position.z
                );
            });
    
            if (object && object instanceof Mesh) {
                // 确保物体材质是 MeshLambertMaterial
                const material = object.material as Material;
                if (material instanceof MeshLambertMaterial) {
                    material.color.set(color); // 更新颜色
                    console.log(`物体颜色已更新为: ${color}`);
                    this.render(); // 渲染更新后的场景
                } else {
                    console.error("目标物体材质不是 MeshLambertMaterial：", material);
                }
            } else {
                console.error("未找到匹配位置的物体：", position);
            }
        } catch (error) {
            console.error("处理 WebSocket 数据时出错：", error, changedata);
        }
    }
    
    private togglePaintBucket() {
        if (this.isPainting) {
            this.deactivatePaintBucket();
        } else {
            this.activatePaintBucket();
        }
    }

    private onColorChange(event: Event) {
        const colorPicker = event.target as HTMLInputElement;
        this.selectedColor = colorPicker.value;
    }


    //处理websocket消息
    private processMessage(message: any) {
        console.log('Received message:', message);
    
        switch (message.type) {
            case 'createRoom':
                this.handleCreateRoom(message.data);
                break;
            case 'joined':
                this.handleJoinRoom(message.data);
                break;
            case 'addObject':
                this.addObjectFromRemote(message.data);
                break;
            case 'removeObject':
                this.removeObjectFromRemote(message.data);
                break;
            case 'newUserJoined':
                this.uploadScene();
                break;
            case 'uploadScene':
                this.loadScene(message.data);
                break;
            case 'clearScene':
                this.handleClearScene();
                break;
            case 'changeColor':
                this.changecolor(message.data);
                break;
            case 'participantCountUpdate':
                this.handleParticipantCountUpdate(message.data)
            default:
                console.log(`Unknown message type: ${message.type}`);
        }
    }


    //场景操作
    public exportSceneToJSON(): string {
        const sceneData = this.object
            .filter(obj => 
                obj instanceof Mesh && 
                obj.geometry instanceof BoxGeometry 
            )
            .map(obj => {
                const box = new Box3().setFromObject(obj); 
                const size = new Vector3();
                box.getSize(size);
    
                return {
                    position: {
                        x: obj.position.x,
                        y: obj.position.y,
                        z: obj.position.z
                    },
                    color: (obj.material as MeshLambertMaterial).color.getHexString(),
                    size: {
                        x: size.x,
                        y: size.y,
                        z: size.z
                    }
                };
            });
    
        return JSON.stringify(sceneData, null, 2);
    }

    private exportScene() {
        const jsonContent = this.exportSceneToJSON(); 
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'scene.json'; 
        document.body.appendChild(a); 
        a.click(); 
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    private uploadScene() {
    const sceneJSON = this.exportSceneToJSON();

    this.webSocketManager.sendMessage('uploadScene', sceneJSON);
    }

    public loadScene(sceneJSON: string) {
        this.handleClearScene();
        const sceneData = JSON.parse(sceneJSON);
    
        sceneData.forEach((data: { 
            position: { x: number, y: number, z: number }, 
            color: string, 
            size: { x: number, y: number, z: number }
        }) => {
            const { position, color, size } = data;
    
            const geometry = new BoxGeometry(size.x, size.y, size.z);
            const voxel = new Mesh(geometry, new MeshLambertMaterial({ color: `#${color}` }));
            
            voxel.position.set(position.x, position.y, position.z);
            this.scene.add(voxel);
            this.object.push(voxel);
        });
    
        this.render();
    }

    private loadNewSceneFromFile(event: Event) {
        this.handleClearScene();
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
    
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                try {
                    const sceneData = JSON.parse(e.target?.result as string);
    
                    sceneData.forEach((data: { 
                        position: { x: number, y: number, z: number }, 
                        color: string, 
                        size: { x: number, y: number, z: number }
                    }) => {
                        const { position, color, size } = data;
    
                        const geometry = new BoxGeometry(size.x, size.y, size.z);
                        const voxel = new Mesh(geometry, new MeshLambertMaterial({ color: `#${color}` }));
                        
                        voxel.position.set(position.x, position.y, position.z);
                        this.scene.add(voxel);
                        this.object.push(voxel);
                    });
                    if (this.webSocketManager.ifconnecting()) {
                        this.uploadScene()
                    }
                    this.render();
                } catch (error) {
                    console.error("Error parsing JSON:", error);
                }
            };
            reader.readAsText(file); 
        }
    }
    
    private createFileInput() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', this.loadNewSceneFromFile.bind(this));
    
        input.click();
    }

    handleClearScene(){
            for (let i = this.object.length - 1; i >= 0; i--) {
              const obj = this.object[i];
              if (obj !== this.plane) { 
                this.scene.remove(obj);
                this.object.splice(i, 1);
              }
            }
            this.render();
    }

    private clearScene() {
        const isConfirmed = window.confirm('您确定要清空场景吗？');
      
        if (isConfirmed) {
          for (let i = this.object.length - 1; i >= 0; i--) {
            const obj = this.object[i];
            if (obj !== this.plane) { 
              this.scene.remove(obj);
              this.object.splice(i, 1);
            }
          }
          if (this.webSocketManager.ifconnecting()) {
            this.webSocketManager.sendMessage('clearScene', {});
        }
          this.render();
        } else {
          console.log('清空操作已取消');
        }
    }


    //添加物体删除物体
    private addObjectFromRemote(data: { position: { x: number, y: number, z: number }, color: string, size: { x: number, y: number, z: number } }) {
        const { position, color, size } = data;
    
        const geometry = new BoxGeometry(size.x, size.y, size.z);
        const material = new MeshLambertMaterial({ color });
        const voxel = new Mesh(geometry, material);
    
        voxel.position.set(position.x, position.y, position.z);
    
        this.scene.add(voxel);
        this.object.push(voxel);
        this.render();
    }
    
    private removeObjectFromRemote(data: any) {
        const { position, size } = data;
    
        const objectToRemove = this.object.find((obj) => {

            const isPositionMatch =
                obj.position.x === position.x &&
                obj.position.y === position.y &&
                obj.position.z === position.z;
    
            const boundingBox = new Box3().setFromObject(obj);
            const objectSize = new Vector3();
            boundingBox.getSize(objectSize);
            const isSizeMatch =
                Math.abs(objectSize.x - size.x) < 1e-6 &&
                Math.abs(objectSize.y - size.y) < 1e-6 &&
                Math.abs(objectSize.z - size.z) < 1e-6;
    
            const isCube = obj.geometry instanceof BoxGeometry;
    
            return isPositionMatch && isSizeMatch && isCube;
        });
    
        if (objectToRemove) {
            this.scene.remove(objectToRemove);
            this.object.splice(this.object.indexOf(objectToRemove), 1);
    
            objectToRemove.geometry.dispose();
            if (objectToRemove.material instanceof Material) {
                objectToRemove.material.dispose();
            }
        }
    
        this.render();
    }
    

    //房间操作
    private updateRoomIdDisplay() {
        if (this.roomIdText) {
            const participantsText = this.roomId ? ` 当前房间人数：${this.participantCount}` : '';
            this.roomIdText.innerHTML = `当前房间号：${this.roomId || '未加入房间'}${participantsText}`;
        }
    } 

    private createRoom() {
        if (this.webSocketManager.ifconnecting()) {
            this.webSocketManager.sendMessage('createRoom', {});
    
            console.log('请求创建房间');
        }
    }

    private handleCreateRoom(data: any) {
        const { roomId, participantCount } = data;  // 假设服务器会返回参与者人数
        this.roomId = roomId;
        this.participantCount = participantCount;  // 设置参与者人数
        console.log(`房间已创建，房间号：${roomId}，当前房间人数：${participantCount}`);
    
        this.updateRoomIdDisplay();
        alert(`创建房间成功！房间ID：${roomId}`);
    }

    private joinRoom(roomId: string) {
        if (this.webSocketManager.ifconnecting()) {
            this.webSocketManager.sendMessage('joinRoom', { roomId });
            console.log(`正在尝试加入房间：${roomId}`);
        } else {
            console.error('无法加入房间，WebSocket 未连接');
        }
    }
    
    private handleJoinRoom(data: any) {
        const { roomId, participantCount } = data;  // 假设服务器会返回参与者人数
        this.roomId = roomId;
        this.participantCount = participantCount;  // 设置参与者人数
        console.log(`已加入房间，房间号：${roomId}，当前房间人数：${participantCount}`);
    
        this.updateRoomIdDisplay();
        alert(`加入房间成功！房间ID：${roomId}`);
    }

    private handleParticipantCountUpdate(data: any) {
        const { participantCount } = data;  // 更新参与者人数
        this.participantCount = participantCount;
    
        this.updateRoomIdDisplay();  // 更新显示的房间人数
    }

    //鼠标操作
    private onPointerMove(event: PointerEvent) {
        if (this.isPickingColor) {
            return;
        }

        if (this.isPainting) {
            return;
        }
    
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
    
        this.pointer.set(
            (mouseX / rect.width) * 2 - 1,
            -(mouseY / rect.height) * 2 + 1
        );
    
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.object, false);
    
        if (intersects.length > 0) {
            const intersect = intersects[0];
    
            if (intersect.face) {
                this.rollOverMesh.position
                    .copy(intersect.point)
                    .add(intersect.face.normal);
                this.rollOverMesh.position
                    .divideScalar(this.cubeSize)
                    .floor()
                    .multiplyScalar(this.cubeSize)
                    .addScalar(this.cubeSize / 2);
            }
    
            this.render();
        }
    }
    
    private onPointerDown(event: PointerEvent) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
    
        this.pointer.set(
            (mouseX / rect.width) * 2 - 1,
            -(mouseY / rect.height) * 2 + 1
        );
    
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.object, false);
    
        if (this.isPickingColor) {
            this.pickColor(event);
            return;
        }

        if (this.isPainting) {
            this.paintObject(event);
            return;
        }
    
        if (intersects.length > 0) {
            const intersect = intersects[0];
            if (intersect.object instanceof Mesh && intersect.face) {
                if (this.isShiftDown) {
                    const position = {
                        x: intersect.object.position.x,
                        y: intersect.object.position.y,
                        z: intersect.object.position.z,
                    };
                    const boundingBox = new Box3().setFromObject(intersect.object);
                    const size = new Vector3();
                    boundingBox.getSize(size);
    
                    this.webSocketManager.sendMessage('removeObject', { position, size });
                    this.removeObjectFromRemote({ position, size });
                } else {
                    const voxel = new Mesh(this.cubeGeo, new MeshLambertMaterial({ color: this.selectedColor }));
                    voxel.position.copy(intersect.point).add(intersect.face.normal);
                    voxel.position.divideScalar(this.cubeSize).floor().multiplyScalar(this.cubeSize).addScalar(this.cubeSize / 2);
    
                    const position = { x: voxel.position.x, y: voxel.position.y, z: voxel.position.z };
                    const color = this.selectedColor;
                    const size = { x: this.cubeSize, y: this.cubeSize, z: this.cubeSize };
    
                    this.webSocketManager.sendMessage('addObject', { position, color, size });
                    this.addObjectFromRemote({ position, color, size });
                }
            }
        }
    }


    //2d，3d模式切换
    private toggleMode2d() {
        const modeSwitchButton = document.getElementById("modeSwitchButton") as HTMLButtonElement;
        if (this.is2DMode) {
            this.is2DMode = false;
            this.camera.position.set(500, 500, 1300);
            this.camera.lookAt(new Vector3(0, 0, 0))
            this.controls.enabled = true;
            modeSwitchButton.textContent = "切换到2D模式";
            
        } else {
            this.is2DMode = true;
            this.camera.position.set(0, 1500, 0);
            this.camera.lookAt(new Vector3(0, 0, 0))
            this.controls.enabled = false;
            modeSwitchButton.textContent = "切换到3D模式";
        }
        this.render();
    }

      
    //键盘操作
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
    

    //渲染器设置
    public onWindowResize() {
        const width = this.dom.offsetWidth;
        const height = this.dom.offsetHeight;
    
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    
        this.renderer.setSize(width, height);
        this.render();
    }

    private render() {
            this.renderer.render( this.scene, this.camera );
    }
    
}