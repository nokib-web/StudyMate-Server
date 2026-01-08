const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { Server } = require("socket.io");
const { connectDB, getCollection } = require('./config/db');
require('./config/firebase'); // Init Firebase

const userRoutes = require('./routes/userRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const groupRoutes = require('./routes/groupRoutes');
const messageRoutes = require('./routes/messageRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const studySessionRoutes = require('./routes/studySessionRoutes');
const { ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['https://studymate-b37fa.web.app', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.send('StudyMate Server Running');
});

// Health check / Keep-alive route
app.get('/ping', (req, res) => {
    res.send({ status: 'active', timestamp: new Date() });
});

// Self-ping to stay awake (Render free tier workaround)
// Note: This only works while the server is already awake. 
// Use an external service like Cron-job.org for full reliability.
setInterval(() => {
    const url = process.env.SERVER_URL || `http://localhost:${port}`;
    if (url.includes('render.com')) {
        http.get(`${url}/ping`, (res) => {
            console.log(`Self-ping status: ${res.statusCode}`);
        }).on('error', (err) => {
            console.error('Self-ping failed:', err.message);
        });
    }
}, 600000); // Every 10 minutes

app.use(require('./middleware/errorMiddleware')); // Ensure this is last usually? No wait, logic error in previous turn.
// Note: Error middleware should be LAST. I will fix that placement if possible, or just place routes before it.
// The previous turn added error middleware at the bottom.
// I will place routes here.

app.use('/users', userRoutes);
app.use('/partners', partnerRoutes);
app.use('/connections', connectionRoutes);
app.use('/groups', groupRoutes);
app.use('/messages', messageRoutes);
app.use('/upload', uploadRoutes);
app.use('/sessions', studySessionRoutes);
app.use('/reviews', require('./routes/reviewRoutes'));
app.use('/blogs', require('./routes/blogRoutes'));
app.use('/dashboard', require('./routes/dashboardRoutes'));
app.use('/stories', require('./routes/storyRoutes'));

// Server & Socket
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['https://studymate-b37fa.web.app', 'http://localhost:5173', 'http://localhost:5174'],
        methods: ["GET", "POST"]
    }
});

// Make io available in routes
app.set('io', io);

// Socket Logic
io.on("connection", (socket) => {
    console.log("User Connected", socket.id);

    // Register User
    socket.on("register", (email) => {
        if (email) {
            socket.join(email);
            console.log(`User registered with email: ${email}`);
        }
    });

    // Partner Request
    socket.on("send_partner_request", (data) => {
        if (data.receiverEmail) {
            io.to(data.receiverEmail).emit("receive_partner_request", data);
        }
    });

    // Join Room
    socket.on("join_room", (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
    });

    // --- Video Call Signaling ---
    socket.on("outgoing_call", (data) => {
        // data: { toEmail, fromEmail, signalData/peerId }
        // Verify if user is online? We emit to their email room
        io.to(data.toEmail).emit("incoming_call", {
            fromEmail: data.fromEmail,
            ...data
        });
    });

    socket.on("accept_call", (data) => {
        // data: { toEmail, peerId }
        io.to(data.toEmail).emit("call_accepted", data);
    });

    socket.on("reject_call", (data) => {
        // data: { toEmail }
        io.to(data.toEmail).emit("call_rejected", data);
    });

    socket.on("end_call", (data) => {
        // data: { toEmail }
        io.to(data.toEmail).emit("call_ended", data);
    });
    // ---------------------------

    // Send Message
    socket.on("send_message", async (data) => {
        try {
            const messagesCollection = getCollection("messages");
            const groupsCollection = getCollection("groups");

            const messageDoc = {
                room: data.room,
                author: data.author,
                message: data.message,
                attachment: data.attachment, // { url, type, public_id }
                time: data.time,
                createdAt: new Date()
            };

            const result = await messagesCollection.insertOne(messageDoc);
            messageDoc._id = result.insertedId;

            // Notify members
            const group = await groupsCollection.findOne({ _id: new ObjectId(data.room) });

            if (group && group.members) {
                group.members.forEach(memberEmail => {
                    if (memberEmail !== data.author) {
                        io.to(memberEmail).emit("receive_message", messageDoc);
                    }
                });
            } else {
                socket.to(data.room).emit("receive_message", messageDoc);
            }

        } catch (err) {
            console.error("Error saving message:", err);
        }
    });

    // Mark Read
    socket.on("mark_read", (data) => {
        socket.to(data.room).emit("user_read_messages", { room: data.room, email: data.email });
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id);
    });
});

// Start Server
const startServer = async () => {
    await connectDB();
    server.listen(port, () => {
        console.log(`StudyMate server listening on port ${port}`);

        // Keep-alive mechanism for Render Free Tier
        const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
        if (RENDER_EXTERNAL_URL) {
            setInterval(() => {
                http.get(RENDER_EXTERNAL_URL, (res) => {
                    console.log(`Keep-alive ping sent to ${RENDER_EXTERNAL_URL}: ${res.statusCode}`);
                }).on('error', (err) => {
                    console.error('Keep-alive ping error:', err.message);
                });
            }, 14 * 60 * 1000); // Ping every 14 minutes
        }
    });
};

app.use(require('./middleware/errorMiddleware'));

startServer().catch(console.error);
