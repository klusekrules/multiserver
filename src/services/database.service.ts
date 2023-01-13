import { AceBase } from 'acebase';
import { ConfigService } from './config.service';
import { exInit, exInjectable } from '../decorators/general';

@exInjectable({ name: 'databaseService' })
export class DatabaseService {
  static readonly _inject: string[] = ['configService'];
  private db: AceBase;

  constructor(config: ConfigService) {
    this.db = new AceBase(config.data.aceBase.name, config.data.aceBase.options);
  }

  @exInit()
  async init() {
    await this.db.ready();
    console.info('Database is ready to use');
  }

  ref(path) {
    return this.db.ref(path);
  }

  query(path) {
    return this.db.query(path);
  }

  close() {
    return this.db.close();
  }

  ready() {
    return this.db.ready();
  }
}
