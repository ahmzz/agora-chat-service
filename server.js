const express = require("express");
const app = express();
const admin = require("firebase-admin");
const credentials = require("./key.json");
const { noCache, generateAccessToken } = require("./agora");
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

      const previousRooms = (await user.get()).data();

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

app.listen(PORT, () => {
  console.log("SERVER UP");
});
