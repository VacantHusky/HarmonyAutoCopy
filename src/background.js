// 获取设置
async function getSettings() {
  const { enabled = true, mode = 'whitelist', domains = [] } = await chrome.storage.local.get(['enabled', 'mode', 'domains']);
  return { enabled, mode, domains };
}

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

// 初始化
getSettings().then(({ enabled }) => {
  updateIcon(enabled);
});

// 在设置变化时更新图标
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    updateIcon(changes.enabled.newValue);
  }
});

// 监听content script的状态查询请求
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getState') {
    try {
      if (!chrome.runtime.id) {
        sendResponse({ enabled: false, fallback: true, error: 'Extension context invalidated.' });
        return true;
      }
  
      chrome.storage.local.get(['enabled', 'mode', 'domains'], (result) => {
        const enabled = result.enabled ?? true;
        const mode = result.mode ?? 'whitelist';
        const domains = result.domains ?? [];
  
        let siteEnabled = false;

        if (enabled) {
          try {
            const url = new URL(sender?.url || sender?.tab?.url || '');
            const hostname = url.hostname;
    
            if (mode === 'whitelist') {
              siteEnabled = domains.some(domain => hostname.endsWith(domain));
            } else if (mode === 'blacklist') {
              siteEnabled = !domains.some(domain => hostname.endsWith(domain));
            }
          } catch (e) {
            siteEnabled = true;
          }
        }

        sendResponse({ enabled: enabled && siteEnabled });
      });
      return true;
    } catch (error) {
      // 捕获错误但不记录日志，减少不必要的错误提示

      // 在错误情况下返回默认状态
      try {
        sendResponse({ enabled: false, fallback: true, error: error?.message || "Unknown error" });
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
  getSettings().then(({ enabled }) => {
    updateIcon(enabled);
  });
});

// 处理扩展启动事件
chrome.runtime.onStartup.addListener(() => {
  getSettings().then(({ enabled }) => {
    updateIcon(enabled);
  });
});