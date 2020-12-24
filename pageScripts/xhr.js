
// 命名空间
let ajax_interceptor_angusyang9 = {
  settings: {
    loginHelper_switchOn: false,
    loginHelper_rules: [],
  },
  originalXHR: window.XMLHttpRequest,
  myXHR: function() {
    let pageScriptEventDispatched = false;
    const modifyResponse = () => {
      ajax_interceptor_angusyang9.settings.loginHelper_rules.forEach(({responseTokenKey = 'token', match}) => {
        let matched = false;
        if (match) {
          if (this.responseURL.indexOf(match) > -1) {
            matched = true;
          }
        }
        if (matched) {
          if (!pageScriptEventDispatched) {
            const response = JSON.parse(this.responseText)
            let token = response
            const tokenKeyArr = responseTokenKey.split('.')
            tokenKeyArr.forEach(_ => {
              token = token ? token[_] : null
            })
            if (token) {
              this.responseText = JSON.stringify({ code: '000000', message: 'response modified by chrome extension: loginHelper' })
              this.response = JSON.stringify({ code: '000000', message: 'response modified by chrome extension: loginHelper' })
              window.dispatchEvent(new CustomEvent("xhr", {
                detail: {url: this.responseURL, match, token}
              }));
              pageScriptEventDispatched = true;
            }
          }
        }
      })
    }
    
    const xhr = new ajax_interceptor_angusyang9.originalXHR;
    for (let attr in xhr) {
      if (attr === 'onreadystatechange') {
        xhr.onreadystatechange = (...args) => {
          if (this.readyState == 4) {
            // 请求成功
            if (ajax_interceptor_angusyang9.settings.loginHelper_switchOn) {
              // 开启拦截
              modifyResponse();
            }
          }
          this.onreadystatechange && this.onreadystatechange.apply(this, args);
        }
        continue;
      } else if (attr === 'onload') {
        xhr.onload = (...args) => {
          // 请求成功
          if (ajax_interceptor_angusyang9.settings.loginHelper_switchOn) {
            // 开启拦截
            modifyResponse();
          }
          this.onload && this.onload.apply(this, args);
        }
        continue;
      }
  
      if (typeof xhr[attr] === 'function') {
        this[attr] = xhr[attr].bind(xhr);
      } else {
        // responseText和response不是writeable的，但拦截时需要修改它，所以修改就存储在this[`_${attr}`]上
        if (attr === 'responseText' || attr === 'response') {
          Object.defineProperty(this, attr, {
            get: () => this[`_${attr}`] == undefined ? xhr[attr] : this[`_${attr}`],
            set: (val) => this[`_${attr}`] = val,
            enumerable: true
          });
        } else {
          Object.defineProperty(this, attr, {
            get: () => xhr[attr],
            set: (val) => xhr[attr] = val,
            enumerable: true
          });
        }
      }
    }
  },

  originalFetch: window.fetch.bind(window),
  myFetch: function(...args) {
    return ajax_interceptor_angusyang9.originalFetch(...args).then((response) => {
      let txt = undefined;
      ajax_interceptor_angusyang9.settings.loginHelper_rules.forEach(({filterType = 'normal', switchOn = true, match, overrideTxt = ''}) => {
        let matched = false;
        if (switchOn && match) {
          if (filterType === 'normal' && response.url.indexOf(match) > -1) {
            matched = true;
          } else if (filterType === 'regex' && response.url.match(new RegExp(match, 'i'))) {
            matched = true;
          }
        }

        if (matched) {
          window.dispatchEvent(new CustomEvent("pageScript", {
            detail: {url: response.url, match}
          }));
          txt = overrideTxt;
        }
      });

      if (txt !== undefined) {
        const stream = new ReadableStream({
          start(controller) {
            const bufView = new Uint8Array(new ArrayBuffer(txt.length));
            for (var i = 0; i < txt.length; i++) {
              bufView[i] = txt.charCodeAt(i);
            }
  
            controller.enqueue(bufView);
            controller.close();
          }
        });
  
        const newResponse = new Response(stream, {
          headers: response.headers,
          status: response.status,
          statusText: response.statusText,
        });
        const proxy = new Proxy(newResponse, {
          get: function(target, name){
            switch(name) {
              case 'ok':
              case 'redirected':
              case 'type':
              case 'url':
              case 'useFinalURL':
              case 'body':
              case 'bodyUsed':
                return response[name];
            }
            return target[name];
          }
        });
  
        for (let key in proxy) {
          if (typeof proxy[key] === 'function') {
            proxy[key] = proxy[key].bind(newResponse);
          }
        }
  
        return proxy;
      } else {
        return response;
      }
    });
  },
}

window.addEventListener("message", function(event) {
  const data = event.data;

  if (data.type === 'pageScripts' && data.to === 'xhr') {
    ajax_interceptor_angusyang9.settings[data.key] = data.value;
  }

  if (ajax_interceptor_angusyang9.settings.loginHelper_switchOn) {
    window.XMLHttpRequest = ajax_interceptor_angusyang9.myXHR;
    window.fetch = ajax_interceptor_angusyang9.myFetch;
  } else {
    window.XMLHttpRequest = ajax_interceptor_angusyang9.originalXHR;
    window.fetch = ajax_interceptor_angusyang9.originalFetch;
  }
}, false);
