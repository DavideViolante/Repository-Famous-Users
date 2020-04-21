
require('dotenv').config();
const express = require('express');

const getUsers = require('./routes/github');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'pug');

app.get('/', (req, res) => res.json('Please call GET /:owner/:repo/:endpoint - See README.md for more info'));
app.get('/:owner/:repo/:endpoint', getUsers, showIndex);

app.listen(port, () => console.log(`Repository Famous Users listening on port ${port}`));

function showIndex(req, res) {
  const { users, owner, repo, endpoint } = res.locals;
  res.render('index', { users, owner, repo, endpoint });
}
