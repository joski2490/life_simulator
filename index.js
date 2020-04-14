const express = require('express');
const path = require('path');
const routes = require('./routes');

const app = express();

app.set('views', path.join(__dirname, 'html'));

app.use(express.static(path.join(__dirname, 'css')));
app.use(express.static(path.join(__dirname, 'scripts')));
app.use(express.static(path.join(__dirname, 'assets')));

app.set('view engine', 'ejs');

app.use('/', routes);

app.listen(8081, () => {
    console.log('listening on port 8081');
});