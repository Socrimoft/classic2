const VERSION = "current"
const PRECACHE = `precache-${VERSION}`;
const RUNTIME = 'runtime';

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
    "/index.html",
    "/favicon.ico",
    "/intel.css",
    "/assets/fonts/WorldOfSpell.ttf",
    "/assets/images/background.jpg",
    "assets/images/bird/skybox/_px.jpg",
    "assets/images/bird/skybox/_nx.jpg",
    "assets/images/bird/skybox/_py.jpg",
    "assets/images/bird/skybox/_ny.jpg",
    "assets/images/bird/skybox/_pz.jpg",
    "assets/images/bird/skybox/_nz.jpg",
    "assets/images/rush/skybox/_px.jpg",
    "assets/images/rush/skybox/_nx.jpg",
    "assets/images/rush/skybox/_py.jpg",
    "assets/images/rush/skybox/_ny.jpg",
    "assets/images/rush/skybox/_pz.jpg",
    "assets/images/rush/skybox/_nz.jpg",
    "/assets/images/github.png",
    "/assets/models/kerby.glb",
    "/assets/models/koomba.glb",

];

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', (/**@type {import("@cloudflare/workers-types/experimental").ExtendableEvent}*/event) => {
    event.waitUntil(caches.open(PRECACHE)
        .then(cache => cache.addAll(PRECACHE_URLS))
        .then(self.skipWaiting())
    );
})

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', (/**@type {import("@cloudflare/workers-types/experimental").ExtendableEvent}*/event) => {
    const currentCaches = [PRECACHE];
    event.waitUntil(caches.keys().then(cacheNames =>
        cacheNames.filter(cacheName => !currentCaches.includes(cacheName)))
        .then(cachesToDelete => Promise.all(cachesToDelete.map(cacheToDelete =>
            caches.delete(cacheToDelete))))
        .then(() => self.clients.claim()));
    console.log("Service Worker activated, version " + VERSION)
})

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener('fetch', (/** @type {import("@cloudflare/workers-types/experimental").FetchEvent} */event) => {
    if (event.request.method !== "GET") return;
    // Prevent the default, and handle the request ourselves.
    event.respondWith(caches.match(event.request)
        .then((r) => r ?? fetch(event.request))
        .then((res) => {
            caches.open(RUNTIME).then((cache) => {
                cache.put(event.request, res);
            });
            return res.clone();
        }).catch(() => new Response("Failed to fetch", { status: -1 })))
})

self.addEventListener('message', (event) => {
    if (event.data === "clear") {
        caches.keys().then(cacheNames => {
            return Promise.all(cacheNames.map(cacheName => {
                return caches.delete(cacheName);
            }));
        }).then(() => console.log("cacheclear"), console.error);
    }
})