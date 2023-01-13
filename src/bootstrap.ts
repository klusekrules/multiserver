
import { SecurityListener } from './listeners/security.listener';
import { DatabaseService } from './services/database.service';
import { ConfigService } from './services/config.service';
import { exBoot, exUseServer } from './decorators/boot';
import { WebSerwer } from './web.server';
import { RepoListener } from './listeners/repo.listener';
import { Middlewares } from './middlewares/middlewares';
import { exAdd } from './decorators/general';

@exBoot()
@exAdd(ConfigService)
@exAdd(DatabaseService)
@exAdd(Middlewares)
@exAdd(SecurityListener)
@exAdd(RepoListener)
@exUseServer(WebSerwer)
export class Bootstrap {}
