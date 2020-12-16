import React, {Component} from 'react';
import 'antd/dist/antd.css';
import {Switch, Input, Select, Button, Badge, Tooltip} from 'antd';

import './main.less';

export default class Main extends Component {
  constructor() {
    super();
    
    this.userInfo = window.setting;
  }

  state = {
    userInfo: {
      name: '',
      password: ''
    }
  }

  componentDidMount() {
  }
  
  set = (key, value) => {
    // 发送给background.js
    chrome.runtime.sendMessage(chrome.runtime.id, {type: 'loginHelper', to: 'background', key, value});
    chrome.storage && chrome.storage.local.set({[key]: value});
  }
  
  forceUpdateDebouce = () => {
    clearTimeout(this.forceUpdateTimeout);
    this.forceUpdateTimeout = setTimeout(() => {
      this.forceUpdate();
    }, 1000);
  }

  handleSwitchChange = () => {
    window.setting.loginHelper_switchOn = !window.setting.loginHelper_switchOn;
    this.set('loginHelper_switchOn', window.setting.loginHelper_switchOn);
  }
  
  changeUserName = e => {
    this.setState({
      userInfo: {
        ...this.state.userInfo,
        name: e.target.value
      }
    })
  }
  
  changePassword = e => {
    this.setState({
      userInfo: {
        ...this.state.userInfo,
        password: e.target.value
      }
    })
  }
  
  render() {
    return (
      <div className="login-helper-container">
        <img src="https://img.imyangyong.com/yeepay/logo-ued.svg" width="80px" />
        <div className="content-container">
          <Switch
            style={{marginBottom: '20px'}}
            defaultChecked={window.setting.ajaxInterceptor_switchOn}
            onChange={this.handleSwitchChange}
          />
          <div className="form-item">
            <label>用户名:</label>
            <Input defaultValue={this.userInfo.name} placeholder="请输入用户名" onChange={this.changeUserName}/>
          </div>
          <div className="form-item">
            <label>密码:</label>
            <Input defaultValue={this.userInfo.password} placeholder="请输入密码" onChange={this.changePassword}/>
          </div>
          <div>
            <Button
              type="primary"
              size="small"
              onClick={e => this.handleClickRemove(e, i)}
            >保存</Button>
          </div>
        </div>
      </div>
    );
  }
}
