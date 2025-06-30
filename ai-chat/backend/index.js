import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import ImageKit from "imagekit";
import dotenv from "dotenv";
import Chat from "./models/chat.js";
import UserChats from "./models/userChats.js";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

dotenv.config();

const port = process.env.PORT || 5000;
const app = express();

app.use(
  cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
})
);

app.use(express.json())

const connect = async () => {
  try{
    await mongoose.connect(process.env.MONGO)
    console.log("Connected to MongoDB")
  }
  catch(err){
    console.log(err)
  }
}

const imagekit = new ImageKit({
  urlEndpoint: process.env.IMAGE_KIT_ENDPOINT,
  publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
  privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
});

  
app.get("/api/upload", (req,res)=>{
   const  result = imagekit.getAuthenticationParameters();
   res.send(result);
});

//app.get("/api/test", ClerkExpressRequireAuth(),(req, res) => {
//  const userId = req.auth.userId;
//  console.log(userId);
//  res.send("Sucess!");
//});

app.post("/api/chats", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;
  const { text } = req.body;

  try {
    // CREATE A NEW CHAT
    const newChat = new Chat({
      userId: userId,
      history: [{ role: "user", parts: [{ text }] }],
    });

    const savedChat = await newChat.save();

    // CHECK IF THE USERCHATS EXISTS
    const userChats = await UserChats.findOne({ userId: userId });

    if (!userChats) {
      const newUserChats = new UserChats({
        userId: userId,
        chats: [
          {
            _id: savedChat._id,
            title: text.substring(0, 40),
          },
        ],
      });

      await newUserChats.save();
      res.status(201).send(savedChat._id);

    } else {
      console.log("Pushing new chat to existing userChats...");
      await UserChats.updateOne(
        { userId: userId },
        {
          $push: {
            chats: {
              _id: savedChat._id,
              title: text.substring(0, 40),
            },
          },
        }
      );
      res.status(201).send(savedChat._id); 
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Error creating Chat!");
  }
});

app.get("/api/userchats", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;

  try {
    const userChats = await UserChats.findOne({ userId });

    if (!userChats) {
      // Return an empty array if user has no chats
      return res.status(200).send([]);
    }

    res.status(200).send(userChats.chats);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching userchats!");
  }
});

app.get("/api/chats/:id", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;

  try {
    const chat = await Chat.findOne({ _id:req.params.id, userId });

    if (!chat) {
      // Return an empty array if user has no chats
      return res.status(200).send([]);
    }

    res.status(200).send(chat);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching chat!");
  }
});

app.put("/api/chats/:id", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;
  const { question, answer, img } = req.body;

  console.log(" PUT CHAT RECEIVED");
  console.log("User:", userId);
  console.log("Chat ID:", req.params.id);
  console.log("Question:", question);
  console.log("Answer:", answer);
  console.log("Image:", img);

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

  console.log(" newItems being added:", newItems);

  if (newItems.length === 0) {
    return res.status(400).send("No content to add to chat");
  }

  try {
    const updated = await Chat.updateOne(
      { _id: req.params.id, userId },
      { $push: { history: { $each: newItems } } }
    );

    console.log(" Updated result:", updated);
    res.status(200).send(updated);
  } catch (err) {
    console.error(" Error saving chat:", err);
    res.status(500).send("Error adding conversation!");
  }
});



app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(401).send('Unauthenticated!');
});

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
