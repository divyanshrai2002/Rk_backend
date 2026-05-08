require('dotenv').config();

const verifyApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey && apiKey === process.env.API_KEY) {
        next();
    } else {
        res.status(403).json({ error: 'Unauthorized: Invalid API Key' });
    }
};

module.exports = verifyApiKey;