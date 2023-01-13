export function exUseServer(server) {
  return function (constructor) {
    constructor.prototype._rootServer = server;
  };
}

export function exBoot() {
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  return function <T extends { new(...args: any[]): object }>(constructor: T) {
    return class extends constructor {
      _services: Services = undefined;
      async _run() {
        const services = await this.processServices(constructor.prototype._injectables);
        this._services = new Services(services);

        const ctor = constructor.prototype._rootServer;
        if (ctor) {
          const server = new ctor(this._services, ...(ctor._inject || []).map(name => services[name]));

          if (ctor.prototype._init) {
            await ctor.prototype._init.apply(server);
          }

          await server._listen();
        }
      }

      private async processServices(servicesMeta) {
        const services = {};
        const _injectables = (servicesMeta || []);

        for (let i = 0; i < _injectables.length; i++) {
          const metadata = _injectables[i];
          const inject = (metadata._inject || []).map(name => services[name]);
          const service = new metadata(...inject);
          if (metadata.prototype._init) {
            await metadata.prototype._init.apply(service);
          }
          services[metadata.prototype._name] = service;
        }

        return services;
      }
    };
  };
}

class Services {
  private _services: object;

  constructor(services: object) {
    this._services = services;
  }

  find(name) {
    return this._services[name];
  }
}

export function boot(module) {
  return new module()._run();
}
