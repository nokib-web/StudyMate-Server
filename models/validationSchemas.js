const { z } = require("zod");

// User Schemas
const createUserSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email format"),
        role: z.enum(["student", "moderator", "admin"]).optional(),
        image: z.string().url().optional().or(z.literal("")),
    }),
});

// Partner Schemas
const createPartnerSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email(),
        subject: z.string().min(1, "Subject is required"),
        availabilityTime: z.string().min(1, "Availability is required"),
        studyMode: z.string().optional(),
        location: z.string().optional(),
        experienceLevel: z.string().optional(),
    }),
});

// Group Schemas
const createGroupSchema = z.object({
    body: z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        adminEmail: z.string().email(),
        isPublic: z.boolean().optional(),
    }),
});

module.exports = {
    createUserSchema,
    createPartnerSchema,
    createGroupSchema
};
