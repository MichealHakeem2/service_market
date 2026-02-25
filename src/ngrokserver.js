const dotenv = require('dotenv');
const ngrok = require('@ngrok/ngrok');
dotenv.config();
const app = require('./app');
const PORT = process.env.PORT;
const server = app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
server.on('listening', () => {
    console.log(`✅ Server is ready`);
    startngrok();
});
let listener;
const startngrok = async () => {
    try {
        listener = await ngrok.connect({
            addr: parseInt(PORT),
            domain: 'eeriest-asymptotically-sherie.ngrok-free.dev',
            authtoken: process.env.NGROK_AUTHTOKEN
        });
        console.log(`🌐 NGROK Server running on ${listener.url()}`);
        console.log(`🔗 forwarded ${listener.url()} -> http://localhost:${PORT}`);
    } catch (error) {
        console.error('NGROK error:', error.message);
    }
};
process.on('SIGINT', async () => {
    console.log(`
    📝 Stopping NGROK...`);
    try {
        if (listener) await listener.close();
        console.log(`
        📝 Stopped NGROK server...`);
    } catch (error) {
        if (error instanceof Error) {
            console.log(`Error stopping the NGROK, ${error.message}`);
        } else {
            console.log(`unknown error stopping the NGROK, ${error}`);
        }
    }
    server.close(() => {
        console.log(`
        📝 NGROK Server stopped.`);
        process.exit(0);
    });
});