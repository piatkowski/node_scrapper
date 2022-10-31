const axios = require("axios");
const cheerio = require("cheerio");
const customParser = require('./custom');

let fetchBeingProcessed = false;

const getParser = domain => {
    switch (domain) {
        case 'somedomain.pl':
        case 'www.somedomain.pl':
            return customParser.parser;
        default:
            return false
    }
}

module.exports.fetch = async (endpoint) => {
    const parser = getParser(endpoint.domain);

    if (parser === false) {
        return [];
    }
    fetchBeingProcessed = true;
    let links = [];
    delete axios.defaults.headers.common['X-Requested-With'];
    let endpointUrl = endpoint.url;
    await axios.get(endpointUrl, {
        widthCredentials: false,
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    }).then((response) => {
        links = parser(cheerio.load(response.data));
        fetchBeingProcessed = false;
    }).catch(e => {
        fetchBeingProcessed = false;
        console.error('Error with: ', endpoint.url, e);
    });
    try {
        if (links.length === 0) {
            //console.warn('Links not found at: ', endpoint.url);
        }
    } catch (e) {
        //console.error('Links error', e);
    }
    return links;
}

module.exports.isUpdating = () => {
    return fetchBeingProcessed;
}
