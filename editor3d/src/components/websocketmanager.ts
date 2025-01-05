export class WebSocketManager {
        private ws: WebSocket | null = null;
        private messageHandler: (message: any) => void;
        private eventListeners: { [event: string]: Function[] } = {};
    
        constructor(messageHandler: (message: any) => void) {
            this.messageHandler = messageHandler;
            this.initWebSocket();
        }

        public ifconnecting() {
            if(this.ws)
            return true;
        }
    
        // 监听 WebSocket 事件
        public on(event: string, callback: Function) {
            if (!this.eventListeners[event]) {
                this.eventListeners[event] = [];
            }
            this.eventListeners[event].push(callback);
        }
    
        private emit(event: string, ...args: any[]) {
            if (this.eventListeners[event]) {
                this.eventListeners[event].forEach((callback) => callback(...args));
            }
        }
    
        private initWebSocket() {
            const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
            const host = window.location.hostname;
            const port = '8080'; // 如果上线时端口不同，可以调整
            this.ws = new WebSocket(`${protocol}${host}:${port}`);
    
            this.ws.onopen = () => {
                console.log('Connected to WebSocket server');
                // 触发 'open' 事件
                this.emit('open');
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
                this.messageHandler(messageData);
            } catch (error) {
                console.error('Failed to process WebSocket message:', error);
            }
        }
    
        // 发送消息
        public sendMessage(type: string, data: any) {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type, data }));
            } else {
                console.log('WebSocket is not open');
            }
        }
    
        public closeConnection() {
            if (this.ws) {
                this.ws.close();
            }
        }
    }