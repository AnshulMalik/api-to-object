module.exports.toCamelCase = (str) => {
    return str.toLowerCase().replace(/(\-[a-z])/g, (s) => {
        return s.replace('-', '').toUpperCase();
    });
};
