
require('dotenv').config();
const express = require('express');

const getUsers = require('./server/github');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'pug');

app.get('/', getUsers, (req, res) => res.render('index', { users: res.locals.data }));

app.listen(port, () => console.log(`App listening on port ${port}`));
