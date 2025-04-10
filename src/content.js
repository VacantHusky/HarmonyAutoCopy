// 提示消息队列
let toasts = [];

// 功能开关状态
let isEnabled = true;

// 初始化时获取状态
chrome.runtime.sendMessage({type: 'getState'}, (response) => {
  if (response) {
    isEnabled = response.enabled;
  }
});

// 监听状态变化消息
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'toggleState') {
    isEnabled = message.enabled;
  }
});


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