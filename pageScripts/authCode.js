// 命名空间
let authCode_angusyang9 = {
  settings: {
    loginHelper_switchOn: false,
    loginHelper_userInfo: {}
  },
  today: function() {
    const now = new Date();
    return now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate()
  },
  login: function () {
    // const iframe = document.createElement('iframe');
    // iframe.src = 'http://10.151.30.80:18009/employee-boss/loginout/login'
    // document.body.appendChild(iframe);
    // var x = document.getElementsByTagName("iframe")[0].contentWindow;
  
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 302) {
          console.log(xhr.responseText)
          console.log(xhr)
        } else {
          console.log('There was a problem with the request.');
        }
      } else {
        console.log('still not ready...');
      }
    }
    xhr.open('post', 'http://10.151.30.80:18009/employee-boss/loginout/login', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8');
    const data = new FormData();
    data.append('isShowCode', false);
    data.append('returnUrl', 'http://ycetest.yeepay.com:30130/notifier-boss/order/list?orderId=&flowNo=&serverIP=&appName=&notifyRuleName=&notifyType=&orderType=&orderStatus=&receiver=&startDate=' + this.today() + '&endDate=');
    data.append('twoFactorCode', 1234);
    data.append('twoFactorOpeningStatus', false);
    data.append('loginName', this.settings.loginHelper_userInfo.name);
    data.append('password', this.settings.loginHelper_userInfo.password);
    xhr.send(data);
  }
}

window.addEventListener("message", function(event) {
  const data = event.data;

  if (data.type === 'pageScripts' && data.to === 'authCode') {
    if (data.key === 'askForAuthCode') {
      authCode_angusyang9.login()
    } else {
      authCode_angusyang9.settings[data.key] = data.value;
    }
  }
}, false);
