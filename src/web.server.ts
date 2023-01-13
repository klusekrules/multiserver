import { ConfigService } from './services/config.service';
import { DatabaseService } from './services/database.service';
import { exInit, exUse } from './decorators/general';
import { exConfig, exServer, exSigInt, exSigTerm } from './decorators/server';
import { SecurityListener } from './listeners/security.listener';
import { RepoListener } from './listeners/repo.listener';
import { Middlewares } from './middlewares/middlewares';

@exServer()
@exUse(Middlewares)
@exUse(SecurityListener)
@exUse(RepoListener)
export class WebSerwer {
  static readonly _inject: string[] = ['databaseService', 'configService'];

  constructor(
    private db: DatabaseService,
    private config: ConfigService) {
  }

  @exInit()
  async init() {
    await this.db.ready();
  }

  @exConfig()
  configuration () {
    return {
      ssl: this.config.data.ssl,
      ...this.config.data.general,
    };
  }

  @exSigInt()
  @exSigTerm()
  gracefulShutdown(server, signal) {
    if (signal) {
      console.log(`\nReceived signal ${signal}`);
    }

    console.log('Gracefully closing http server');

    server.closeAllConnections();

    this.db.close()
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
          });
        } catch (err) {
          console.error('There was an error', err);
          setTimeout(() => process.exit(1), 500);
        }
      });
  }

}
