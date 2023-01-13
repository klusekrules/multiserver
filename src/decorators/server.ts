import express from 'express';
import fs from 'fs';
import https from 'https';
import http from 'http';

export function exServer() {
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  return function <T extends { new(...args: any[]): object }>(constructor: T) {
    return class extends constructor {
      private _express = express();

      constructor(...args) {
        super(...args.slice(1));
        const _services = args[0];

        (constructor.prototype._bindings || []).reverse()
          .forEach(bind => {
            const ctx = bind._context ? _services.find(bind._context) : this;
            switch (bind.method) {
            case 'use' : {
              const arg = ctx ? bind._fn.apply(ctx) : bind._fn();
              this._express.use(arg);
              console.log('Binding', bind.method, arg);
              break;
            }
            case 'set' : {
              const args = ctx ? bind._fn.apply(ctx) : bind._fn();
              this._express.set(args[0], args[1]);
              console.log('Binding', bind.method,  ctx ? bind._fn.apply(ctx) : bind._fn());
              break;
            }
            case 'get' : this._express.get(bind.path, (...args) => ctx ? bind._fn.apply(ctx, args) : bind._fn(args));
              console.log('Binding', bind.method, bind.path);
              break;
            case 'patch' : this._express.patch(bind.path, (...args) => ctx ? bind._fn.apply(ctx, args) : bind._fn(args));
              console.log('Binding', bind.method, bind.path);
              break;
            case 'put' : this._express.put(bind.path, (...args) => ctx ? bind._fn.apply(ctx, args) : bind._fn(args));
              console.log('Binding', bind.method, bind.path);
              break;
            case 'delete' : this._express.delete(bind.path, (...args) => ctx ? bind._fn.apply(ctx, args) : bind._fn(args));
              console.log('Binding', bind.method, bind.path);
              break;
            case 'post' : this._express.post(bind.path, (...args) => ctx ? bind._fn.apply(ctx, args) : bind._fn(args));
              console.log('Binding', bind.method, bind.path);
              break;
            case 'all' : this._express.all(bind.path, (...args) => ctx ? bind._fn.apply(ctx, args) : bind._fn(args));
              console.log('Binding', bind.method, bind.path);
              break;
            default:
              console.log('Omnited Binding', bind.method);
              break;
            }
          });
      }

      public _listen() {
        const options = constructor.prototype._exConfig ? constructor.prototype._exConfig.apply(this) : {};
        const server = options.useHttps
          ? this.createServer(this._express, options)
          : http.createServer(this._express);

        server.listen(options.port, () => {
          console.log('exServer listen on port: ', options.port);
          console.log('Is https used: ', options.useHttps);
        });

        if (constructor.prototype._exSigInt) {
          process.on('SIGINT', (signal) => constructor.prototype._exSigInt.apply(this, [server, signal]));
        }

        if (constructor.prototype._exSigTerm) {
          process.on('SIGTERM', (signal) => constructor.prototype._exSigTerm.apply(this, [server, signal]));
        }
      }

      private createServer(app, options) {
        const privateKey  = fs.readFileSync(options.ssl.privateKey, 'utf8');
        const certificate = fs.readFileSync(options.ssl.certificate, 'utf8');
        const credentials = { key: privateKey, cert: certificate };
        return https.createServer(credentials, app);
      }
    };
  };
}

export function exBind({ method }) {
  return function (target, propertyKey, descriptor) {
    target._bindings = target._bindings || [];
    target._bindings.push({ method, _fn: descriptor.value });
  };
}

export function exConfig() {
  return function (target, propertyKey, descriptor) {
    target._exConfig = descriptor.value;
  };
}

export function exSigInt() {
  return function (target, propertyKey, descriptor) {
    target._exSigInt = descriptor.value;
  };
}

export function exSigTerm() {
  return function (target, propertyKey, descriptor) {
    target._exSigTerm = descriptor.value;
  };
}
