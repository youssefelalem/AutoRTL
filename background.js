// إدارة القائمة المختصرة (Context Menu)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "force-rtl",
    title: "فرض اتجاه RTL (يمين لليسار)",
    contexts: ["selection", "editable", "page"]
  });
  
  chrome.contextMenus.create({
    id: "force-ltr",
    title: "فرض اتجاه LTR (يسار ليمين)",
    contexts: ["selection", "editable", "page"]
  });
});

// معالجة النقر على القائمة المختصرة
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { 
      action: "context-menu-action", 
      command: info.menuItemId 
    });
  }
});

// معالجة اختصارات لوحة المفاتيح
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-rtl") {
    chrome.storage.sync.get(['isEnabled'], (result) => {
      const newState = !result.isEnabled;
      chrome.storage.sync.set({ isEnabled: newState });
      
      // تحديث الأيقونة
      updateBadge(newState);

      // إرسال التحديث لكل التبويبات
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { action: "toggle", state: newState }).catch(() => {});
        });
      });
    });
  }
});

// تحديث حالة الشارة (Badge)
function updateBadge(isEnabled) {
  const text = isEnabled ? "ON" : "OFF";
  const color = isEnabled ? "#4CAF50" : "#F44336";
  
  chrome.action.setBadgeText({ text: text });
  chrome.action.setBadgeBackgroundColor({ color: color });
}

// الاستماع لتغييرات التخزين لتحديث الشارة
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.isEnabled) {
    updateBadge(changes.isEnabled.newValue);
  }
});

// تعيين الشارة الأولية
chrome.storage.sync.get(['isEnabled'], (result) => {
  const isEnabled = result.isEnabled !== undefined ? result.isEnabled : true;
  updateBadge(isEnabled);
});
