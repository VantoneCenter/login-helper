import React from 'react';
import ReactDOM from 'react-dom';

import Main from './Main';

const DEFAULT_SETTING = {
  loginHelper_switchOn: false,
  loginHelper_userInfo: {},
}

if (chrome.storage) {
  chrome.storage.local.get(['loginHelper_switchOn', 'loginHelper_userInfo'], (result) => {
    window.setting = {
      ...DEFAULT_SETTING,
      ...result,
    };

    ReactDOM.render(
      <Main />,
      document.getElementById('login-helper')
    );
  });
} else {
  window.setting = DEFAULT_SETTING;
  // 测试环境
  ReactDOM.render(
    <Main />,
    document.getElementById('login-helper')
  );
}
