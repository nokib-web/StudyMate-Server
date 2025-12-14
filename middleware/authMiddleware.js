const admin = require("firebase-admin");
const { getCollection } = require("../config/db");

// Verify Firebase Token Middleware
const verifyFireBaseToken = async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authorization.split(' ')[1];

    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.token_email = decoded.email;
        // Attach user info to request if needed, but email is often enough
        next();
    }
    catch (error) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
}

// Verify Admin Middleware
const verifyAdmin = async (req, res, next) => {
    const email = req.token_email;
    const usersCollection = getCollection("users");
    const query = { email: email };
    const user = await usersCollection.findOne(query);
    const isAdmin = user?.role === 'admin';
    if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
    }
    next();
}

// Verify Moderator Middleware
const verifyModerator = async (req, res, next) => {
    const email = req.token_email;
    const usersCollection = getCollection("users");
    const query = { email: email };
    const user = await usersCollection.findOne(query);
    const isModerator = user?.role === 'moderator' || user?.role === 'admin';
    if (!isModerator) {
        return res.status(403).send({ message: 'forbidden access' });
    }
    next();
}

module.exports = { verifyFireBaseToken, verifyAdmin, verifyModerator };
