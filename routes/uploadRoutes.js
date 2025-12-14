const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { verifyFireBaseToken } = require('../middleware/authMiddleware');

// Multer config for generic file upload (temp storage in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/', verifyFireBaseToken, upload.single('file'), async (req, res) => {
    console.log("Upload request received");
    try {
        if (!req.file) {
            console.log("No file in request");
            return res.status(400).send({ message: "No file uploaded" });
        }
        console.log("File received:", req.file.originalname, req.file.mimetype);

        // Upload to Cloudinary
        // Use upload_stream for memory storage files
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

        console.log("Uploading to Cloudinary...");
        const result = await cloudinary.uploader.upload(dataURI, {
            resource_type: "auto", // auto detect image vs raw/video
            folder: "study-mate-chats"
        });

        console.log("Upload success:", result.secure_url);

        res.send({
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            resource_type: result.resource_type
        });

    } catch (error) {
        console.error("Upload error details:", error);
        res.status(500).send({ message: "Upload failed" });
    }
});

module.exports = router;
