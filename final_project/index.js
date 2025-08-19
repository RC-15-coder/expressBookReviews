const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/customer",session({secret:"fingerprint_customer",resave: true, saveUninitialized: true}))

app.use("/customer/auth/*", function auth(req,res,next){
//Write the authenication mechanism here
 // Require a session with an access token
  if (!req.session || !req.session.authorization) {
    return res.status(401).json({ message: "User not logged in" });
  }

  const { accessToken, username } = req.session.authorization;

  // Verify JWT
  jwt.verify(accessToken, "access", (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "User not authenticated" });
    }
    // Attach user info for downstream routes if needed
    req.user = { username: username || decoded?.username };
    return next();
  });
});
 
const PORT =5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT,()=>console.log("Server is running"));
