const express = require("express");
const app = express();

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const url = 'mongodb+srv://arimakosei92_db_user:5yGWNSd8dgpbOoqH@cluster0.skq72tl.mongodb.net/?appName=Cluster0';

MongoClient.connect(url)
  .then(function (client) {
    return client.db("genoa")
  })
  .then(function (genoa) {
    // TODO : monter les routes ici
    // const authRoutes = require("./routes/auth");
    // app.use("/auth", authRoutes);

    app.listen(3000, () => {
        console.log("Serveur démarré sur http://localhost:3000");
      });
  })
  .catch(function (err) {
    throw err;
  });