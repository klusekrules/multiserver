import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import session from 'express-session';
import path from 'path';
import cors from 'cors';
import express from 'express';
import { exInjectable } from '../decorators/general';
import { exBind } from '../decorators/server';
import { ConfigService } from '../services/config.service';

@exInjectable({ name: 'middlewares' })
export class Middlewares {
  static readonly _inject: string[] = ['configService'];

  constructor(private config: ConfigService) { }

  @exBind({method: 'use'})
  staticFiles() {
    return express.static('ui');
  }

  @exBind({method: 'use'})
  urlEncoded() {
    return express.urlencoded({ extended: false });
  }

  @exBind({method: 'use'})
  cors() {
    return cors(this.config.data.cors);
  }

  @exBind({method: 'use'})
  session() {
    return session(this.config.data.session);
  }

  @exBind({method: 'use'})
  cookieParser() {
    return cookieParser();
  }

  @exBind({method: 'use'})
  bodyParser() {
    return bodyParser.json();
  }

  @exBind({method: 'set'})
  setViewEngine() {
    return ['view engine', 'pug'];
  }

  @exBind({method: 'set'})
  setViewsPath() {
    return ['views', path.join(__dirname, '..//src//views')];
  }
}