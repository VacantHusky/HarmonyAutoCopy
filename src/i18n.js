const LANG_MAP = {
    en: chrome.runtime.getURL('_locales/en/messages.json'),
    zh_CN: chrome.runtime.getURL('_locales/zh_CN/messages.json')
};

async function loadMessages(locale) {
    const url = LANG_MAP[locale] || LANG_MAP.en;
    const res = await fetch(url);
    return res.json();
}

function applyI18n(messages) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (messages[key] && messages[key].message) {
            el.textContent = messages[key].message;
        }
    });
}