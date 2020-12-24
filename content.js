// 在页面上插入代码
const script = document.createElement('script');
script.setAttribute('type', 'text/javascript');
script.setAttribute('src', chrome.extension.getURL('pageScripts/xhr.js'));
document.documentElement.appendChild(script);

const MONITOR_RULES = [
  {
    match: '/apis/v1/login/verify',
    responseTokenKey: 'data.token',
    callbackKey: 'redirectUrl',
    tokenKey: 'token'
  }
]

script.addEventListener('load', () => {
  chrome.storage.local.get(['loginHelper_switchOn'], (result) => {
    if (result.hasOwnProperty('loginHelper_switchOn')) {
      postMessage({type: 'ajaxInterceptor', to: 'xhr', key: 'loginHelper_switchOn', value: result.loginHelper_switchOn});
      postMessage({type: 'ajaxInterceptor', to: 'xhr', key: 'loginHelper_rules', value: MONITOR_RULES});
      loginBtnReplace(result.loginHelper_switchOn)
    }
  });
});

let documentReadied = false
document.onreadystatechange = () => {
  if (document.readyState === 'complete') {
    documentReadied = true
  }
}

function getUrlParams(key) {
  const originArr = window.location.href.split('?')
  if (originArr.length > 1) {
    const paramsArr = originArr[1].split('&')
    for (let i = 0; i < paramsArr.length; i++) {
      if (paramsArr[i].split('=')[0] === key) {
        return decodeURIComponent(paramsArr[i].split('=')[1])
      }
    }
  }
}

/**
 * method 替换登录按钮.
 */
function loginBtnReplace(switchOn = false) {
  if (documentReadied) {
    const submitBtn = document.querySelectorAll('button.submit')[0]
    if (submitBtn.firstChild) {
      submitBtn.firstChild.textContent = switchOn? '开发者登录' : '登 录'
    } else {
      submitBtn.textContent = switchOn ? '开发者登录' : '登 录'
    }
  } else {
    let count = 0;
    const checktLoadedInterval = setInterval(() => {
      if (documentReadied) {
        clearInterval(checktLoadedInterval);
        loginBtnReplace(switchOn)
      }
      if (count ++ > 500) {
        clearInterval(checktLoadedInterval);
      }
    }, 10);
  }
  
}

// 接收pageScript传来的信息
window.addEventListener("xhr", function(event) {
  const { match, token } = event.detail
  MONITOR_RULES.forEach(_ => {
    if (match === _.match) {
      const callback = getUrlParams(_.callbackKey)
      window.location.href = callback + '?' + _.tokenKey + '=' + token
    }
  })
}, false);

// 接收background.js传来的信息，转发给 xhr
chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === 'loginHelper' && msg.to === 'content') {
    postMessage({...msg, type: 'ajaxInterceptor', to: 'xhr'});
    if (msg.key === 'loginHelper_switchOn') {
      loginBtnReplace(msg.value)
    }
  }
});

// function customMpLogin() {
//   const url = window.location.href
//   if (url.includes('localhost') && url.includes('https://qamp.yeepay.com/mp-auth')) {
//     const submitBtn = document.querySelectorAll('button.submit')[0]
//     let newSubBtn = null
//     if (submitBtn) {
//       newSubBtn = submitBtn.cloneNode(true)
//       const parentNode = submitBtn.parentNode
//       parentNode.removeChild(submitBtn)
//       const shenqingBtn = document.querySelectorAll('.app-query')[0]
//       parentNode.insertBefore(newSubBtn, shenqingBtn)
//       newSubBtn.firstChild.textContent = '开发者登录'
//       newSubBtn.removeAttribute('disabled')
//     }
//     newSubBtn.addEventListener('click', function (event) {
//       const inputList = document.querySelectorAll('.input-box')
//       let complete = true
//       const loginInfo = {
//         source: 'PC'
//       }
//       if (inputList.length === 4) {
//         inputList.forEach((_, idx) => {
//           const value = _.firstChild.firstChild.children[1].value
//           if (!value) {
//             complete = false
//           }
//           if (idx === 0) {
//             loginInfo.loginName = value
//           } else if (idx === 1) {
//             loginInfo.password = encrypt(value)
//           } else if (idx === 3) {
//             loginInfo.verifyCode = value
//           }
//         })
//       }
//
//       if (complete) {
//         request('https://qamp.yeepay.com/merchant-portal-server/apis/v1/login/verify', loginInfo, 'post').then(res => {
//           console.log(res)
//         }).catch(() => {})
//       }
//     })
//     // const loginInfo = JSON.parse(window.localStorage.getItem('loginInfo'))
//     // if (loginInfo) {
//     //   const token = loginInfo.token
//     //   request('https://qamp.yeepay.com/merchant-portal-server/apis/v1/home/query-info', {}, 'get', {
//     //     Authorization: 'Bearer ' + token
//     //   }).then(res => {
//     //     if (JSON.parse(res).code === '000000') {
//     //       // window.location.href = decodeURIComponent(getParams('redirectUrl') + '?token=' + token)
//     //     }
//     //   }).catch(() => {})
//     //   // const cookieToken = document.cookie.replace(/(?:(?:^|.*;\s*)TOKEN\s*\=\s*([^;]*).*$)|^.*$/, "$1");
//     //   // if (token !== cookieToken) {
//     //   //   // window.location.href = window.location.href.split('?')[0] + '?token=' + token
//     //   //   document.cookie = 'TOKEN=' + token
//     //   //   window.location.reload()
//     //   // }
//     // }
//   }
// }
//
// function loginYCE(username, password) {
//   // request('http://ycetest.yeepay.com:30422/yuia-service-boss/sso/login', {
//   //   "callback":"https://qaboss.yeepay.com/boss-rebate/index.html",
//   //   "loginName":"Gw36Pn7GWFgCoSebfeCx0GHBxtScOQSj5/c7AFKRExbJDLbNxD1rGRP6YgRF2+RjV6Ia2vN7p5udib4CAEbSsCUUclZwsBgYXgtuEoKdifMxEHWfqaORtPOJBJlkpwv6V/BV4JXz9SHJQNNahB4PBWzOLQqVMTwsyqzXJKBMcQY=",
//   //   "password":"Ox5aF5qUpYeotKeEySPzH9bTP9t/DcXAUE0F3Im1DIaox3Ik0ems7+qZorKi5IxFHmxdCYO+s8lsRd5S/wbc7KvoJPh+3tu047OjENS6ds2eI27ja3bSP7WtdQ30r9iwXaYAYVUCT3Lbh4BXQ1hK/f9ySt+6waNQIAEMTMqLxg4=",
//   //   "sapassword":"",
//   //   "captcha":"",
//   //   "twoFactor":"",
//   //   "emailSuffix":"@yeepay.com",
//   //   "migrateSource":"EHR"
//   // })
// }
//
// function loginMP(username, password) {}
//
// function request(url, data, method = 'post', header) {
//   return new Promise((resolve, reject) => {
//     const xhr = new XMLHttpRequest();
//     xhr.onreadystatechange = function () {
//       if (xhr.readyState === 4) {
//         if (xhr.status === 200) {
//           resolve(xhr.responseText)
//         } else {
//           console.log('There was a problem with the request.');
//           reject()
//         }
//       } else {
//         console.log('still not ready...');
//       }
//     }
//     xhr.open(method, url, true);
//     xhr.setRequestHeader('Content-Type', 'application/json');
//     for (const key in header) {
//       xhr.setRequestHeader(key, header[key])
//     }
//     xhr.send(data);
//   })
// }
//
// document.onreadystatechange = () => {
//   if (document.readyState === 'complete') {
//     chrome.storage.local.get(['loginHelper_switchOn', 'loginHelper_userInfo'], (result) => {
//       if (result.hasOwnProperty('loginHelper_switchOn')) {
//         // 目前先进行对 mp 的 token 设置
//         if (result.loginHelper_switchOn) {
//           customMpLogin()
//         }
//         return;
//         if (result.loginHelper_userInfo) {
//           const found = MONITOR_URLS.find(_ => window.location.href.includes(_.url))
//           if (found) {
//             found.loginFunc(result.loginHelper_userInfo.name, result.loginHelper_userInfo.passsword)
//           }
//         }
//       }
//     });
//   }
// }

