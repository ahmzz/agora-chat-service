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

module.exports = getAllUsers;
