const db = require('./db');
const scrapper = require('./scrappers/base');
const endpoints = require('./endpoints');
const express = require('express');
const cors = require('cors');
const app = express();
const webpush = require('web-push');
const bodyParser = require('body-parser');
const axios = require("axios");
const cheerio = require("cheerio");

app.use(bodyParser.json());
app.use(cors());
const port = 4010;

const corsOptions = {
    "origin": "https://___________",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": true,
    "optionsSuccessStatus": 200
};

const vapid = {
    pub: '___________',
    prv: '___________'
};

webpush.setVapidDetails(
    '___________',
    vapid.pub,
    vapid.prv
);

let lastLinkId = 0;

// Scrapper

const getLastLinkId = (callback) => {
    const query = 'SELECT id FROM node_urls ORDER BY id DESC limit 1';
    const dbConnection = db.createConnection();
    dbConnection.query(query, (err, result) => {
        callback(result[0].id);
        dbConnection.end();
    });
}

const fastQuery = (query, params, callback) => {
    const dbConnection = db.createConnection();
    dbConnection.query(query, params, (err, result) => {
        if (err) {
            console.error('fastQuery', err);
        }
        callback(result);
        dbConnection.end();
    });
}

const sendPush = (msg) => {
    fastQuery("SELECT push_subscription FROM subscriptions WHERE push_subscription != ''", [], function (result) {
        if (result && result.length > 0) {
            result.map(function (row) {
                try {
                    const payload = JSON.stringify(msg);
                    webpush.sendNotification(JSON.parse(row.push_subscription), payload).catch(err => console.error(err));
                } catch (e) {
                    console.error(e);
                }
            });
        }
    });
};

const checkToken = (token, callback) => {
    fastQuery("SELECT id, push_subscription FROM subscriptions WHERE api_token = ?", [token], result => {
        if (result.length !== 0) {
            try {
                callback(true, JSON.parse(result[0].push_subscription));
            } catch (e) {
                callback(true, '');
            }
        } else {
            callback(false, '');
        }
    })
}

const updateSubscription = (token, subscription) => {
    fastQuery("UPDATE subscriptions SET push_subscription = ? WHERE api_token = ? LIMIT 1", [JSON.stringify(subscription), token], function (result) {
        //...
    });
}


const main = async () => {
    const now = new Date();
    const isNight = now.getHours() >= 0 && now.getHours() < 4;
    if (!endpoints.isUpdating() && !scrapper.isUpdating() && !isNight) {
        const resultLinks = await Promise.all(endpoints.get().map(async endpoint => {
            return await scrapper.fetch(endpoint);
        }));
        let uniqueResults = [...new Set(resultLinks.flat())];
        if (uniqueResults.length > 0) {
            const query = 'INSERT IGNORE INTO node_urls (url) VALUES ("' + uniqueResults.join('"),("') + '")';
            const dbConnection = await db.createConnection();
            dbConnection.query(query, (err, result) => {
                dbConnection.end();
                getLastLinkId((id) => {
                    if (id > lastLinkId) {
                        sendPush({
                            msg: 'new-links',
                            lastId: lastLinkId,
                            currentId: id
                        });
                    }
                    lastLinkId = id;
                });
            });
        }
    }
}


try {
    endpoints.init().then(() => {
        console.log('Endpoints updated. Starting....');
        getLastLinkId((id) => {
            lastLinkId = id;
            main().then(() => {
                setInterval(main, 1000 * 60);
            });
        });
    })
} catch (e) {
    console.log(e);
}


// Push Server

app.options('*', cors(corsOptions));

app.get('/', cors(corsOptions), (req, res) => {
    res.json({status: 'ok'})
})

app.get('/sendTestPush', cors(corsOptions), (req, res) => {
    fastQuery("SELECT push_subscription FROM subscriptions WHERE push_subscription != '' AND api_token = 'test'", [], function (result) {
        if (result && result.length > 0) {
            result.map(function (row) {
                try {
                    const payload = JSON.stringify({
                        msg: 'test',
                        lastId: 1,
                        currentId: 2
                    });
                    webpush.sendNotification(JSON.parse(row.push_subscription), payload).catch(err => console.error(err));
                    res.json({'status': 'ok'}).end();
                } catch (e) {
                    console.error(e);
                }
            });
        }
    });
});

app.post('/getUrls', cors(corsOptions), (req, res) => {
    checkToken(req.body.token, (auth, subscription) => {
        if (!auth) {
            return res.send({
                status: "unauthorized",
                data: []
            }).end();
        } else {
            let responseData = [];
            const dbConnection = db.createConnection();
            const query = "SELECT * FROM node_urls ORDER BY id DESC LIMIT 50";
            try {
                dbConnection.query(query, (err, result) => {
                    if (!err) {
                        result.map((row) => {
                            responseData.push({
                                id: row.id,
                                url: row.url,
                                created: row.timestamp
                            });
                        });
                        res.send({
                            status: "success",
                            data: responseData
                        });
                    }
                });
            } catch (e) {
                console.log("Error", e);
                res.send({
                    status: "error",
                    data: []
                });
            } finally {
                dbConnection.end();
            }
        }
    })
})


app.post('/subscribe', cors(corsOptions), (req, res) => {
    checkToken(req.body.token, (auth, subscription) => {
        if (auth) {
            updateSubscription(req.body.token, req.body.subscription);
            res.status(201).json({}).end();
        }
    })
})

app.post('/authorize', cors(corsOptions), (req, res) => {
    checkToken(req.body.token, (auth, subscription) => {
        res.status(200).json({auth: auth}).end();
    })
})

app.listen(port, () => {
    console.log(`API server listening on port ${port}`);
})