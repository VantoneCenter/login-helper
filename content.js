// 在页面上插入代码
const scriptXhr = document.createElement('script');
scriptXhr.setAttribute('type', 'text/javascript');
scriptXhr.setAttribute('src', chrome.extension.getURL('pageScripts/xhr.js'));
document.documentElement.appendChild(scriptXhr);
const scriptAuthCode = document.createElement('script');
scriptAuthCode.setAttribute('type', 'text/javascript');
scriptAuthCode.setAttribute('src', chrome.extension.getURL('pageScripts/authCode.js'));
document.documentElement.appendChild(scriptAuthCode);

const MONITOR_RULES = [
  {
    match: '/apis/v1/login/verify',
    responseTokenKey: 'data.token',
    callbackKey: 'redirectUrl',
    tokenKey: 'token'
  }
]

scriptXhr.addEventListener('load', () => {
  chrome.storage.local.get(['loginHelper_switchOn', 'loginHelper_userInfo'], (result) => {
    if (result.hasOwnProperty('loginHelper_switchOn')) {
      postMessage({
        type: 'pageScripts',
        to: 'xhr',
        key: 'loginHelper_switchOn',
        value: result.loginHelper_switchOn
      });
      postMessage({
        type: 'pageScripts',
        to: 'xhr',
        key: 'loginHelper_rules',
        value: MONITOR_RULES
      });
      postMessage({
        type: 'pageScripts',
        to: 'authCode',
        key: 'loginHelper_switchOn',
        value: result.loginHelper_switchOn
      });
      postMessage({
        type: 'pageScripts',
        to: 'authCode',
        key: 'loginHelper_userInfo',
        value: result.loginHelper_userInfo
      });
      loginBtnReplace(result.loginHelper_switchOn);
    }
  });
});

let documentReadied = false
document.onreadystatechange = () => {
  if (document.readyState === 'complete') {
    documentReadied = true
    chrome.storage.local.get(['loginHelper_switchOn'], (result) => {
      if (result.hasOwnProperty('loginHelper_switchOn') && result.loginHelper_switchOn
      && window.location.href.includes('https://qamp.yeepay.com/mp-auth')) {
        listenCaptchaImg()
      }
    })
  }
}

// base64 to blob
function dataURItoBlob(dataURI) {
  var mimeString = dataURI
    .split(',')[0]
    .split(':')[1]
    .split(';')[0] // mime类型
  var byteString = atob(dataURI.split(',')[1]) //base64 解码
  var arrayBuffer = new ArrayBuffer(byteString.length) //创建ArrayBuffer
  var intArray = new Uint8Array(arrayBuffer) //创建视图
  for (var i = 0; i < byteString.length; i++) {
    intArray[i] = byteString.charCodeAt(i)
  }
  return new Blob([intArray], { type: mimeString }) // 转成 blob
}

function listenCaptchaImg() {
  // captcha img
  const img = document.querySelector('.captcha');
  img.click(); // reload img because can't catch img info first time
  img.addEventListener('load', function (event) {
    const dataUrl = getDataUrl(event.currentTarget);
    const xhr = new XMLHttpRequest();
    const self = this;
    const form = new FormData()
    form.append('captcha', dataURItoBlob(dataUrl))
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          if (response.status === 1 && response.request) {
            const inputList = document.querySelectorAll('.input-box')
            const captchaDom = inputList[2].firstChild.firstChild.children[1]
            captchaDom.focus()
            const evt = document.createEvent('HtmlEvents')
            evt.initEvent('input', true, true)
            captchaDom.value = response.request
            captchaDom.dispatchEvent(evt)
            // focus 短信验证码
            const authCodeDom = inputList[3].firstChild.firstChild.children[1]
            authCodeDom.focus()
            authCodeDom.dispatchEvent(evt)
          }
        } else {
          console.log('There was a problem with the request.');
        }
      } else {
        // console.log('still not ready...');
      }
    }
    xhr.open('post', 'http://www.imyangyong.com:3005', true);
    xhr.send(form);
  });
}

function getDataUrl(img) {
  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  // Set width and height
  canvas.width = img.width;
  canvas.height = img.height;
  // Draw the image
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/jpeg');
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
  const url = window.location.href
  if (url.includes('https://qamp.yeepay.com/mp-auth')) {
    if (documentReadied) {
      const submitBtn = document.querySelectorAll('button.submit')[0]
      if (submitBtn.firstChild) {
        submitBtn.firstChild.textContent = switchOn ? '开发者登录' : '登 录'
      } else {
        submitBtn.textContent = switchOn ? '开发者登录' : '登 录'
      }
      listenAuthCodeAction()
    } else {
      let count = 0;
      const checktLoadedInterval = setInterval(() => {
        if (documentReadied) {
          clearInterval(checktLoadedInterval);
          loginBtnReplace(switchOn)
          listenAuthCodeAction()
        }
        if (count++ > 500) {
          clearInterval(checktLoadedInterval);
        }
      }, 10);
    }
  }
}

function getPhoneNumber() {
  return new Promise(resolve => {
    let count = 0;
    const checktPhoneDomInterval = setInterval(() => {
      const phoneDom = document.querySelectorAll('.send-phone')[0]
      if (phoneDom) {
        clearInterval(checktPhoneDomInterval);
        const phone = phoneDom.textContent.match(/\d{3}\*\*\*\*\d{4}/)[0]
        resolve(phone)
      }
      if (count++ > 500) {
        clearInterval(checktPhoneDomInterval);
      }
    }, 10);
  })
}

let authCodeListened = false
function listenAuthCodeAction() {
  const inputList = document.querySelectorAll('.input-box')
  if (!authCodeListened) {
    inputList[3].lastChild.addEventListener('click', function () {
      // const inputList = document.querySelectorAll('.input-box')
      // const authCodeDom = inputList[3].firstChild.firstChild.children[1]
      // authCodeDom.focus()
      // setTimeout(function () {
      //   authCodeDom.setAttribute('value', '3123')
      // }, 500)
      getPhoneNumber().then(phone => {
        postMessage({
          type: 'pageScripts',
          to: 'authCode',
          key: 'phone',
          value: phone
        });
      })
    }, false)
    authCodeListened = true
  }
}



// 接收pageScript xhr传来的信息
window.addEventListener('xhr', function (event) {
  const {match, token} = event.detail
  MONITOR_RULES.forEach(_ => {
    if (match === _.match) {
      const callback = getUrlParams(_.callbackKey)
      window.location.href = callback + '?' + _.tokenKey + '=' + token
    }
  })
}, false);

// 接收pageScript authCode传来的信息
window.addEventListener('authCode', function (event) {
  const { authCode } = event.detail
  const inputList = document.querySelectorAll('.input-box')
  const authCodeDom = inputList[3].firstChild.firstChild.children[1]
  authCodeDom.focus()
  const evt = document.createEvent('HtmlEvents')
  evt.initEvent('input', true, true)
  authCodeDom.value = authCode || '未查询到验证码'
  authCodeDom.dispatchEvent(evt)
}, false);

// 接收background.js传来的信息，转发给 xhr
chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === 'loginHelper' && msg.to === 'content') {
    postMessage({...msg, type: 'pageScripts', to: 'xhr'});
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

