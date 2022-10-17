const http = require('http');
const Koa = require('koa');
const Router = require('koa-router');
const WS = require('ws');
const cors = require('koa2-cors');
const date = new Date().toString().slice(3, 21);

const app = new Koa();
app.use(cors());

class Message {
  constructor(nickname, msg, date, userId) {
    this.nickname = nickname;
    this.msg = msg;
    this.date = date;
  }
}

class User {
  constructor(name, id) {
    this.name = name;
    this.id = id;
  }
}

const users = [
];

const messages = [
  new Message('Chat Bot', 'Welcome to the chat', date),
];

const router = new Router();
router.get('/index', async (ctx) => {
  ctx.response.body = 'hello';
});
app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback()).listen(port, () => console.log('server is listening'));

const wsServer = new WS.Server({ server }, CLIENTS = []);
wsServer.on('connection', (ws, req) => {

  ws.on('close', () => {
    let response;
    const ind = CLIENTS.findIndex((elem) => elem === ws);
    const deletedUser = users[ind].name;
    users.splice(ind, 1);
    CLIENTS.splice(ind, 1);
    messages.push(new Message('Chat Bot', `User ${deletedUser} left the chat`, date));
    response = { users, messages };
    [...wsServer.clients]
      .filter(o => o.readyState === WS.OPEN)
      .forEach(o => o.send(JSON.stringify(response)));
  });

  ws.on('message', (msg) => {
    const request = JSON.parse(msg);
    let response;
    if (request.login) {
      const userLogged = users.some((user) => user.name === request.login);
      if (userLogged) {
        response = false;
      } else {
        CLIENTS.push(ws);
        const ind = CLIENTS.findIndex((elem) => elem === ws);
        users.push(new User(request.login, ind));
        const joinedUser = users[ind].name;
        messages.push(new Message('Chat Bot', `User ${joinedUser} join the chat`, date));
        response = { users, messages };
      }
    } else if (request.message) {
      const ind = CLIENTS.findIndex((elem) => elem === ws);
      messages.push(new Message(users[ind].name, request.message, date));
      response = messages;
    }
    [...wsServer.clients]
      .filter(o => o.readyState === WS.OPEN)
      .forEach(o => o.send(JSON.stringify(response)));
  });
});