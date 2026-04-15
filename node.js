const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const dataFile = path.join(__dirname, 'books.json');

const loadBooksFromFile = () => {
    try {
        if (fs.existsSync(dataFile)) {
            const raw = fs.readFileSync(dataFile, 'utf-8');
            return JSON.parse(raw) || [];
        }
    } catch (error) {
        console.error('Error reading books.json:', error);
    }
    return [];
};

const saveBooksToFile = (booksData) => {
    try {
        fs.writeFileSync(dataFile, JSON.stringify(booksData, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error writing books.json:', error);
    }
};

let activeUsers = {};
let books = loadBooksFromFile();

app.use(express.static(__dirname));

app.get('/api/books', (req, res) => {
    res.json(books);
});

io.on('connection', (socket) => {
    console.log(`✅ Usuario conectado: ${socket.id}`);
    socket.emit('initialBooks', books);

    socket.on('userJoined', (data) => {
        activeUsers[data.userID] = data;
        io.emit('activeUsers', activeUsers);
    });

    socket.on('addBook', (data) => {
        books.push(data.book);
        saveBooksToFile(books);
        socket.broadcast.emit('bookAdded', data);
    });

    socket.on('editBook', (data) => {
        const index = books.findIndex(b => b.id === data.book.id);
        if (index !== -1) {
            books[index] = { ...books[index], ...data.book };
            saveBooksToFile(books);
            socket.broadcast.emit('bookUpdated', data);
        }
    });

    socket.on('deleteBook', (data) => {
        books = books.filter(b => b.id !== data.id);
        saveBooksToFile(books);
        socket.broadcast.emit('bookDeleted', data);
    });

    socket.on('bulkAddBooks', (data) => {
        if (Array.isArray(data.books) && data.books.length > 0) {
            books = [...books, ...data.books];
            saveBooksToFile(books);
            socket.broadcast.emit('booksBulkAdded', data);
        }
    });

    socket.on('userLeft', (data) => {
        if (data && data.userID) {
            delete activeUsers[data.userID];
            io.emit('activeUsers', activeUsers);
        }
    });

    socket.on('disconnect', () => {
        console.log(`❌ Usuario desconectado: ${socket.id}`);
        delete activeUsers[socket.id];
        io.emit('activeUsers', activeUsers);
    });
});

server.listen(3000, () => {
    console.log('🚀 Servidor escuchando en puerto 3000');
});