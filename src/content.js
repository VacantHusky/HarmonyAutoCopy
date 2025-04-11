// 提示消息队列
let toasts = [];

// 功能开关状态
let isEnabled = true;

// 初始化时获取状态
async function initState(retryCount = 0) {
  // 检查扩展上下文是否有效
  try {
    if (!chrome.runtime?.id) {
      // 扩展上下文已失效，静默使用默认状态
      return false;
    }
    
    const response = await chrome.runtime.sendMessage({type: 'getState'});
    if (response && typeof response.enabled !== 'undefined') {
      isEnabled = response.enabled;
      return true;
    }
    // 无效响应时使用默认状态
    return false;
  } catch (error) {
    // 处理扩展上下文失效错误
    if (chrome.runtime?.lastError) {
      const errorMessage = chrome.runtime.lastError.message;
      if (errorMessage === 'Extension context invalidated.') {
        // 扩展上下文已失效，静默使用默认状态
        return false;
      }
      
      // 只在第一次重试时输出调试信息
      if (retryCount === 0) {
        console.debug('状态同步初始化中...');
      }
    }
    
    // 重试逻辑，最多重试2次，减少重试次数
    if (retryCount < 2) {
      const delay = Math.min(1000 * (retryCount + 1), 2000);
      await new Promise(resolve => setTimeout(resolve, delay));
      return initState(retryCount + 1);
    }
    
    // 所有重试失败后，静默使用默认状态
    return false;
  }
}

initState();

// 页面激活时同步状态
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible') {
    await initState();
  }
});

// 监听状态变化消息
try {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'toggleState') {
      isEnabled = message.enabled;
    }
    return false; // 不需要保持消息通道开放
  });
} catch (error) {
  // 静默处理监听器设置失败的情况
  // 在扩展上下文失效时，保持默认功能可用
}

// 定期检查扩展状态，确保在扩展重新加载后能够恢复正确状态
setInterval(async () => {
  try {
    if (document.visibilityState === 'visible' && chrome.runtime?.id) {
      // 只在页面可见且扩展上下文有效时检查状态
      await initState();
    }
  } catch (error) {
    // 静默处理可能的错误，保持基本功能可用
  }
}, 60000); // 每分钟检查一次


// 创建新的提示元素
function createToast() {
  const toast = document.createElement('div');
  toast.className = 'harmony-toast';
  toast.textContent = 'HarmonyAutoCopy';
  document.body.appendChild(toast);
  return toast;
}

// 更新提示堆叠位置
function updateToastPositions() {
  const spacing = 8; // 提示之间的间距
  toasts.forEach((toast, index) => {
    const offset = (toasts.length - 1 - index) * (48 + spacing); // 48px是提示的高度
    toast.style.bottom = `${24 + offset}px`;
    toast.classList.add('stacked');
  });
}

// 移除提示
function removeToast(toast) {
  const index = toasts.indexOf(toast);
  if (index > -1) {
    toasts.splice(index, 1);
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
      updateToastPositions();
    }, 250);
  }
}

// 获取页面全部文本内容
function getPageText() {
  return document.body.innerText;
}

// 监听文本选择事件
document.addEventListener('mouseup', async (event) => {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  const isCtrlPressed = event.ctrlKey;
  const isFullPageSelected = selectedText === getPageText().trim();
  
  if (isEnabled && selectedText && selectedText.length > 0 && selection.type === 'Range' && !(isCtrlPressed && isFullPageSelected)) {
    try {
      // 复制选中文本
      await navigator.clipboard.writeText(selectedText);
      
      // 创建新提示
      const toast = createToast();
      toasts.push(toast);
      
      // 更新所有提示的位置
      updateToastPositions();
      
      // 显示提示
      requestAnimationFrame(() => {
        toast.classList.add('show');
      });
      
      // 1.5秒后移除提示
      setTimeout(() => {
        removeToast(toast);
      }, 1500);
    } catch (error) {
      console.error('复制失败:', error);
      // 创建错误提示
      const toast = createToast();
      toast.textContent = '复制失败';
      toast.style.backgroundColor = '#d32f2f';
      toasts.push(toast);
      
      updateToastPositions();
      
      requestAnimationFrame(() => {
        toast.classList.add('show');
      });
      
      setTimeout(() => {
        removeToast(toast);
      }, 1500);
    }
  }
});