const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
const clients = new Set();

wss.on('connection', (ws) => {
    console.log('New client connected');
    clients.add(ws);

    ws.on('message', (message) => {
        console.log('Received from client:', message); // 调试打印
        for (const client of clients) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                const dataToSend = typeof message === 'string' ? message : JSON.stringify(message);
                client.send(dataToSend); // 确保发送的是字符串
            }
        }
    });
    

    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

console.log('WebSocket server is running on ws://localhost:8080');
