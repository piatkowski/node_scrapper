const tools = require('../tools');

module.exports.parser = ($, log) => {
    /* $ - DOM */
    let urls = [];

    $('.list a').map(function () {
        let url = tools.cleanUrl($(this).attr('href'));
        if (url.startsWith('/d/')) {
            urls.push(url);
        }
    });
    return urls;
}