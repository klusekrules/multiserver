import { AceBase, DataSnapshot, DataSnapshotsArray } from 'acebase';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import session from 'express-session';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import cors from 'cors';
import defaultConfig from './config';
import { All, Get, Post, Server, Set, Use } from './decorators/index';
import express from 'express';

let config: any = defaultConfig;

try {
  config = JSON.parse(fs.readFileSync(process.env.SERVER_CONFIGJS, 'utf8'));
} catch (e) {
  console.error(e);
}

const hash = require('pbkdf2-password')();
const db = new AceBase(config.aceBase.name);

@Server({ port: 8443 })
@Use(express.static('ui'))
@Use(express.urlencoded({ extended: false }))
@Use(cors(config.cors))
@Use(session(config.session))
@Use(cookieParser())
@Use(bodyParser.json())
@Set('view engine', 'pug')
@Set('views', path.join(__dirname, '..//src//views'))
class WebSerwer {
  @All('/api/*')
  checkSession(req, res, next) {
    if ((req as any).session.user) {
      console.log('Access granted');
      next();
    } else {
      (req as any).session.destroy(() => {
        console.log('Access denied');
        res.status(401).end();
      });
    }
  };

  @Get('/logout')
  logout(req, res) {
    (req as any).session.destroy(() => {
      res.status(200).end();
    });
  }

  @Post('/login')
  login(req, res) {
    authenticate(req.body, ({success, error, user}) => {
      if (success) {
        (req as any).session.regenerate(() => {
          (req as any).session.user = user;
          console.info('User login', user);
          res.status(200).json({});
        });
      } else {
        console.error('Error while user login', error);
        res.status(400).json({ msg: error });
      }
    });
  }

  @Post('/register')
  register(req, res) {
    createUser(req.body, ({success, error, user}) => {
      if (success) {
        console.info('User created', user);
        res.status(201).json({});
      } else {
        console.error('Error while user creation', error);
        res.status(400).json({ msg: error });
      }
    });
  }
}

const temp = new WebSerwer;
console.log('temp nowy', temp);

async function createUser(payload, fn) {
  await db.query('users')
    .filter('login', '==', payload.login)
    .get(snapshots => {
      if (snapshots.length) {
        fn({ success: false });
      } else {
        hash({ password: payload.password }, (err, pass, salt, hash) => {
          if (err) {
            fn({ success: false, error: err });
          }

          db.ref('users')
            .push({ login: payload.login, salt, hash })
            .then(userRef => {
              userRef.get((snapshot: DataSnapshot) => {
                fn({ success: true, user: snapshot.val() });
              });
            });
        });
      }
    }); 
}

async function authenticate(payload, fn) {
  await db.query('users')
    .filter('login', '==', payload.login)
    .get((snapshots: DataSnapshotsArray) => {
      if (!snapshots.length) {
        return fn({ success: false, error: 'User doesn\'t found' });
      } else {
        const user = snapshots[0].val();
        hash({ password: payload.password, salt: user.salt }, (err, pass, salt, hash) => {
          if (err) {
            return fn({ success: false, error: err });
          }

          if (hash === user.hash) {
            return fn({ success: true, user: {
              login: user.login,
              key: snapshots[0].key,
            } });
          }

          return fn({ success: false, error: 'Password doesn\'t match' });
        });
      }
    });
}
/*
app.all('/api/*', (req, res, next) => {
  if ((req as any).session.user) {
    console.log('Access granted');
    next();
  } else {
    (req as any).session.destroy(() => {
      console.log('Access denied');
      res.status(401).end();
    });
  }
});

app.get('/logout', (req, res) => {
  (req as any).session.destroy(() => {
    res.status(200).end();
  });
});

app.post('/login', (req, res) => {
  authenticate(req.body, ({success, error, user}) => {
    if (success) {
      (req as any).session.regenerate(() => {
        (req as any).session.user = user;
        console.info('User login', user);
        res.status(200).json({});
      });
    } else {
      console.error('Error while user login', error);
      res.status(400).json({ msg: error });
    }
  });
});

app.post('/register', (req, res, next) => {
  createUser(req.body, ({success, error, user}) => {
    if (success) {
      console.info('User created', user);
      res.status(201).json({});
    } else {
      console.error('Error while user creation', error);
      res.status(400).json({ msg: error });
    }
  });
});

app.get('/api/repo/list', async (req, res) => {
  console.log(`GET /repo/list`);
  const count = await db.ref(`repo`).count();
  if (count) {
    const snap = await db.ref(`repo`).get();
    const values = snap.val();
    res.json(values);
  } else {
    res.json({});
  }
});

app.post('/api/repo/add', async (req, res) => {
  console.log(`GET /repo/add`);
  const ref = await db.ref(`repo`).push(req.body);
  const snap = await ref.get();
  res.json({
    id: snap.key,
    payload: snap.val(),
  });
});

app.get('/api/repo/:name/list', async (req, res) => {
  console.log(`GET /repo/${req.params.name}/list`);
  const count = await db.ref(`repo/${req.params.name}`).count();
  if (count) {
    const snap = await db.ref(`repo/${req.params.name}`).get();
    const values = snap.val();
    res.json(values);
  } else {
    res.json({});
  }
});

app.post('/api/repo/:name/add', async (req, res) => {
  console.log(`GET /repo/${req.params.name}/add`);
  const ref = await db.ref(`repo/${req.params.name}/${req.query.id}`).set({name: req.query.name});
  const snap = await ref.get();
  res.json(snap.val());
});

function createServer(app) {
  const privateKey  = fs.readFileSync(config.ssl.privateKey, 'utf8');
  const certificate = fs.readFileSync(config.ssl.certificate, 'utf8');
  const credentials = { key: privateKey, cert: certificate };
  return https.createServer(credentials, app);
}

db.ready(() => {
  const server = config.general.useHttps
    ? createServer(app)
    : http.createServer(app);
  server.listen(config.general.port, () => {
    console.log('Serwer listen on port: ', config.general.port);
    console.log('Is https used: ', config.general.useHttps);
  });

  const gracefulShutdown = (signal) => {
    if (signal) {
      console.log(`\nReceived signal ${signal}`);
    }

    console.log('Gracefully closing http server');

    server.closeAllConnections();

    db.close()
      .then(() => {
        console.log('db closed successfully. Exiting!');
      })
      .catch((err) => {
        console.error('While closng db there was an error', err);
      })
      .finally(() => {
        try {
          server.close((err) => {
            if (err) {
              console.error('While closng server there was an error', err);
              process.exit(1);
            } else {
              console.log('http server closed successfully. Exiting!');
              process.exit(0);
            }
          })
        } catch (err) {
          console.error('There was an error', err);
          setTimeout(() => process.exit(1), 500);
        }
      });
  }

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
});
*/