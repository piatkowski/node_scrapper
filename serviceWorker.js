// serviceWorker to get Push notifications and postMessage to Web App

let token = '';

self.addEventListener("push", event => {
    const data = event.data.json();
    event.waitUntil(
        self.registration.showNotification(
            "Push Title"
        )
    );

    event.waitUntil((async () => {
        const clientList = await clients.matchAll({type: "window"});
        for (let client of clientList) {
            client.postMessage({
                msg: 'update',
                data: data
            });
        }
    })());
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(clients.matchAll({
        type: "window"
    }).then((clientList) => {
        for (const client of clientList) {
            if (client.url === '/' && 'focus' in client)
                return client.focus();
        }
        if (clients.openWindow)
            return clients.openWindow('/');
    }));
});

self.addEventListener('pushsubscriptionchange', function (event) {
    const subscription = self.registration.pushManager
        .subscribe(event.oldSubscription.options)
        .then((subscription) => {
            (async () => {
                const clientList = await clients.matchAll({type: "window"});
                for (let client of clientList) {
                    client.postMessage({
                        msg: 'subscribe',
                        data: event.newSubscription
                    });
                }
            })();
        });

    event.waitUntil(subscription);
});
