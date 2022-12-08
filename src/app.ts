import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import session from 'express-session';
import path from 'path';

import { AceBase, DataReference, DataSnapshot } from 'acebase';

const everyauth = require('everyauth');

const usersById = {};
let nextUserId = 0;

function addUser (source) {
  const id = ++nextUserId;
  return usersById[nextUserId] = { ...source, id };
}

const usersByLogin = {
  'brian@example.com': addUser({ login: 'brian@example.com', password: 'password'})
};

everyauth.everymodule
  .findUserById( function (id, callback) {
    callback(null, usersById[id]);
  });

everyauth
  .password
    .loginWith('email')
    .getLoginPath('/login')
    .postLoginPath('/login')
    .loginView('login')
//    .loginLocals({
//      title: 'Login'
//    })
//    .loginLocals(function (req, res) {
//      return {
//        title: 'Login'
//      }
//    })
    .loginLocals( function (req, res, done) {
      setTimeout( function () {
        done(null, {
          title: 'Async login'
        });
      }, 200);
    })
    .authenticate( function (login, password) {
      var errors = [];
      if (!login) errors.push('Missing login');
      if (!password) errors.push('Missing password');
      if (errors.length) return errors;
      var user = usersByLogin[login];
      if (!user) return ['Login failed'];
      if (user.password !== password) return ['Login failed'];
      return user;
    })

    .getRegisterPath('/register')
    .postRegisterPath('/register')
    .registerView('register')
//    .registerLocals({
//      title: 'Register'
//    })
//    .registerLocals(function (req, res) {
//      return {
//        title: 'Sync Register'
//      }
//    })
    .registerLocals( function (req, res, done) {
      setTimeout( function () {
        done(null, {
          title: 'Async Register'
        });
      }, 200);
    })
    .validateRegistration( function (newUserAttrs, errors) {
      var login = newUserAttrs.login;
      if (usersByLogin[login]) errors.push('Login already taken');
      return errors;
    })
    .registerUser( function (newUserAttrs) {
      var login = newUserAttrs[this.loginKey()];
      return usersByLogin[login] = addUser(newUserAttrs);
    })

    .loginSuccessRedirect('/')
    .registerSuccessRedirect('/');

const app = express()

app
  .use(bodyParser.json())
  .use(cookieParser())
  .use(express.urlencoded({ extended: false }))
  .use(session({
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    secret: 'shhhh, very secret'
  }))
  .use(everyauth.middleware(app));

everyauth.helpExpress(app);

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '..\\src\\views'));

app.get('/', (req, res) => {
  res.render('home');
});

const db = new AceBase('.');
const port = 3000;

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
