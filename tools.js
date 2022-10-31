module.exports.cleanUrl = url => {
    const signs = ['?', '#'];
    for (let i = 0; i < signs.length; i++) {
        if (url.indexOf(signs[i]) > 0)
            return url.split(signs[i])[0];
    }
    return url;
}