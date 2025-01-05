const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const rooms = {};

function generateRoomId() {
    return 'room_' + Math.random().toString(36).substr(2, 9);
}

function broadcastRoomParticipants(roomId) {
    const participantCount = rooms[roomId].participantCount;
    const message = JSON.stringify({
        type: 'participantCountUpdate',
        data: { roomId, participantCount }
    });

    rooms[roomId].clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message.toString());
            console.log('Received from client:', parsedMessage);

            if (parsedMessage.type === 'createRoom') {
                const roomId = generateRoomId();
                rooms[roomId] = {
                    clients: new Set(),
                    owner: ws,
                    sceneData: null,
                    participantCount: 0
                };
                rooms[roomId].clients.add(ws);
                rooms[roomId].participantCount++;
                ws.roomId = roomId;

                ws.send(JSON.stringify({ type: 'createRoom', data: { roomId } }));
                console.log(`Room created with ID: ${roomId}`);

                broadcastRoomParticipants(roomId);

            } else if (parsedMessage.type === 'joinRoom') {
                const roomId = parsedMessage.data.roomId;
                if (!rooms[roomId]) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Room does not exist' }));
                    return;
                }

                rooms[roomId].clients.add(ws);
                rooms[roomId].participantCount++;
                ws.roomId = roomId;

                ws.send(JSON.stringify({ type: 'joined', data: { roomId } }));
                console.log(`Client joined room ${roomId}`);

                broadcastRoomParticipants(roomId);

                const owner = rooms[roomId].owner;
                if (owner && owner.readyState === WebSocket.OPEN) {
                    owner.send(JSON.stringify({ type: 'newUserJoined', message: 'A new user has joined the room' }));
                }

            } else if (parsedMessage.type === 'getgallery') {
                const fs = require('fs');
                const path = require('path');
                const galleryDir = path.join(__dirname, 'galleryscene');

                fs.readdir(galleryDir, (err, files) => {
                    if (err) {
                        console.error('Error reading gallery directory:', err);
                        return;
                    }

                    const jsonFiles = files.filter(file => file.endsWith('.json'));
                    if (jsonFiles.length === 0) {
                        ws.send(JSON.stringify({
                            type: 'galleryDone',
                            message: 'No gallery items found'
                        }));
                        return;
                    }

                    let remainingFiles = jsonFiles.length;
                    jsonFiles.forEach(file => {
                        const filePath = path.join(galleryDir, file);
                        fs.readFile(filePath, 'utf8', (err, data) => {
                            if (err) {
                                console.error('Error reading file:', err);
                                return;
                            }

                            const jsonData = JSON.parse(data);
                            ws.send(JSON.stringify({
                                type: 'galleryItem',
                                data: jsonData
                            }));

                            remainingFiles--;
                            if (remainingFiles === 0) {
                                ws.send(JSON.stringify({
                                    type: 'galleryDone',
                                    message: 'All gallery items sent'
                                }));
                            }
                        });
                    });
                });
            } else {
                const roomId = ws.roomId;
                if (roomId && rooms[roomId]) {
                    for (const client of rooms[roomId].clients) {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(parsedMessage));
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to parse message:', error);
        }
    });

    ws.on('close', () => {
        if (ws.roomId && rooms[ws.roomId]) {
            rooms[ws.roomId].clients.delete(ws);
            rooms[ws.roomId].participantCount--;

            if (rooms[ws.roomId].clients.size === 0) {
                delete rooms[ws.roomId];
            } else {
                broadcastRoomParticipants(ws.roomId);
            }
        }
        console.log('Client disconnected');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

console.log('WebSocket server is running on ws://localhost:8080');
