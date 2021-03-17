importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

let CACHE_STATIC_NAME = 'static-v43';
let CACHE_DYNAMIC_NAME = 'dynamic-v9';
let STATIC_FILES = [
    '/',
    '/index.html',
    '/offline.html',
    '/src/js/app.js',
    '/src/js/feed.js',
    '/src/js/utility.js',
    '/src/js/idb.js',
    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
    '/src/js/material.min.js',
    '/src/images/main-image.jpg',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://fonts.googleapis.com/css?family=Roboto:400,700',
    '/src/css/app.css',
    '/src/css/feed.css',
    '/src/css/help.css',
];

function isInArray(string, array) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === string) {
            return true;
        }
    }
}

// cache has limitation (delete cache from first)
/*function trimCache(cacheName, maxItem) {
    caches.open(cacheName)
        .then(function (cache) {
            return cache.keys()
                .then(function (keys) {
                    if (keys.length > maxItem) {
                        cache.delete(keys[0])
                            .then(trimCache(cacheName, maxItem))
                    }
                })
        })
}*/

// add event listener for sw installing
self.addEventListener('install', function (event) {
    // add static(core files) and pre cache here
    event.waitUntil(
        // create new cache if available just add to it
        caches.open(CACHE_STATIC_NAME).then(
            function (cache) {
                console.log('service worker pre caching app shell');
                cache.addAll(STATIC_FILES);
            }
        )
    )
});

// add event listener for sw activating
self.addEventListener('activate', function (event) {
    console.log('activating service worker', event);
//remove old cache
    event.waitUntil(
        caches.keys()
            .then(function (keyList) {
                return Promise.all(keyList.map(function (key) {
                    if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
                        console.log('[Service Worker] Removing old cache.', key);
                        return caches.delete(key);
                    }
                }));
            })
    );
    return self.clients.claim();
});
// add event listener on fetching ( dynamic caching : add every thing that requested to cache storage )
/*self.addEventListener('fetch', function (event) {
    // console.log('fetching', event);
    event.respondWith(
        //get items from cache if available
        caches.match(event.request).then(
            function (response) {
                if (response) {
                    return response
                } else {
                    // dynamic caching add every thing to cache when used in internet connection
                    return fetch(event.request)
                        .then(function (res) {
                            return caches.open(CACHE_DYNAMIC_NAME).then(function (cache) {
                                cache.put(event.request.url, res.clone());
                                return res;
                            })
                        })
                        // for error handling and dont show errors
                        .catch(function () {
                            return caches.open(CACHE_STATIC_NAME)
                                .then(function (cache) {
                                    return cache.match('/offline.html') // if any request not reach able shoe this page
                                })
                        })
                }
            }
        )
    )
});*/

// first cache then network( use cache file but update it if net is available)
self.addEventListener('fetch', function (event) {
    var url = 'https://pwagram-b0804.firebaseio.com/posts';

    // use different strategy for a request
    if (event.request.url.indexOf(url) > -1) {
        event.respondWith(fetch(event.request)
            .then(function (res) {
                var cloneRes = res.clone();
                clearAllData('posts')
                    .then(function () {
                        return cloneRes.json()
                    })
                    .then(function (data) {
                        for (var key in data) {
                            writeData('posts', data[key]);
                        }
                    });
                return res;
            })
        )
    }
    // if user request static files -> use cache only strategy
    else if (isInArray(event.request.url, STATIC_FILES)) {
        event.respondWith(caches.match(event.request));
    } else {
        // use other strategy for caching
        event.respondWith(
            //get items from cache if available
            caches.match(event.request).then(
                function (response) {
                    if (response) {
                        return response
                    } else {
                        // dynamic caching add every thing to cache when used in internet connection
                        return fetch(event.request)
                            .then(function (res) {
                                return caches.open(CACHE_DYNAMIC_NAME).then(function (cache) {
                                    // trimCache(CACHE_DYNAMIC_NAME, 3);
                                    cache.put(event.request.url, res.clone());
                                    return res;
                                })
                            })
                            // for error handling and dont show errors
                            .catch(function () {
                                return caches.open(CACHE_STATIC_NAME)
                                    .then(function (cache) {
                                        if (event.request.headers.get('accept').includes('text/html')) {
                                            return cache.match('/offline.html') // if any request not reach able shoe this page
                                        }
                                    })
                            })
                    }
                }
            )
        )
    }

});

// when user connected to internet
// send all request that user sent in offline mode
self.addEventListener('sync', function (event) {
    console.log('sw background syncing');
    if (event.tag === 'sync-new-posts') {
        console.log('sw -> syncing new posts');
        event.waitUntil(
            readAllData('sync-posts')
                .then(function (data) {
                    // loop throw each item for sending data
                    for (let dt of data) {
                        var postData = new FormData();
                        postData.append('id', dt.id);
                        postData.append('title', dt.title);
                        postData.append('location', dt.location);
                        postData.append('file', dt.picture, dt.id + '.png'); //replace image name with id.png

                        fetch('https://us-central1-pwagram-b0804.cloudfunctions.net/storePostData', {
                            method: 'POST',
                            body: postData
                        })
                            .then(function (res) {
                                console.log('Sent Data' + res);
                                // remove synced item
                                if (res.ok) {
                                    res.json()
                                        .then(function (resData) {
                                            deleteItem('sync-posts', resData.id)
                                        });
                                }
                            })
                    }
                })
        )
    }
});


self.addEventListener('notificationclick', function (event) {
    var notification = event.notification;
    var action = event.action;
    console.log(notification);

    if (action === 'confirm') {
        console.log('Confirm was chosen');
        notification.close();
    } else {
        console.log(action);
        event.waitUntil(
            clients.matchAll()
                .then(function (clis) {
                    var client = clis.find(function (c) {
                        return c.visibilityState === 'visible' // visible = we have open browser basically
                    });

                    if (client !== undefined) {
                        client.navigate(notification.data.url); // open the URL
                        client.focus();
                    } else {
                        client.openWindow(notification.data.url); // open the URL
                    }
                    notification.close();
                })
        );
    }
});


self.addEventListener('notificationclose', function (event) {
    console.log('notification is closed ! :(', event);
});

self.addEventListener('push', function (event) {
    console.log('push notification is received! :)', event);

    var data = { // fallback for data if n o data send
        title: 'NEW !!!',
        content: 'Something cool is happened',
        openUrl: '/'
    };
    if (event.data) {
        data = JSON.parse(event.data.text())
    }
    var options = {
        body: data.content,
        icon: '/src/images/icons/app-icon-96x96.png',
        badge: '/src/images/icons/app-icon-96x96.png',
        data: {
            url: data.openUrl
        }
    };
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    )
});







