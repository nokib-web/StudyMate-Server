const admin = require("firebase-admin");
require('dotenv').config();

try {
    if (!process.env.FIREBASE_SERVICE_KEY) {
        throw new Error("FIREBASE_SERVICE_KEY environment variable is missing!");
    }
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_KEY, "base64").toString("utf8");
    const serviceAccount = JSON.parse(decoded);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Firebase Admin initialized successfully!");
} catch (error) {
    console.error("❌ Firebase Initialization Failed:", error.message);
    // We don't necessarily want to exit(1) here if we want the rest of the server to run,
    // but without Firebase, most auth will fail.
    // However, index.js will catch any top-level errors if we throw.
    throw error;
}

module.exports = admin;
