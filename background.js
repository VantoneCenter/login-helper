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
