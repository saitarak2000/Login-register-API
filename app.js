const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbpath = path.join(__dirname, "userData.db");
const bcrypt = require("bcrypt");

let db = null;
const initializedbandserver = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000);
    console.log("Server is running on http://localhost:3000/");
  } catch (e) {
    console.log(`'${e}'`);
    process.exit(1);
  }
};

initializedbandserver();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const encryptedpassword = await bcrypt.hash(password, 10);
  const query = `select * from user where username='${username}';`;
  const queryresult = await db.get(query);

  if (queryresult === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const query = `insert into user (username,name,password,gender,location) 
         values('${username}','${name}','${encryptedpassword}','${gender}','${location}');`;
      await db.run(query);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  //const validatepassword = await bcrypt.compare(password,);
  const query = `select * from user where username='${username}';`;
  const queryresult = await db.get(query);
  //response.send(queryresult);

  if (queryresult === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const validatepassword = await bcrypt.compare(
      password,
      queryresult.password
    );

    if (validatepassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const query = `select password from user where username='${username}';`;
  const getpassword = await db.get(query);
  //console.log(getpassword);
  const verifyoldpassword = await bcrypt.compare(
    oldPassword,
    getpassword.password
  );
  if (verifyoldpassword === false) {
    response.status(400);
    response.send("Invalid current password");
  } else if (newPassword.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const encryptedpassword = await bcrypt.hash(newPassword, 10);
    const query = `update user set
             password='${encryptedpassword}'
      where username='${username}'`;
    const data = await db.run(query);
    // const checkingpasswdupd = await bcrypt.compare(
    //   newPassword,
    //   getpassword.password
    // );
    // console.log(checkingpasswdupd);
    response.status(200);
    response.send("Password updated");
  }
});

module.exports = app;
