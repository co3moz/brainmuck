const config = require('config');
const express = require('express');
const morgan = require('morgan');
const compression = require('compression');
const ezlogger = require('ezlogger');

ezlogger();
ezlogger.handleUncaughtExceptions();

console.log('Application starting...');

const app = express();
app.use(ezlogger.express);
app.use(morgan('dev'));
app.use(express.static('./src/public'));
app.use(compression({}));

app.listen(process.env.PORT || config.get('express.port'), config.get('express.host'));
console.log('Application started to listen at {host}:{port}', config.get('express'));