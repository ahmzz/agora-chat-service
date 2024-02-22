function getAllUsers(db) {
  const usersRef = db.collection("Users");

  return usersRef
    .get()
    .then((snapshot) => {
      const users = [];

      snapshot.forEach((doc) => {
        // Document data is in doc.data()
        users.push(doc.data());
      });

      return users;
    })
    .catch((error) => {
      console.error("Error getting all users:", error);
      throw error; // You may want to handle the error appropriately in your application
    });
}

function getCurrentTimeUid() {
  // Get the current time in milliseconds
  const currentTime = new Date().getTime();

  // Ensure the time is within a 24-bit range (0 to 16777215)
  const truncatedTime = currentTime % 16777216;

  return truncatedTime;
}

module.exports = { getAllUsers, getCurrentTimeUid };
