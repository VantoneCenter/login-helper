/**
 * @file 从另一平台,获取短信验证码
 * @author Angus Yang
 * @date 2020/12/26
 * @description 1. 需要本地配合 nginx 做转发 2. https 网站允许不安全访问
 */

/**
 * # login helper chrome extension 商户后台自主登录获取验证码
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
 */

// 命名空间
let authCode_angusyang9 = {
  settings: {
    loginHelper_switchOn: false,
    loginHelper_userInfo: {
      name: '',
      password: ''
    },
    phone: '',
    JSESSIONID: ''
  },
  today: function() {
    const now = new Date();
    return now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate()
  },
  login: function () {
    const xhr = new XMLHttpRequest();
    const self = this;
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const response = xhr.responseText;
          self.settings.JSESSIONID = response.match(/.+JSESSIONID=(.+?);.+/)[1]
          const token = response.match(/.+yeepay_sso_token=(.+?)&.+/)[1]
          self.setCookie(token)
        } else {
          console.log('There was a problem with the request.');
        }
      } else {
        // console.log('still not ready...');
      }
    }
    xhr.open('post', 'http://localhost:5000/yeepay-mp', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8');
    xhr.send('isShowCode=false&returnUrl=http%3A%2F%2Flocalhost%3A5000%2Fyeepay-ycetest&loginName=' + this.settings.loginHelper_userInfo.name
      + '&password=' + this.settings.loginHelper_userInfo.password
      + '&startDate=' + this.today()
      + '&twoFactorCode=2&twoFactorOpeningStatus=false');
  },
  setCookie: function (token) {
    const xhr = new XMLHttpRequest();
    const self = this;
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          self.searchAuthCode()
        } else {
          console.log('There was a problem with the request.');
        }
      } else {
        // console.log('still not ready...');
      }
    }
    xhr.open('get', 'http://localhost:5000/yeepay-ycetest?yeepay_sso_token=' + token, true);
    xhr.setRequestHeader('loginhelpercookie', 'JSESSIONID=' + this.settings.JSESSIONID);
    xhr.send();
  },
  searchAuthCode: function () {
    const xhr = new XMLHttpRequest();
    const self = this;
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const response = xhr.responseText
          const phone = self.settings.phone.replace(/\*/g, '\\*')
          const reg = new RegExp(phone + '[\\s\\S]+?验证码(\\d{6})')
          const authCodeArr = response.match(reg)
          if (authCodeArr.length >= 2) {
            window.dispatchEvent(new CustomEvent("authCode", {
              detail: {
                authCode: authCodeArr[1]
              }
            }));
          }
        } else {
          console.log('There was a problem with the request.');
        }
      } else {
        // console.log('still not ready...');
      }
    }
    xhr.open('get', 'http://localhost:5000/yeepay-ycetest?startDate=' + this.today(), true);
    xhr.setRequestHeader('loginhelpercookie', 'JSESSIONID=' + this.settings.JSESSIONID);
    xhr.send();
  }
}

window.addEventListener("message", function(event) {
  const data = event.data;

  if (data.type === 'pageScripts' && data.to === 'authCode') {
    if (data.key === 'phone' && authCode_angusyang9.settings.loginHelper_switchOn
      && authCode_angusyang9.settings.loginHelper_userInfo.name
      && authCode_angusyang9.settings.loginHelper_userInfo.password) {
      authCode_angusyang9.settings.phone = data.value
      authCode_angusyang9.login()
    } else {
      authCode_angusyang9.settings[data.key] = data.value;
    }
  }
}, false);
