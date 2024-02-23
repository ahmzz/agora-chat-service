const express = require("express");
const app = express();
const admin = require("firebase-admin");
const credentials = require("./key.json");
const {
  noCache,
  generateAccessToken,
  generateSingleAccessToken,
  generateGroupAccessToken,
  generateRoomToken
} = require("./agora");
const getAllUsers = require("./helper-functions");
require("dotenv").config();
admin.initializeApp({
  credential: admin.credential.cert(credentials),
});
const db = admin.firestore();

const PORT = process.env.PORT || 8080;

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.post("/create", async (req, res) => {
  try {
    const data = req.body;
    const response = db.collection("Users").doc().set(data);
    res.send("Record saved successfuly");
  } catch (error) {
    res.status(400).send(error.message);
  }
});
//app.get("/access_token", noCache, generateAccessToken);

app.post("/access_token", noCache, async (req, res) => {
  const tokens = generateAccessToken(req, res);
  console.log("🚀 ~ app.post ~ tokens:", tokens);
  let counter = 0;

  for (const token of tokens) {
    if (counter === 0) {
      const user = await db.collection("Users").doc(req.body.userId);
      console.log("🚀 ~ app.post ~ user:", user);

      const previousRooms = (await user.get()).data();
      console.log("🚀 ~ app.post ~ previousRooms:", previousRooms);

      if (Object.values(previousRooms.rooms).length === 0) {
        user.update({
          rooms: [token],
        });
      } else {
        user.update({
          rooms: [...previousRooms.rooms, token],
        });
      }
    } else {
      const user = await db.collection("Users").doc(token.participantId);
      //console.log("🚀 ~ app.post ~ user:", (await user.get()).data());
      const previousRooms = (await user.get()).data();
      //console.log("🚀 ~ app.post ~ previousRooms:", previousRooms.rooms);
      if (Object.values(previousRooms.rooms).length === 0) {
        user.update({
          rooms: [token],
        });
      } else {
        user.update({
          rooms: [...previousRooms.rooms, token],
        });
      }
    }
    ++counter;
  }

  res.send("Done");
});

app.post("/single_access_token", noCache, async (req, res) => {
  const token = generateSingleAccessToken(req, res);
  console.log("🚀 ~ app.post ~ token:", token);
  const user = await db.collection("Users").doc(req.body.userId);
  const userData = (await user.get()).data();
  user.update({
    rooms: [token],
  });
  console.log("🚀 ~ app.post ~ userData:", userData);

  res.send(token);
});

app.post("/group_access_token", noCache, async (req, res) => {
  const tokens = await generateGroupAccessToken(req, res,db);
  //console.log("🚀 ~ app.post ~ tokens:", tokens);

  res.send("Hello");
});

app.post('/room_access_token',noCache,async(req,res)=>{
  const tokens=await generateRoomToken(req,res,db)

  res.send("OK")

})

app.listen(PORT, () => {
  console.log("SERVER UP");
});
