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
  
  // 向content script发送状态更新消息
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {type: 'toggleState', enabled: isEnabled});
    }
  });
});

// 监听content script的状态查询请求
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getState') {
    sendResponse({enabled: isEnabled});
  }
});