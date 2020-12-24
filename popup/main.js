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
    },
    logged: false
  }

  componentDidMount() {
    let userInfo = null
    if (chrome.storage) {
      chrome.storage.local.get(['loginHelper_userInfo'], result => {
        if (result.hasOwnProperty('loginHelper_userInfo')) {
          userInfo = result['loginHelper_userInfo']
          if (userInfo) {
            this.setState({
              logged: true,
              userInfo
            })
          }
        }
      })
    }
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
  
  handleClickSave = () => {
    this.set('loginHelper_userInfo', this.state.userInfo);
    if (!this.state.userInfo.name || !this.state.userInfo.password) {
      return
    }
    this.setState({
      logged: true
    })
  }
  
  handleClickLogout = () => {
    this.set('loginHelper_userInfo', null);
    this.setState({
      userInfo: {},
      logged: false
    })
  }
  
  render() {
    return (
      <div className="login-helper-container">
        <div className="content-container">
          <Switch
            style={{marginBottom: '20px'}}
            defaultChecked={window.setting.loginHelper_switchOn}
            onChange={this.handleSwitchChange}
          />
          {!this.state.logged ? <div>
              <div className="form-item">
                <label>用户名:</label>
                <Input defaultValue={this.state.userInfo.name} placeholder="请输入用户名" onChange={this.changeUserName}/>
              </div>
              <div className="form-item">
                <label>密码:</label>
                <Input defaultValue={this.state.userInfo.password} placeholder="请输入密码" type="password"
                       onChange={this.changePassword}/>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Button
                  type="primary"
                  size="small"
                  onClick={e => this.handleClickSave()}
                >保存</Button>
              </div>
            </div>
            : <div>
              <div className="form-item" style={{height: '98px'}}>
                <span>当前用户:</span>
                <span>{this.state.userInfo.name}</span>
                <Button
                  style={{marginLeft: '20px'}}
                  type="text"
                  size="small"
                  onClick={e => this.handleClickLogout()}
                >注销</Button>
              </div>
            </div>
          }
        </div>
      </div>
    );
  }
}
