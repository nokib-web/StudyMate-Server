const { getCollection } = require("../config/db");
const { ObjectId } = require('mongodb');

const getSessionsCollection = () => getCollection("study_sessions");
const getMessagesCollection = () => getCollection("messages");
const getGroupsCollection = () => getCollection("groups");

// Create Session
const createSession = async (req, res) => {
    try {
        const sessionsCollection = getSessionsCollection();
        const messagesCollection = getMessagesCollection();
        const { groupId, topic, startTime, duration, createdBy, createdByEmail } = req.body;

        if (!groupId || !topic || !startTime) {
            return res.status(400).send({ message: "Missing required fields" });
        }

        const newSession = {
            groupId,
            topic,
            startTime: new Date(startTime),
            duration, // in minutes
            createdBy: createdByEmail, // email
            creatorName: createdBy, // name
            participants: [createdByEmail], // Creator joins automatically
            createdAt: new Date(),
            status: 'scheduled'
        };

        const result = await sessionsCollection.insertOne(newSession);
        const sessionId = result.insertedId;

        // Create a Chat Message for this Session
        const systemMessage = {
            room: groupId,
            author: 'system', // Special author
            type: 'schedule',
            session: {
                _id: sessionId,
                topic,
                startTime,
                creatorName: createdBy
            },
            message: `📅 Study Session: ${topic}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: new Date(),
            readBy: []
        };

        const msgResult = await messagesCollection.insertOne(systemMessage);

        // Emit to Room
        const io = req.app.get('io');
        if (io) {
            const groupsCollection = getGroupsCollection();
            const group = await groupsCollection.findOne({ _id: new ObjectId(groupId) });

            if (group && group.members) {
                // Notify all members
                group.members.forEach(memberEmail => {
                    io.to(memberEmail).emit("receive_message", { ...systemMessage, _id: msgResult.insertedId });
                });
            }
        }

        res.send({ session: newSession, message: systemMessage });

    } catch (error) {
        console.error("Create Session Error:", error);
        res.status(500).send({ message: "Failed to create session" });
    }
};

// Toggle RSVP (Join/Leave)
const toggleRSVP = async (req, res) => {
    try {
        const sessionsCollection = getSessionsCollection();
        const { sessionId, email } = req.body;

        const session = await sessionsCollection.findOne({ _id: new ObjectId(sessionId) });
        if (!session) return res.status(404).send({ message: "Session not found" });

        const isParticipant = session.participants.includes(email);
        let update;

        if (isParticipant) {
            update = { $pull: { participants: email } };
        } else {
            update = { $addToSet: { participants: email } };
        }

        await sessionsCollection.updateOne({ _id: new ObjectId(sessionId) }, update);

        const updatedSession = await sessionsCollection.findOne({ _id: new ObjectId(sessionId) });
        res.send(updatedSession);

    } catch (error) {
        console.error("RSVP Error:", error);
        res.status(500).send({ message: "Failed to update RSVP" });
    }
};

// Get Session Details
const getSession = async (req, res) => {
    const sessionsCollection = getSessionsCollection();
    const id = req.params.id;
    const session = await sessionsCollection.findOne({ _id: new ObjectId(id) });
    res.send(session);
};

module.exports = { createSession, toggleRSVP, getSession };
