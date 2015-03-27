/*
  web服务处理，负责读取用户id和用户添加内容
  需要处理异步执行问题,先采用redis的数据库进行测试
*/


var url  = require('url');
var querystring = require('querystring');
var client = require("redis").createClient(6379,'trains629.com');
client.auth("abcd1234FFFf009E$+120BTAZ",function (argument) {
  // body...
});


function UsrContext(request,response) { // 用户对象
  var Url = request.url;
  var u = url.parse(Url);
  this.UsrName = u.pathname;
  this.UsrID = 0;
  this.context = "";
  this.response = response;
  this.method = this.getMethod(Url); // 基本动作
}

UsrContext.prototype.getUsrID = function(argument) {
  // 在这里执行用户名入库出库的检查和设置
  client.get(argument,function function_name() {
    // body...
  })
  return this.UsrID;
}

UsrContext.prototype.getMethod = function(Url) {
  if(Url){
  var u = url.parse(Url);
  if(u.query){
    var bb = querystring.parse(u.query);
    if(bb['add']){
     this.context = bb['add'];
     return 'add';
    }
  }
  return 'get';
  }else return this.method;
}

UsrContext.prototype.getContext = function (id) { // 按id返回指定内容
  if(this.method=='add') return this.context;
  // 其他情况需要从数据库中读取
  id = id || 0; // id从0开始
  return "";
}

UsrContext.prototype.Add = function(context) {
  // 按用户id，将内容写入数据库

}

UsrContext.prototype.del = function (argument) {
  // body...
}

UsrContext.prototype.show = function(fun){
  // 显示最后内容
  if(!fun){
  this.response.writeHead(200, {'Content-Type': 'text/html'});
  //通过pathname去找到指定的用户
  this.response.write("<p>"+this.getUsrID()+"</p>");
  this.response.write("<p>" + this.getContext()+"</p>");
  this.response.end();
  }else
    fun(response);
}


module.exports = function(request,response) {
  var usr = new UsrContext(request,response);
  usr.show();
}
