import pbkdf2Password from 'pbkdf2-password';
import { DataSnapshot, DataSnapshotsArray } from 'acebase';
import { DatabaseService } from '../services/database.service';
import { exAll, exGet, exPost } from '../decorators/methods';
import { exInit, exInjectable } from '../decorators/general';

@exInjectable({ name: 'securityListener' })
export class SecurityListener {
  static readonly _inject: string[] = ['databaseService', 'configService'];
  private hash;

  constructor(private db: DatabaseService) {
    this.hash = pbkdf2Password();
  }

  @exInit()
  async init() {
    await this.db.ready();
  }

  @exAll('/api/*')
  checkSession({ session }, res, next) {
    if (session.user) {
      console.log('Access granted');
      next();
    } else {
      session.destroy(() => {
        console.log('Access denied');
        res.status(401).end();
      });
    }
  }

  @exGet('/logout')
  logout({ session }, res) {
    session.destroy(() => {
      res.status(200).end();
    });
  }

  @exPost('/login')
  async login({ body, session }, res) {
    await this.authenticate(body, ({success, error, user}) => {
      if (success) {
        session.regenerate(() => {
          session.user = user;
          console.info('User login', user);
          res.status(200).json({});
        });
      } else {
        console.error('Error while user login', error);
        res.status(400).json({ msg: error });
      }
    });
  }

  @exPost('/register')
  async register(req, res) {
    await this.createUser(req.body, ({success, error, user}) => {
      if (success) {
        console.info('User created', user);
        res.status(201).json({});
      } else {
        console.error('Error while user creation', error);
        res.status(400).json({ msg: error });
      }
    });
  }

  async createUser(payload, fn) {
    await this.db.query('users')
      .filter('login', '==', payload.login)
      .get(snapshots => {
        if (snapshots.length) {
          fn({ success: false });
        } else {
          this.hash({ password: payload.password }, (err, pass, salt, hash) => {
            if (err) {
              fn({ success: false, error: err });
            }

            this.db.ref('users')
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

  async authenticate(payload, fn) {
    await this.db.query('users')
      .filter('login', '==', payload.login)
      .get((snapshots: DataSnapshotsArray) => {
        if (!snapshots.length) {
          return fn({ success: false, error: 'User doesn\'t found' });
        } else {
          const user = snapshots[0].val();
          this.hash({ password: payload.password, salt: user.salt }, (err, pass, salt, hash) => {
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
}