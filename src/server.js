const dotenv = require('dotenv');
dotenv.config();
const sequelize = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT;

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
