// Web App Client - update push subscription, register service worker


const publicVapidKey = '________________________';

function updateSubscription(subscription) {
    fetch("https://_______________/subscribe", {
        mode: 'cors',
        method: "POST",
        body: JSON.stringify({
            subscription: subscription,
            token: localStorage.getItem('appToken')
        }),
        headers: {
            "content-type": "application/json"
        }
    })
}

function registerWorker() {
    if (localStorage.getItem('appToken') && 'serviceWorker' in navigator) {
        send().catch(err => console.error(err));
        updateUI();
        navigator.serviceWorker.addEventListener('message', (event) => {
            console.log('Message recieved', event);
            if(event.data.msg === 'subscribe') {
                updateSubscription(event.data.data);
            }
        });
    }
}

function send() {
    return navigator.serviceWorker.register('/serviceWorker.js', {
        scope: '/'
    }).then(function (register) {
        var serviceWorker;
        if (register.installing) {
            serviceWorker = register.installing;
        } else if (register.waiting) {
            serviceWorker = register.waiting;
        } else if (register.active) {
            serviceWorker = register.active;
        }
        if (serviceWorker) {
            if (serviceWorker.state === "activated") {
                //...
            }
            serviceWorker.addEventListener("statechange", function(e) {
                if (e.target.state === "activated") {
                    register.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
                    }).then(function (subscription) {
                        updateSubscription(subscription);
                    });
                }
            });
        }
    });
}
