let defferdPrompt;
var enableNotificationButtons = document.querySelectorAll('.enable-notifications');

function displayConfirmNotification() {

    if ('serviceWorker' in navigator) {
        var options = {
            body: 'wow', // description
            icon: '/src/images/icons/app-icon-96x96.png', // logo
            image: '/src/images/sf-boat.jpg', // image that parts of content
            dir: 'ltr',

            lang: 'en-US',
            vibrate: [100, 50, 200], // vibrate for notification vibrate 100 milisecond then 50 miliseconds no vibrate again 200 mili seconds vibrate
            badge: '/src/images/icons/app-icon-96x96.png', // app icon thar show in status bar in mobile device
            tag: 'confirm-notification', // it acts like id if you recieve two notif with same tag last one is replaced
            renotify: true, // true = new notification notify user or not
            actions: [
                {
                    action: 'confirm',
                    title: 'ok',
                    icon: '/src/images/icons/app-icon-96x96.png'
                },
                {
                    action: 'cancel',
                    title: 'Cancel',
                    icon: '/src/images/icons/app-icon-96x96.png'
                }
            ],
        };

        navigator.serviceWorker.ready
            .then(function (swreg) {
                swreg.showNotification('successfully subscribed !', options)
            })
    }
}

function configurePushSub() {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    var reg;
    navigator.serviceWorker.ready
        .then(function (swreg) {
            reg = swreg;
            return swreg.pushManager.getSubscription();
        })
        .then(function (sub) {
            if (sub === null) {
                // create new subscription
                var vapidPublicKeys = 'BF7_aaPjZ_yw601MTqTVjt3LOA90yNOBwumiB0_kLYAvpJyuiP7o_1_bqpbZ-P1DlkmQdvDepYInLVN76Y-wZ-I'; // get this by running npm run push generate vapid keys
                var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKeys);
                return reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidPublicKey,
                });
            } else {
                // use subscription
            }
        })
        .then(function (newSub) {
            console.log(newSub);
            return fetch('https://pwagram-b0804.firebaseio.com/subscriptions.json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(newSub),
            })
        })
        .then(function (res) {
            console.log('res', res);
            if (res.ok) {
                displayConfirmNotification();
            }
        })
        .catch(function (err) {
            console.log(err);
        })
}

function askForNotificationPermisson() {
    Notification.requestPermission(function (result) {
        console.log('user choice' + result);
        if (result !== 'granted') {
            console.log('no notification permisson is granted');

            if ('serviceWorker' in navigator) {
                var options = {
                    body: 'wow', // description
                    icon: '/src/images/icons/app-icon-96x96.png', // logo
                    image: '/src/images/sf-boat.jpg', // image that parts of content
                    dir: 'ltr',

                    lang: 'en-US',
                    vibrate: [100, 50, 200], // vibrate for notification vibrate 100 milisecond then 50 miliseconds no vibrate again 200 mili seconds vibrate
                    badge: '/src/images/icons/app-icon-96x96.png', // app icon thar show in status bar in mobile device
                    tag: 'confirm-notification', // it acts like id if you recieve two notif with same tag last one is replaced
                    renotify: true, // true = new notification notify user or not
                    actions: [
                        {
                            action: 'confirm',
                            title: 'ok',
                            icon: '/src/images/icons/app-icon-96x96.png'
                        },
                        {
                            action: 'cancel',
                            title: 'Cancel',
                            icon: '/src/images/icons/app-icon-96x96.png'
                        }
                    ],
                };

                navigator.serviceWorker.ready
                    .then(function (swreg) {
                        swreg.showNotification('successfully subscribed !', options)
                    })
            }
        } else {
            // you can hide button after get permission
            // displayConfirmNotification();
            configurePushSub();
        }
    })
}

if ('Notification' in window && 'serviceWorker' in navigator) {
    for (let i = 0; i < enableNotificationButtons.length; i++) {
        console.log(enableNotificationButtons);
        enableNotificationButtons[i].style.display = 'inline-block';
        enableNotificationButtons[i].addEventListener('click', askForNotificationPermisson);
    }
}
if (!window.Promise) {
    window.Promise = Promise();
}
//register sw if supported in browser
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service_worker.js')
        .then(function () {
            // do something on ws registered
            console.log('service worker registerd');
        })
        .catch(function (err) {
            console.log(err);
        })
}

// prevent show default install banner ( show on plus button click)
window.addEventListener('beforeinstallprompt', function (event) {
    console.log('before install prompt');
    event.preventDefault();
    defferdPrompt = event;
    return false;
});