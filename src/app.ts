import express from 'express';
import cookieParser from 'cookie-parser';
import { AceBase, DataReference, DataSnapshot } from 'acebase';

const db = new AceBase('.');
const cookieParser = require('cookie-parser');
const app = express();
const port = 3000;

app.use(cookieParser());

app.get('/p', (req, res) => {
  const cookie = req.cookies + req.cookies.name ? req.cookies.name : null;
  console.log(req.query);
  db.ref('users')
    .push({
        name: 'Ewout',
        country: 'The Netherlands'
    })
    .then((userRef: DataReference) => {
      console.log('key:', userRef.key);
      userRef.get((snapshot: DataSnapshot) => {
        if (snapshot.exists()) {
          console.log('value:', snapshot.val());
          res.cookie('name', req.query && req.query.name ? req.query.name : 'Test' );
          res.send(`Hello World!${cookie ? ' + ' + cookie : ''}`);
        }
      });
    });
});

app.get('/repositories/:name/list', async (req, res) => {
  console.log(`GET /repositories/${req.params.name}/list`);
  const count = await db.ref(`repositories/${req.params.name}`).count();
  if (count) {
    const snap = await db.ref(`repositories/${req.params.name}`).get();
    const values = snap.val();
    res.send('value: ' + JSON.stringify(values));
  } else {
    res.send('none');
  }
});

app.get('/repositories/:name/add', async (req, res) => {
  console.log(`GET /repositories/${req.params.name}/add`);
  const ref = await db.ref(`repositories/${req.params.name}/${req.query.id}`).set({name: req.query.name});
  const snap = await ref.get();
  res.send('value: ' + JSON.stringify(snap.val()));
});

db.ready(() => {
  app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
  });
});
