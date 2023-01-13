export function exAll(path) {
  return function (target, propertyKey, descriptor) {
    target._bindings = target._bindings || [];
    target._bindings.push({
      method: 'all',
      path,
      _fn: descriptor.value,
    });
  };
}

export function exPatch(path) {
  return function (target, propertyKey, descriptor) {
    target._bindings = target._bindings || [];
    target._bindings.push({
      method: 'patch',
      path,
      _fn: descriptor.value,
    });
  };
}

export function exPut(path) {
  return function (target, propertyKey, descriptor) {
    target._bindings = target._bindings || [];
    target._bindings.push({
      method: 'put',
      path,
      _fn: descriptor.value,
    });
  };
}

export function exDelete(path) {
  return function (target, propertyKey, descriptor) {
    target._bindings = target._bindings || [];
    target._bindings.push({
      method: 'delete',
      path,
      _fn: descriptor.value,
    });
  };
}

export function exGet(path) {
  return function (target, propertyKey, descriptor) {
    target._bindings = target._bindings || [];
    target._bindings.push({
      method: 'get',
      path,
      _fn: descriptor.value,
    });
  };
}

export function exPost(path) {
  return function (target, propertyKey, descriptor) {
    target._bindings = target._bindings || [];
    target._bindings.push({
      method: 'post',
      path,
      _fn: descriptor.value,
    });
  };
}
