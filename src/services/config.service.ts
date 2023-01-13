import fs from 'fs';
import { exInit, exInjectable } from '../decorators/general';
import defaultConfig from '../config';

export let config = defaultConfig;

@exInjectable({ name: 'configService' })
export class ConfigService {
  public data = defaultConfig;

  @exInit()
  init() {
    console.info('Loading configuration');
    try {
      config = JSON.parse(fs.readFileSync(process.env.SERVER_CONFIGJS, 'utf8'));
      console.info('Configuration loaded form:', process.env.SERVER_CONFIGJS);
    } catch (e) {
      console.info('Default configuration loaded');
    }
  }
}
