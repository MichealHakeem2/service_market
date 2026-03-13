const PASSENGER_PORT = process.env.PORT;
const app = require('./app');
const PORT = PASSENGER_PORT || process.env.PORT || 8000;
const server = app.listen(PORT, () => {
    console.log(`✅ Backend successfully started and listening on ${PORT}`);
});
server.timeout = 120000;
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
        process.exit(1);
    }
});

module.exports = app;