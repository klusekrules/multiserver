import express from 'express';

export function Server({ port }) {
    return function<T extends { new (...args: any[]): {} }>(constructor: T)  {
        console.log("Server function", constructor.prototype._bindings);
        return class extends constructor {
            private _express = express();
            private _port = port;
        };
    };
}

export function Use(obj) {
    return function(constructor)  {
        constructor.prototype._bindings = constructor.prototype._bindings || []
        constructor.prototype._bindings.push({
            method: 'use',
            obj,
        });
    };
}

export function Set(...args) {
    return function(constructor)  {
        constructor.prototype._bindings = constructor.prototype._bindings || []
        constructor.prototype._bindings.push({
            method: 'set',
            args,
        });
    };
}

export function All(path) {
    return function(target, propertyKey, descriptor)  {
        target._bindings = target._bindings || [];
        target._bindings.push({
            method: 'all',
            path,
            fn: descriptor.value,
        })
    };
}

export function Get(path) {
    return function(target, propertyKey, descriptor)  {
        target._bindings = target._bindings || [];
        target._bindings.push({
            method: 'get',
            path,
            fn: descriptor.value,
        })
    };
}

export function Post(path) {
    return function(target, propertyKey, descriptor)  {
        target._bindings = target._bindings || [];
        target._bindings.push({
            method: 'post',
            path,
            fn: descriptor.value,
        })
    };
}
