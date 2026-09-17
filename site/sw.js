// Prioridis - eenvoudige service worker voor offline gebruik.
// Bewaart de app-schil zodat Prioridis ook zonder internetverbinding opent.
// Je eigen gegevens (taken, categorieen, foto) staan hier los van, in localStorage.

var CACHE_NAME = "priodis-cache-v1";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-180.png",
  "./icon-32.png",
  "./icon-16.png"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(
        names.filter(function(name){ return name !== CACHE_NAME; })
             .map(function(name){ return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

// Netwerk eerst, zodat je altijd de nieuwste versie krijgt zolang je online bent.
// Alleen bij geen verbinding valt de app terug op de bewaarde versie.
self.addEventListener("fetch", function(event){
  if(event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then(function(response){
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        return response;
      })
      .catch(function(){ return caches.match(event.request); })
  );
});
