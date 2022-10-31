const db = require("./db");

const updateEndpointsInterval = 1000 * 60 * 15; //every 15 minutes

let endpointsBeingUpdated = true;

let endpoints = [];

const updateEndpoints = () => {
    endpointsBeingUpdated = true;
    endpoints = [];
    return new Promise((resolve, reject) => {
        const dbConnection = db.createConnection();
        const query = "SELECT url FROM links";
        dbConnection.query(query, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                result.map((row) => {
                    endpoints.push({
                        domain: (new URL(row.url)).hostname,
                        url: row.url.replace("\r", "")
                    });
                });
                resolve();
            }
            endpointsBeingUpdated = false;
            dbConnection.end();
        });
    });
};

module.exports.init = async () => {
    try {
        await updateEndpoints();
        setInterval(updateEndpoints, updateEndpointsInterval);
    } catch (e) {
        return e;
    }
}

module.exports.isUpdating = () => {
    return endpointsBeingUpdated;
}

module.exports.get = () => {
    return endpoints;
}