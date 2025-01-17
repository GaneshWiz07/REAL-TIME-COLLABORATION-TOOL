// server.mjs
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log('New client connected');

    // Handle text editing
    socket.on('edit', (content) => {
        io.emit('updateContent', content);
    });

    socket.on('bold', (bold) => {
        io.emit('updateStyleBold', bold);
    });

    socket.on('italic', (italic) => {
        io.emit('updateStyleItalic', italic);
    });

    socket.on('underline', (underline) => {
        io.emit('updateStyleUnderline', underline);
    });

    // Handle drawing actions
    socket.on('draw', (data) => {
        io.emit('draw', data); // Broadcast to all clients, including the sender
    });

    socket.on('undo', () => {
        io.emit('undo'); // Broadcast to all clients, including the sender
    });

    socket.on('redo', () => {
        io.emit('redo'); // Broadcast to all clients, including the sender
    });

    socket.on('eraseAll', () => {
        io.emit('eraseAll'); // Broadcast to all clients, including the sender
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));