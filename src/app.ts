import express from 'express';
const app = express();
const port = 3000;

app.get('/p', (req, res) => {
  console.log(req.query);
  res.send('Hello World! tests');
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
