const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const { getCurrentTimeUid } = require("./helper-functions");

require("dotenv").config();

console.log("ENV", process.env.APP_ID);
const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;
const noCache = (req, res, next) => {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.header("Expires", "-1");
  res.header("Pragma", "no-cache");
  next();
};

const generateAccessToken = (req, res) => {
  res.header("Acess-Control-Allow-Origin", "*");

  const channelName = req.body.channelName;
  const roomCreator = req.body.userId;
  const participants = [];

  participants.push(roomCreator);
  console.log("LENGHT", req.body.participants.length);
  participants.push(...req.body.participants);
  const tokens = [];
  let counter = 1;
  console.log("PARTICPANTS: ", participants);

  if (!channelName) {
    return res.status(500).json({ error: "Channel name is required" });
  }

  let expireTime = req.query.expireTime;
  if (!expireTime || expireTime == "") {
    expireTime = 43200;
  } else {
    expireTime = parseInt(expireTime, 10);
  }
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTIme = currentTime + expireTime;
  for (const user of participants) {
    console.log("🚀 ~ generateAccessToken ~ user:", user);
    //RtcTokenBuilder.buildTokenWithUid()
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      user,
      null,
      privilegeExpireTIme
    );

    if (roomCreator === user) {
      console.log("YES");
      tokens.push({
        token,
        roomCreatorId: roomCreator,
        participantId: participants[1],
        channelName: channelName,
      });
    } else {
      tokens.push({
        token,
        roomCreatorId: roomCreator,
        participantId: user,
        channel: channelName,
      });
    }
    // tokens.push({
    //   token,
    //   roomCreatorId: roomCreator,
    //   participantId: user,
    //   channel: channelName,
    // });
    // ++counter;
  }

  return tokens;

  //res.send({ tokens: tokens,users:users });
};

const generateSingleAccessToken = (req, res) => {
  const channelName = req.body.channelName;
  const roomCreator = req.body.channelAccessId;
  const userId = req.body.userId;

  let expireTime = req.query.expireTime;
  if (!expireTime || expireTime == "") {
    expireTime = 43200;
  } else {
    expireTime = parseInt(expireTime, 10);
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTIme = currentTime + expireTime;
  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    roomCreator,
    null,
    privilegeExpireTIme
  );

  return { token, channelName, channelAccessId: roomCreator };
};

const generateGroupAccessToken = async (req, res, db) => {
  const participants = req.body.participants;
  //console.log("🚀 ~ generateGroupAccessToken ~ participants:", participants);
  const channelName = req.body.channelName;
  //console.log("🚀 ~ generateGroupAccessToken ~ channelName:", channelName);
  const roomCreatorId = req.body.channelAccessId;
  //console.log("🚀 ~ generateGroupAccessToken ~ roomCreator:", roomCreatorId);
  const tokens = [];
  //console.log("TOKENN: ", generateSingleAccessToken(req, res));
  // tokens.push({
  //   userId: roomCreatorId,
  //   ...generateSingleAccessToken(req, res),
  // });
  // /console.log("🚀 ~ generateGroupAccessToken ~ tokens:", tokens)

  // FOR SINGLE USER
  const singleUser=await db.collection("Users").doc(req.body.userId);
  const singleUserData=(await singleUser.get()).data();
  console.log("🚀 ~ generateGroupAccessToken ~ singleUserData:", singleUserData)
  if(singleUserData.rooms.length===0){
    singleUser.update(
      {
        rooms:[
          {
            channelAccessId:singleUserData.channelAccessId,
            channelName,
            token:generateSingleAccessToken(req,res).token
          }
        ]

      }
    )
  }else{
    singleUser.update({
      rooms:[
        {
          channelAccessId:singleUserData.channelAccessId,
          channelName,
          token:generateSingleAccessToken(req,res).token
        },
        ...singleUserData.rooms
      ]
    })
  }

  for (const participant of participants) {
    const user = await db.collection("Users").doc(participant);
    const userData = (await user.get()).data();
    console.log("🚀 ~ generateGroupAccessToken ~ userData:", userData);

    let previousRooms = userData.rooms;
    console.log(
      "🚀 ~ generateGroupAccessToken ~ previousRooms:",
      previousRooms.length
    );

    // console.log("🚀 ~ generateGroupAccessToken ~ previousRooms:", previousRooms)
    const newToken = generateSingleAccessToken(req, res);
    if (previousRooms.length === 0) {
      user.update({
        rooms: [
          {
            channelAccessId: userData.channelAccessId,
            channelName,
            token: newToken.token,
          },
        ],
      });
    } else {
      user.update({
        rooms: [
          {
            channelAccessId: userData.channelAccessId,
            channelName,
            token: newToken.token,
          },
          ...previousRooms,
        ],
      });
    }
  }
};

module.exports = {
  noCache,
  generateAccessToken,
  generateSingleAccessToken,
  generateGroupAccessToken,
};
