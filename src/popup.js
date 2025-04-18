function renderDomainList(domains) {
  const domainList = document.getElementById('domainList');
  domainList.innerHTML = ''; // 清空旧列表

  domains.forEach((domain, index) => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center';

    const text = document.createElement('span');
    text.textContent = domain;

    const delBtn = document.createElement('icon');
    delBtn.textContent = '❌';
    delBtn.style.border = 'none';
    delBtn.style.background = 'transparent';
    delBtn.style.cursor = 'pointer';
    delBtn.title = 'Delete';

    delBtn.addEventListener('click', async () => {
      domains.splice(index, 1);
      await chrome.storage.local.set({ domains });
      renderDomainList(domains); // 重新渲染
    });

    li.appendChild(text);
    li.appendChild(delBtn);
    domainList.appendChild(li);
  });
}



document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('toggleEnabled');
  const modeSelect = document.getElementById('modeSelect');
  const domainInput = document.getElementById('domainInput');
  const addDomainBtn = document.getElementById('addDomain');
  const langSelect = document.getElementById('langSelect');

  // 获取设置（包括语言）
  const { enabled = true, mode = 'whitelist', domains = [], lang = 'en' } =
    await chrome.storage.local.get(['enabled', 'mode', 'domains', 'lang']);

  toggle.checked = enabled;
  modeSelect.value = mode;
  langSelect.value = lang;

  // 加载翻译
  const messages = await loadMessages(lang);
  applyI18n(messages);

  // 显示已有域名
  renderDomainList(domains);

  // 保存设置
  toggle.addEventListener('change', () => {
    chrome.storage.local.set({ enabled: toggle.checked });
  });
  modeSelect.addEventListener('change', () => {
    chrome.storage.local.set({ mode: modeSelect.value });
  });
  addDomainBtn.addEventListener('click', () => {
    const domain = domainInput.value.trim();
    if (domain&& !domains.includes(domain)) {
      domains.push(domain);
      chrome.storage.local.set({ domains });
      renderDomainList(domains);
      domainInput.value = '';
    }
  });

  // 切换语言
  langSelect.addEventListener('change', async () => {
    const selectedLang = langSelect.value;
    await chrome.storage.local.set({ lang: selectedLang });
    const newMessages = await loadMessages(selectedLang);
    applyI18n(newMessages);
  });
});
