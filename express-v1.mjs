import http from 'node:http';
import express from 'express';

const delay = parseFloat(
  process.env['HELLO_REST_REQUEST_DELAY'] || '1.0'
) * 1000;

const app = express();
app.get('/', (req, res) => {
  setTimeout(() => res.end('Hello World!'), delay);
});

const opts = {keepAliveTimeout: 10000};
const server = http.createServer(opts, app);
server.listen(8080);

process.on('SIGINT', () => {
  server.close(() => console.log("closed!"));
});
