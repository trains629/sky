var url  = require('url');
var querystring = require('querystring');
var level = require('level');
var client = level('./skydb');

function UsrContext(request,response) { // 通过request得到相应的操作命令和参数
  this.uid = 0;
  this.response = response;
  this.request  = request;
  this.ctype = "text/html"; // 输出类型,为json，html，还是text，默认为html
}

UsrContext.prototype.run = function(request) {//执行操作，通过req得到基本的命令和操作数据
  request = request || this.request;
  var Url = request.url;
  var u = url.parse(Url);
  usrName = u.pathname;
  var M = this;
  var method = 'get';
  var context = "";
  if(usrName =='/' || usrName == '/favicon.ico'){ // 需要一个用户名过滤
     this.show("<p>index</p>");
     return;
  }
  if(u.query){
    var bb = querystring.parse(u.query);
    if("o" in bb){ // 得到命令内容
      method  = bb["o"];
      context = bb["c"] || context;
      this.ctype = bb["t"] || this.ctype;
    }
  }
  this.loadUsrIDWithUsrName(usrName,function(uid) {// 传递给回调函数实际的uid
     console.log(34,"uid",uid);
     if(method in M){
      console.log(40,typeof M[method]);
      M[method](uid,context);
      console.log("run",method);
     }else{
       M.error(uid);
     }
  });
}

UsrContext.prototype.get = function(uid,context) { // 显示最后的数据
  var M = this;
  var iid = uid + ":item:";
  var itemid = 0;
  var context,time
  client.get(uid+":itemCount",function(err,value) {
    console.log(uid+":itemCount",err,value);
    itemid = value;
    if(itemid == null){
      M.error(uid+":itemCount" + value);
      return;
    }
    client.get(uid+":context:"+itemid,function(err,value) {
      context = value;
      console.log("loadLastItemID");
      console.log(uid+":time:"+itemid);
      client.get(uid+":time:"+itemid,function(err,value) {
        console.log(uid+":time:"+value,err);
        time = value;
        // 需要添加一个地址链接,这些应该用模板去处理
        M.showContext(context,time);
      });
    });
  });
}

function addItemWithID(uid,itemid) {
  client.get(uid+":items",{valueEncoding:"json"},function(err,items) {
    if(err)items = [];
    items.push(itemid);
    client.put(uid+":items",items,{valueEncoding:"json"});
  });
}

UsrContext.prototype.add = function(uid,context) { // 处理添加事件
  var M = this;
  client.get(uid+":itemCount",function(err,value) {
    console.log("add",uid,value,context);
    //client.sadd(uid+":items",value,client.print);//添加到列表
    if(err)value = 0;
    value++;
    time = new Date();
    client.batch()
    .put(uid+":context:"+value,context)
    .put(uid+":time:"+value,time)
    .put(uid+":itemCount",value)
    .write(function() {
      M.showContext(context,time);// 输出内容
      console.log("add ok");
      addItemWithID(uid,value);
    });

  });
}

UsrContext.prototype.show = function(argument) {
  this.response.writeHead(200, {
      "Content-Type": this.ctype
  });
  this.response.write("<h1>context</h1>");
  this.response.write(argument || "");
  this.response.end();
}

UsrContext.prototype.showContext = function (context,time) {
  var str = "<p><a href=\"" + context + "\">" + context + "</a></p>" +"<p>"+time+"</p>";
  this.show(str);
}

UsrContext.prototype.error = function(argument) {
  this.response.writeHead(200, {
      "Content-Type": this.ctype
  });
  this.response.write("<h1>error</h1>");
  this.response.write("<p>"+(argument || "")+"</p>");
  console.log(argument);
  this.response.end();
}

function addUsrs(usrName,uid) {
  //
  client.get("usrs",{valueEncoding:"json"},function (err,usrs) {
    //将用户添加到用户队列中
    console.log(err,usrs);
    if(err)usrs = {};
    usrs[usrName] = uid;
    console.log(usrs);
    client.put("usrs",usrs,{valueEncoding:"json"});//更新用户列表
  });
  // 可以在这添加一个用户权限信息key，用于保存用户权限
}

UsrContext.prototype.loadUsrIDWithUsrName = function(usrName,fun) { //通过用户名得到具体的用户id，都通过id去操作

  client.get(usrName,function(err,uid) { // 读取指定用的uid
    console.log(uid,err);
    if(err){
        // 不存在，添加用户和更新数据标记位
        uid = 0;
        // 通过用户总数产生当前的用户id
        client.get("usrCount",function (err,value) {
            console.log("usrCount",err,value);
            if(err)value = 0;// 当没有用户总数key，设置默认为0
            uid = ++value;// 自加产生一个新的用户id
            console.log(128,uid,value);
            client.batch().
            put(usrName,value).//设置用户id
            put("usrCount",value).//更新总数
            write(function (argument) {
              console.log(123,arguments);
            });
            console.log("set id");
            addUsrs(usrName,uid);//将此用户更新到用户列表中
            //client.sadd("usrs",usrName,client.print); // 加入列表中
            // 在这去进行动作类型的判断
            console.log("action");
            fun(value);
        });
    }else{
      console.log(141,usrName,uid);
      // 这进行动作类型的处理
      fun(uid);
    }
  });
}

module.exports = function(request,response) {
  console.log("run");
  var usr = new UsrContext(request,response);
  usr.run();
}
