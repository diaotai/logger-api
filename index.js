var restify = require("restify");
var md5 = require("md5");
var User = require("./models/user");
var Task = require("./models//task");
let mongoose = require("mongoose");
let db = mongoose.connect("mongodb://localhost/logger");
db.connection.on("error", err => {
  console.log("数据库连接失败：" + err);
});
db.connection.on("open", () => {
  console.log("--数据库链接成功--");
});

function respond(req, res, next) {
  console.log("hello");
  res.send({ "hello ": req.params.name, a: "b" });
  next();
}
const { result } = require("./util");

var server = restify.createServer();

server.use(restify.plugins.bodyParser());
const corsMiddleware = require("restify-cors-middleware");

const cors = corsMiddleware({
  // preflightMaxAge: 5, //Optional
  origins: ["*"]
  // allowHeaders: ['API-Token'],
  // exposeHeaders: ['API-Token-Expiry']
});

server.pre(cors.preflight);
server.use(cors.actual);

server.get("/hello/:name", respond);
server.head("/hello/:name", respond);
server.post("/login", (req, res, next) => {
  let { account, password } = req.body;
  console.log("login", req.body);
  User.find(
    {
      account
    },
    (err, users) => {
      if (err) throw err;
      if (users.length == 0) {
        res.send(result("fail", "不存在该用户"));
      } else {
        if (users[0].password == md5(password)) {
          Task.find(
            {
              account
            },
            (err, tasks) => {
              if (err) {
                console.log(err);
                res.send(result("fail", "查询失败"));
              }
              res.send({ result: "sucess", message: "成功登陆", data: tasks });
            }
          );
          // res.send(result("sucess", "成功登陆"));
        } else {
          res.send(result("fail", "密码错误"));
        }
      }
    }
  );
  next();
});

server.post("/registered", (req, res, next) => {
  let { account, password } = req.body;
  let user = new User();
  user.account = account;
  user.password = md5(password);
  user.username = Math.random()
    .toString(16)
    .slice(2);
  user.save(err => {
    if (err) {
      console.log("注册失败", err);
      res.send(result("fail", "注册失败"));
    } else {
      console.log("注册成功");
      res.send(result("sucess", "注册成功"));
    }
  });
  next();
});

server.post("/task/save", (req, res, next) => {
  let task = req.body;
  Task.update(
    { title: task.title, account: task.account },
    task,
    { upsert: true, multi: true },
    (err, datas) => {
      if (err) {
        console.log("存储任务失败", err);
        res.send(result("fail", "存储任务失败"));
      } else {
        console.log("存储任务成功");
        res.send(result("sucess", "存储任务成功"));
      }
    }
  );
  next();
});

// server.post("/task/update", (req, res, next) => {
//   let task = new Task();
//   console.log("存储任务", req.body);
//   for (let i in req.body) {
//     task[i] = req.body[i];
//   }
//   task.save(err => {
//     if (err) {
//       console.log("存储任务失败", err);
//       res.send(result("fail", "存储任务失败"));
//     } else {
//       console.log("存储任务成功");
//       res.send(result("sucess", "存储任务成功"));
//     }
//   });
//   next();
// });

server.get("/tasks/:account", (req, res, next) => {
  let { account } = req.params;
  Task.find(
    {
      account
    },
    (err, tasks) => {
      if (err) {
        console.log(err);
        res.send(result("fail", "查询失败"));
      }
      res.send({ result: "sucess", data: tasks });
    }
  );
  next();
});

server.listen(7080, function() {
  console.log("%s listening at %s", server.name, server.url);
});
