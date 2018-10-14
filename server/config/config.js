let env = process.env.NODE_ENV || 'development';

if (env === 'development' || env === 'test') {
    let config = require('./config.json');
    let envConfig = config[env];

    for (const key in envConfig)
        process.env[key] = envConfig[key];
}
