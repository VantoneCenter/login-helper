<h3 align="center" style="margin: 30px 0 35px;">login helper</h3>
<p align="center">
</p>

---

Login helper chrome extension for yeepay merchant system

## 使用说明

1. 若为 https 网站, 需允许不安全访问
   
2. 需要本地配合 nginx 做转发

```text
# login helper chrome extension 商户后台自主登录获取验证码
 server {
    listen       5000;
    server_name  localhost;
    
    proxy_redirect off;
    
    location /yeepay-mp {
      add_header 'Access-Control-Allow-Origin' '*';
      add_header 'Access-Control-Expose-Headers' '*';
      proxy_pass http://10.151.30.80:18009/employee-boss/loginout/login;
      proxy_intercept_errors on;
      error_page 301 302 = @handler;
    }
    
    location @handler {
       add_header 'Access-Control-Allow-Origin' '*';
       add_header 'Access-Control-Expose-Headers' '*';
       # rewrite ^ /$redirect_uri break;
       set $saved_redirect_location '$upstream_http_location';
       set $saved_redirect_set_cookie '$upstream_http_set_cookie';
       return 200 $saved_redirect_location&cookie=$saved_redirect_set_cookie;
    }
    
    location ^~ /yeepay-ycetest {
      add_header 'Access-Control-Allow-Origin' '*';
      add_header 'Access-Control-Expose-Headers' '*';
      add_header 'Access-Control-Allow-Headers' '*';
      proxy_set_header 'Cookie' '$http_loginhelpercookie';
      proxy_pass http://ycetest.yeepay.com:30130/notifier-boss/order/list;
    }
}
```

