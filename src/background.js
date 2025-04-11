// 插件状态管理
let isEnabled = true;

// 更新图标状态
function updateIcon(enabled) {
  chrome.action.setIcon({
    path: enabled ? {
      '48': 'icon48.png',
      '128': 'icon128.png'
    } : {
      '48': 'icon48-disabled.png',
      '128': 'icon128-disabled.png'
    }
  });
  chrome.action.setTitle({
    title: enabled ? 'HarmonyAutoCopy (已启用)' : 'HarmonyAutoCopy (已禁用)'
  });
}

// 初始化图标状态
updateIcon(isEnabled);

// 监听图标点击事件
chrome.action.onClicked.addListener(() => {
  isEnabled = !isEnabled;
  updateIcon(isEnabled);
  
  // 向所有标签页发送状态更新消息
  chrome.tabs.query({}).then(tabs => {
    tabs.forEach(tab => {
      try {
        // 使用Promise处理发送消息可能的错误
        chrome.tabs.sendMessage(tab.id, {type: 'toggleState', enabled: isEnabled})
          .catch(error => {
            // 静默处理错误，不影响其他标签页
          });
      } catch (error) {
        // 忽略其他可能的错误
      }
    });
  }).catch(error => {
    // 处理tabs.query可能的错误
    console.debug('无法查询标签页:', error);
  });
});

// 监听content script的状态查询请求
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getState') {
    try {
      // 检查扩展上下文是否有效
      if (chrome.runtime.id) {
        sendResponse({enabled: isEnabled});
        return true; // 保持消息通道开放
      } else {
        // 静默处理扩展上下文失效
        sendResponse({enabled: true, fallback: true});
        return true;
      }
    } catch (error) {
      // 捕获错误但不记录日志，减少不必要的错误提示
      
      // 在错误情况下返回默认状态
      try {
        sendResponse({enabled: true, fallback: true});
        return true;
      } catch (e) {
        // 如果无法发送响应，静默失败
        return false;
      }
    }
  }
  return false; // 对于其他类型的消息，不处理
});

// 处理扩展安装或更新事件
chrome.runtime.onInstalled.addListener(() => {
  updateIcon(isEnabled);
});

// 处理扩展启动事件
chrome.runtime.onStartup.addListener(() => {
  updateIcon(isEnabled);
});