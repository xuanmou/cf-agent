# cf-agent #
### 使用Cloudflare Worker转发报文的Mitn-Http代理服务  ###

### 使用 ###
* 运行程序生成config.txt,worker.txt与根证书文件ca.crt
* 将ca.crt证书导入到操作系统或者由浏览器证书管理器导入, Windows导入可运行: certutil -addstore Root ca.crt
* 复制worker.txt全部内容到Cloudflare Worker部署
* 修改config.txt文件

{"domain":"a.com","psw":"","hport":8082,"hbind":"127.0.0.1","wkip":"","ca":{}}

* domain: 	worker绑定的域名 (必填)
* psw: 		与worker.txt里的psw变量相同值 (必填)
* ca: 		使用MITM服务的根证书(程序生成) (必填)
* hport: 	本地绑定的http代理端口
* hbind: 	本地绑定的http代理地址, 一般为 127.0.0.1
* wkip: 	为本地连接到worker指定优选的IP, 不指定则不优选IP

运行程序后将在本地机器开启一个http代理端口，浏览器设置代理到此端口即可代理上网
