import express from 'express';
import fs from 'fs';
import https from 'https';
import http from 'http';

export function Server({ port, listeners = [] }) {
  return function <T extends { new(...args: any[]): {} }>(constructor: T) {
    const app = express();

    (constructor.prototype._bindings || []).reverse().forEach(bind => {
      switch(bind.method) {
        case 'use' : app.use(bind.obj);
          break;
        case 'set' : app.set(bind.args[0], bind.args[1]);
          break;
        case 'get' : app.get(bind.path, bind.fn);
          break;
        case 'post' : app.post(bind.path, bind.fn);
          break;
      }
    });

    return class extends constructor {
      private _express = app;
      private _port = port;

      public _listen(config) {
        const server = config.general.useHttps
          ? this.createServer(this._express, config)
          : http.createServer(this._express);

        server.listen(this._port || config.general.port, () => {
          console.log('Serwer listen on port: ', config.general.port);
          console.log('Is https used: ', config.general.useHttps);
        });

        const SIGINT = (constructor.prototype._bindings || []).find(binding => binding.method === 'SIGINT');
        if (SIGINT) {
          process.on('SIGINT', (signal) => SIGINT.fn.apply(this, [server, signal]));
        }

        const SIGTERM = (constructor.prototype._bindings || []).find(binding => binding.method === 'SIGTERM');
        if (SIGTERM) {
          process.on('SIGTERM', (signal) => SIGTERM.fn.apply(this, [server, signal]));
        }
      }

      private createServer(app, config) {
        const privateKey  = fs.readFileSync(config.ssl.privateKey, 'utf8');
        const certificate = fs.readFileSync(config.ssl.certificate, 'utf8');
        const credentials = { key: privateKey, cert: certificate };
        return https.createServer(credentials, app);
      }
    };
  };
}

export function Listeners({ port, listeners = [] }) {
  return function (constructor) {
    constructor.prototype._bindings = (constructor.prototype._bindings || []).reverse();
  };
}

export function AddListener(listener) {
  return function (constructor) {
    console.log('AddListener', listener, listener.prototype, listener.prototype._bindings);
    constructor.prototype._bindings = constructor.prototype._bindings || [];
    constructor.prototype._bindings.push(...listener.prototype._bindings);
  };
}

export function SigInt() {
  return function (target, propertyKey, descriptor) {
    target._bindings = target._bindings || [];
    target._bindings.push({
      method: 'SIGINT',
      fn: descriptor.value,
    });
  };
}

export function SigTerm() {
  return function (target, propertyKey, descriptor) {
    target._bindings = target._bindings || [];
    target._bindings.push({
      method: 'SIGTERM',
      fn: descriptor.value,
    });
  };
}

export function Use(obj) {
  return function (constructor) {
    constructor.prototype._bindings = constructor.prototype._bindings || []
    constructor.prototype._bindings.push({
      method: 'use',
      obj,
    });
  };
}

export function Set(...args) {
  return function (constructor) {
    constructor.prototype._bindings = constructor.prototype._bindings || []
    constructor.prototype._bindings.push({
      method: 'set',
      args,
    });
  };
}

export function All(path) {
  return function (target, propertyKey, descriptor) {
    target._bindings = target._bindings || [];
    target._bindings.push({
      method: 'all',
      path,
      fn: descriptor.value,
    })
  };
}

export function Get(path) {
  return function (target, propertyKey, descriptor) {
    target._bindings = target._bindings || [];
    target._bindings.push({
      method: 'get',
      path,
      fn: descriptor.value,
    })
  };
}

export function Post(path) {
  return function (target, propertyKey, descriptor) {
    target._bindings = target._bindings || [];
    target._bindings.push({
      method: 'post',
      path,
      fn: descriptor.value,
    })
  };
}

export function AddService(service) {
  return function (constructor) {
    constructor.prototype._servicesMeta = constructor.prototype._servicesMeta || [];
    if (service._serviceName) {
      constructor.prototype._servicesMeta = [ service, ...constructor.prototype._servicesMeta ];
    }
  };
}

export function UseServer(server) {
  return function (constructor) {
    constructor.prototype._rootServer = server;
  };
}

export function Service({ name }) {
  return function <T extends { new(...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      public static _serviceName = name;
    };
  };
}

export function Init() {
  return function (target, propertyKey, descriptor) {
    target._bindings = target._bindings || [];
    target._bindings.push({
      method: '_init',
      fn: descriptor.value,
    })
  };
}

export function Boot() {
  return function <T extends { new(...args: any[]): {} }>(constructor: T) {
    const services = (constructor.prototype._servicesMeta || []).reduce((acc, curr) => {
      const service = new curr(...(curr._inject || []).map(name => acc[name]));
      const init = (curr.prototype._bindings || []).find(binding => binding.method === '_init');
      if (init) {
        init.fn.apply(service);
      }
      return { ...acc, [curr._serviceName]: service}
    }, {});
    return class extends constructor {
      public static _services = services;
      public async _run() {
        const ctor = constructor.prototype._rootServer;
        if (ctor) {
          const server = new ctor(...(ctor._inject || []).map(name => services[name]));
          const init = (ctor.prototype._bindings || []).find(binding => binding.method === '_init');
          if (init) {
            await init.fn.apply(server);
          }

          await server._listen(server.config.data);
        }
      }
    };
  };
}

export function boot(module) {
  return new module()._run();
}