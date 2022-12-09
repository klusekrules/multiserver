import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import session from 'express-session';
import path from 'path';

import { AceBase, DataReference, DataSnapshot, DataSnapshotsArray } from 'acebase';

const hash = require('pbkdf2-password')();

const app = express();

const db = new AceBase('.');
const port = 3000;

app
  .use(bodyParser.json())
  .use(cookieParser())
  .use(express.urlencoded({ extended: false }))
  .use(session({
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    secret: 'shhhh, very secret'
  }));

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '..\\src\\views'));


app.use((req, res, next) => {
  const err = (req as any).session.error;
  const msg = (req as any).session.success;
  delete (req as any).session.error;
  delete (req as any).session.success;
  res.locals.message = '';
  if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
  if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
  next();
});

async function createUser(login, password, fn) {
  await db.query('users')
    .filter('login', '==', login)
    .get(snapshots => {
      if (snapshots.length) {
        fn({ success: false });
      } else {
        hash({ password }, (err, pass, salt, hash) => {
          if (err)
            fn({ success: false, error: err });
          db.ref('users').push({ login, salt, hash }).then(userRef => {
            userRef.get((snapshot: DataSnapshot) => {
              fn({ success: true, user: snapshot.val() });
            });
          });
        });
      }
    }); 
}

async function authenticate(login, password, fn) {
  await db.query('users')
    .filter('login', '==', login)
    .get((snapshots: DataSnapshotsArray) => {
      if (!snapshots.length) {
        return fn({ success: false });
      } else {
        const user = snapshots[0].val();
        hash({ password, salt: user.salt }, (err, pass, salt, hash) => {
          if (err)
            return fn({ success: false, error: err });
          if (hash === user.hash) 
            return fn({ success: true, user: {
              login: user.login,
              key: snapshots[0].key,
            } });
          return fn({ success: false });
        });
      }
    });
}

function restrict(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}

app.get('/restricted', restrict, function(req, res){
  res.send('Wahoo! restricted area, click to <a href="/logout">logout</a>');
});

app.get('/logout', function(req, res){
  (req as any).session.destroy(function(){
    res.redirect('/login');
  });
});

app.get('/home', (req, res) => {
  res.render('home', { session: (req as any).session });
});

app.get('/login', (req, res) => {
  res.render('login', { session: (req as any).session });
});

app.get('/register', (req, res) => {
  res.render('register', { session: (req as any).session });
});

app.post('/login', (req, res, next) => {
  authenticate(req.body.login, req.body.password, ({success, error, user}) => {
    if (!success) return next(error);
    if (user) {
      (req as any).session.regenerate(() => {
        (req as any).session.user = user;
        res.redirect('/restricted');
      });
    } else {
      (req as any).session.error = 'Authentication failed, please check your '
        + ' login and password.'
        + ' (use "tj" and "foobar")';
      res.redirect('/login');
    }
  });
});

app.post('/register', (req, res, next) => {
  createUser(req.body.login, req.body.password, ({success, error, user}) => {
    if (!success) return next(error);
    res.redirect('/login');
  });
});

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
