
const config = {
    backend_url: "http://backend:8080"
}

function getValue(key, defaultValue) {
    return config[key] || defaultValue;
}

function getSecret(key) {
    const value = process.env[key];
    
    if (value) {
        return value;
    }
    
    throw Error(`env ${key} not found in env vars`);
}

module.exports = { getValue, getSecret }
