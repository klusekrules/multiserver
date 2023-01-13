import { ConfigService } from '../services/config.service';
import { DatabaseService } from '../services/database.service';
import { exGet, exPost } from '../decorators/methods';
import { exInit, exInjectable } from '../decorators/general';

@exInjectable({ name: 'repoListener' })
export class RepoListener {
  static readonly _inject: string[] = ['databaseService', 'configService'];

  constructor(private db: DatabaseService,
              private config: ConfigService) {
  }

  @exInit()
  async init() {
    await this.db.ready();
  }

  @exGet('/api/repo/list')
  async repoList(req, res) {
    const count = await this.db.ref('repo').count();
    if (count) {
      const snap = await this.db.ref('repo').get();
      const values = snap.val();
      res.json(this.convertListToArray(values, 'id'));
    } else {
      res.json({});
    }
  }

  @exPost('/api/repo/add')
  async repoAdd(req, res) {
    const ref = await this.db.ref('repo').push(req.body);
    const snap = await ref.get();
    res.json({
      id: snap.key,
      payload: snap.val(),
    });
  }

  @exGet('/api/repo/:name/list')
  async repoListValue(req, res) {
    const count = await this.db.ref(`repo/${req.params.name}`).count();
    if (count) {
      const snap = await this.db.ref(`repo/${req.params.name}`).get();
      const values = snap.val();
      res.json(this.convertListToArray(values, 'id'));
    } else {
      res.json({});
    }
  }

  @exPost('/api/repo/:name/add')
  async repoListValueAdd(req, res) {
    const ref = await this.db.ref(`repo/${req.params.name}/${req.query.id}`).set({name: req.query.name});
    const snap = await ref.get();
    res.json(snap.val());
  }

  convertListToArray(object, idAttr) {
    return Object.keys(object).map(val => ({ ...object[val], [idAttr]: val }));
  }
}