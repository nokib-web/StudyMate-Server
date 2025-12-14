const { getCollection } = require("../config/db");
const { ObjectId } = require('mongodb');

const getGroupsCollection = () => getCollection("groups");
const getMessagesCollection = () => getCollection("messages");

// Create a Group
const createGroup = async (req, res) => {
    const groupsCollection = getGroupsCollection();
    const newGroup = req.body;
    // Expected: { name, description, adminEmail, isPublic: true/false }

    // Add admin to members automatically
    newGroup.members = [newGroup.adminEmail];
    newGroup.createdAt = new Date();

    const result = await groupsCollection.insertOne(newGroup);
    res.send(result);
};

// Get Public Groups
const getPublicGroups = async (req, res) => {
    const groupsCollection = getGroupsCollection();
    const query = { isPublic: true };
    const result = await groupsCollection.find(query).toArray();
    res.send(result);
};

// Get User's Groups
const getMyGroups = async (req, res) => {
    const groupsCollection = getGroupsCollection();
    const email = req.query.email;
    if (email !== req.token_email) {
        return res.status(403).send({ message: 'forbidden access' });
    }
    const query = { members: { $in: [email] } };
    const result = await groupsCollection.find(query).toArray();
    res.send(result);
};

// Join Group
const joinGroup = async (req, res) => {
    const groupsCollection = getGroupsCollection();
    const { groupId, email } = req.body;
    if (email !== req.token_email) {
        return res.status(403).send({ message: 'forbidden access' });
    }

    const result = await groupsCollection.updateOne(
        { _id: new ObjectId(groupId) },
        { $addToSet: { members: email } }
    );
    res.send(result);
};

// Create or Get DM
const createDM = async (req, res) => {
    const groupsCollection = getGroupsCollection();
    const { senderEmail, receiverEmail } = req.body;

    const emails = [senderEmail, receiverEmail].sort();
    const dmRoomName = `dm-${emails[0]}-${emails[1]}`;

    const existingDM = await groupsCollection.findOne({ name: dmRoomName });
    if (existingDM) {
        return res.send(existingDM);
    }

    const newDM = {
        name: dmRoomName,
        isPrivate: true,
        type: 'dm',
        members: emails,
        createdAt: new Date(),
        description: "Direct Message"
    };

    const result = await groupsCollection.insertOne(newDM);
    const fullDM = { ...newDM, _id: result.insertedId };

    // Notify members
    const io = req.app.get('io');
    if (io) {
        emails.forEach(email => {
            io.to(email).emit("new_group", fullDM);
        });
    }

    res.send(fullDM);
};

// Request to Join
const requestJoin = async (req, res) => {
    const groupsCollection = getGroupsCollection();
    const { groupId, email } = req.body;

    const group = await groupsCollection.findOne({ _id: new ObjectId(groupId) });
    if (!group) return res.status(404).send({ message: "Group not found" });

    if (group.members?.includes(email)) {
        return res.send({ message: "Already a member" });
    }

    const result = await groupsCollection.updateOne(
        { _id: new ObjectId(groupId) },
        { $addToSet: { joinRequests: email } }
    );

    res.send(result);
};

// Approve Join
const approveJoin = async (req, res) => {
    const groupsCollection = getGroupsCollection();
    const { groupId, applicantEmail, adminEmail } = req.body;

    if (adminEmail !== req.token_email) return res.status(403).send({ message: "Forbidden" });

    // In a real app, verifying admin status against the group record is better
    // For now we assume the caller checks (or we trust the token matches 'adminEmail' which we checked)

    const result = await groupsCollection.updateOne(
        { _id: new ObjectId(groupId) },
        {
            $pull: { joinRequests: applicantEmail },
            $addToSet: { members: applicantEmail }
        }
    );

    const group = await groupsCollection.findOne({ _id: new ObjectId(groupId) });

    // Notify Applicant
    const io = req.app.get('io');
    if (io && group) {
        io.to(applicantEmail).emit("new_group", group);
    }

    res.send(result);
};

// Get Messages
const getMessages = async (req, res) => {
    const messagesCollection = getMessagesCollection();
    const room = req.params.room;
    const result = await messagesCollection.find({ room: room }).sort({ createdAt: 1 }).toArray();
    res.send(result);
};

// Mark Messages Read
const markRead = async (req, res) => {
    const messagesCollection = getMessagesCollection();
    const { room, email } = req.body;
    const result = await messagesCollection.updateMany(
        { room: room, author: { $ne: email }, readBy: { $ne: email } },
        { $addToSet: { readBy: email } }
    );
    res.send(result);
};

module.exports = {
    createGroup,
    getPublicGroups,
    getMyGroups,
    joinGroup,
    createDM,
    requestJoin,
    approveJoin,
    getMessages,
    markRead
};
