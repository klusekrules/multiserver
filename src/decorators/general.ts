export function exInit() {
  return function (target, propertyKey, descriptor) {
    target._init = descriptor.value;
  };
}

export function exInjectable({ name }) {
  return function (constructor) {
    constructor.prototype._bindings = (constructor.prototype._bindings || []).reverse().map(binding => ({ ...binding, _context: name }));
    constructor.prototype._name = name;
  };
}

export function exUse(injectable) {
  return function (constructor) {
    constructor.prototype._bindings = constructor.prototype._bindings || [];
    constructor.prototype._bindings.push(...injectable.prototype._bindings);
  };
}

export function exAdd(injectable) {
  return function (constructor) {
    constructor.prototype._injectables = constructor.prototype._injectables || [];
    if (injectable.prototype._name) {
      constructor.prototype._injectables = [ injectable, ...constructor.prototype._injectables ];
    }
  };
}