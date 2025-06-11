import http from 'node:http';
import express from 'express';

const app = express();
app.get('/', (req, res) => {
  setTimeout(() => res.end('Hello World!'), 5000);
})

const opts = {keepAliveTimeout: 10000};
const server = http.createServer(opts, app);
server.listen(8080);

process.on('SIGINT', () => {
  server.close(() => console.log("closed!"));
});


