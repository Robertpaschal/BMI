require('dotenv').config();
const { exec } = require('child_process');

process.env.NODE_ENV = 'production';
exec('npx sequelize-cli db:migrate', (error, stdout, stderr) => {
    if (error) {
        console.error(`Error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
});