'use strict';

/**
 * Required modules
 */

const express = require('express');
const path = require('path');
const { mongoclient } = require('mongodb');
const fs = require('fs');

/**
 * Data files
 */

let mongo_raw = fs.readFileSync('./data/mongo-credentials.json');
let mdb_cred = JSON.parse(mongo_raw);
const uri = `mongodb://${mdb_cred.dbuser}:${mdb_cred.dbpassword}@${mdb_cred.url}`;

/**
 * App variables
 */

 const app = express();
 const port = process.env.PORT || "8000";

 /**
  * Routes definitions
  */

  app.get("/", (req, res) => {
      res.status(200).send("Hello: hello");
  })

  /**
   * Server activation
   */

   app.listen(port, () => {
       console.log(`Listening to requests on http://localhost:${port}`);
   })