// 接收popup传来的信息，转发给content.js
chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === 'loginHelper' && msg.to === 'background') {
    if (msg.key === 'loginHelper_switchOn') {
      if (msg.value === true) {
        chrome.browserAction.setIcon({path: "/images/icon.png"});
      } else {
        chrome.browserAction.setIcon({path: "/images/icon_gray.png"});
      }
    }
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
      chrome.tabs.sendMessage(tabs[0].id, {...msg, to: 'content'});
    })
  }
});

chrome.storage.local.get(['loginHelper_switchOn', 'loginHelper_userInfo'], (result) => {
  if (result.hasOwnProperty('loginHelper_switchOn')) {
    if (result.loginHelper_switchOn) {
      chrome.browserAction.setIcon({path: "/images/icon.png"});
    } else {
      chrome.browserAction.setIcon({path: "/images/icon_gray.png"});
    }
  } else {
    chrome.browserAction.setIcon({path: "/images/icon_gray.png"});
  }
});

// 监听并修改 http 请求头: https://stackoverflow.com/questions/15502691/chrome-webrequest-not-working
// chrome.webRequest.onBeforeSendHeaders.addListener(function(details){
//     //console.log(JSON.stringify(details));
//     var headers = details.requestHeaders,
//       blockingResponse = {};
//
//     // Each header parameter is stored in an array. Since Chrome
//     // makes no guarantee about the contents/order of this array,
//     // you'll have to iterate through it to find for the
//     // 'User-Agent' element
//     for( var i = 0, l = headers.length; i < l; ++i ) {
//       if( headers[i].name == 'User-Agent' ) {
//         headers[i].value = '>>> Your new user agent string here <<<';
//         console.log(headers[i].value);
//         break;
//       }
//       // If you want to modify other headers, this is the place to
//       // do it. Either remove the 'break;' statement and add in more
//       // conditionals or use a 'switch' statement on 'headers[i].name'
//     }
//
//     blockingResponse.requestHeaders = headers;
//     return blockingResponse;
//   },
//   {urls: [ "<all_urls>" ]},['requestHeaders','blocking']);
