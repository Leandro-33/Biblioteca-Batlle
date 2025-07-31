const { EventEmitter } = require('events');
sw = require('./sw.js');

// sw.test.js

describe('Service Worker', () => {
    let sw;
    let cachesMock;
    let clientsMock;

    beforeEach(() => {
        // Mock global objects
        global.self = new EventEmitter();
        global.clients = { claim: jest.fn() };
        global.caches = {
            open: jest.fn(),
        };

        // Require the service worker file after mocks
        jest.resetModules();
    });

    test('should call skipWaiting on install', () => {
        global.self.skipWaiting = jest.fn();
        global.self.emit('install', {});
        expect(global.self.skipWaiting).toHaveBeenCalled();
    });

    test('should call clients.claim on activate', () => {
        global.self.emit('activate', {});
        expect(global.clients.claim).toHaveBeenCalled();
    });

    test('should respond with cached response if available', async () => {
        const request = { method: 'GET', url: '/test' };
        const cachedResponse = { ok: true };
        const cache = {
            match: jest.fn().mockResolvedValue(cachedResponse),
            put: jest.fn(),
        };
        global.caches.open.mockResolvedValue(cache);

        const event = {
            request,
            respondWith: jest.fn(fn => fn),
        };

        await global.self.emit('fetch', event);
        expect(cache.match).toHaveBeenCalledWith(request);
        expect(event.respondWith).toBeCalled();
    });

    test('should fetch and cache if not in cache', async () => {
        const request = { method: 'GET', url: '/test' };
        const networkResponse = { ok: true, clone: jest.fn(() => networkResponse) };
        const cache = {
            match: jest.fn().mockResolvedValue(undefined),
            put: jest.fn(),
        };
        global.caches.open.mockResolvedValue(cache);

        global.fetch = jest.fn().mockResolvedValue(networkResponse);

        const event = {
            request,
            respondWith: jest.fn(fn => fn),
        };

        await global.self.emit('fetch', event);
        expect(global.fetch).toHaveBeenCalledWith(request);
        expect(cache.put).toHaveBeenCalledWith(request, networkResponse);
    });

    test('should not cache non-GET requests', async () => {
        const request = { method: 'POST', url: '/test' };
        const networkResponse = { ok: true, clone: jest.fn(() => networkResponse) };
        const cache = {
            match: jest.fn().mockResolvedValue(undefined),
            put: jest.fn(),
        };
        global.caches.open.mockResolvedValue(cache);

        global.fetch = jest.fn().mockResolvedValue(networkResponse);

        const event = {
            request,
            respondWith: jest.fn(fn => fn),
        };

        await global.self.emit('fetch', event);
        expect(cache.put).not.toHaveBeenCalled();
    });
});