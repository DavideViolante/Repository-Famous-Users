
require('dotenv').config();
const express = require('express');

const main = require('./server/github');

const app = express();
const port = process.env.PORT || 3000;

//const { mockdata, mockusers } = require('./data');

app.get('/', main);
app.listen(port, () => console.log(`App listening on port ${port}`));
