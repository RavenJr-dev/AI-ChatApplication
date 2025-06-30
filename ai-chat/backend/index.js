import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import ImageKit from "imagekit";
import dotenv from "dotenv";
import Chat from "./models/chat.js";
import UserChats from "./models/userChats.js";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

dotenv.config();

const port = process.env.PORT || 3000;
const app = express();

// ✅ Allowed origins (add more if needed)
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173", // local dev
  "http://localhost:3000",
];

// ✅ CORS Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS error: ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// ✅ MongoDB Connection
const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
};

// ✅ ImageKit Setup
const imagekit = new ImageKit({
  urlEndpoint: process.env.IMAGE_KIT_ENDPOINT,
  publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
  privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
});

// ✅ Upload Route (for image auth)
app.get("/api/upload", (req, res) => {
  const result = imagekit.getAuthenticationParameters();
  res.send(result);
});

// ✅ Create Chat
app.post("/api/chats", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;
  const { text } = req.body;

  try {
    const newChat = new Chat({
      userId,
      history: [{ role: "user", parts: [{ text }] }],
    });

    const savedChat = await newChat.save();

    const userChats = await UserChats.findOne({ userId });

    if (!userChats) {
      const newUserChats = new UserChats({
        userId,
        chats: [{ _id: savedChat._id, title: text.substring(0, 40) }],
      });
      await newUserChats.save();
    } else {
      await UserChats.updateOne(
        { userId },
        {
          $push: {
            chats: {
              _id: savedChat._id,
              title: text.substring(0, 40),
            },
          },
        }
      );
    }

    res.status(201).send(savedChat._id);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating chat!");
  }
});

// ✅ Get All Chats for User
app.get("/api/userchats", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;

  try {
    const userChats = await UserChats.findOne({ userId });
    if (!userChats) return res.status(200).send([]);
    res.status(200).send(userChats.chats);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching user chats!");
  }
});

// ✅ Get Specific Chat
app.get("/api/chats/:id", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;

  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId });
    if (!chat) return res.status(200).send([]);
    res.status(200).send(chat);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching chat!");
  }
});

// ✅ Update Chat (Add Message)
app.put("/api/chats/:id", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;
  const { question, answer, img } = req.body;

  const newItems = [];

  if (question) {
    newItems.push({
      role: "user",
      parts: [{ text: question }],
      ...(img && { img }),
    });
  }

  if (answer) {
    newItems.push({
      role: "model",
      parts: [{ text: answer }],
    });
  }

  if (newItems.length === 0) {
    return res.status(400).send("No content to add to chat");
  }

  try {
    const updated = await Chat.updateOne(
      { _id: req.params.id, userId },
      { $push: { history: { $each: newItems } } }
    );

    res.status(200).send(updated);
  } catch (err) {
    console.error("Error saving chat:", err);
    res.status(500).send("Error adding conversation!");
  }
});

// ✅ Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(401).send("Unauthenticated or CORS error");
});

// ✅ Start Server
app.listen(port, () => {
  connect();
  console.log(`🚀 Server running on port ${port}`);
});
