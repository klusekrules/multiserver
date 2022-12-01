import express from 'express';

const cookieParser = require('cookie-parser');
const app = express();
const port = 3000;

app.use(cookieParser());

app.get('/p', (req, res) => {
  const cookie = req.cookies + req.cookies.name ? req.cookies.name : null;
  console.log(req.query);
  res.cookie('name', req.query && req.query.name ? req.query.name : 'Test' );
  res.send(`Hello World!${cookie ? ' + ' + cookie : ''}`);
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
