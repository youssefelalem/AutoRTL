document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggleBtn');
    const statusText = document.getElementById('statusText');
    const fontSelect = document.getElementById('fontSelect');
    const fontSizeRange = document.getElementById('fontSizeRange');
    const fontSizeVal = document.getElementById('fontSizeVal');
    const lineHeightRange = document.getElementById('lineHeightRange');
    const lineHeightVal = document.getElementById('lineHeightVal');
    const excludeBtn = document.getElementById('excludeBtn');

    let currentHostname = '';

    // الحصول على اسم النطاق الحالي
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0] && tabs[0].url) {
            try {
                const url = new URL(tabs[0].url);
                currentHostname = url.hostname;
            } catch (e) {
                console.error("Invalid URL");
                excludeBtn.style.display = 'none'; // إخفاء الزر إذا لم يكن هناك نطاق صالح
            }
        }
    });

    // 1. استرجاع الحالة المحفوظة عند فتح القائمة
    chrome.storage.sync.get(['isEnabled', 'fontFamily', 'fontSizeAdd', 'lineHeight', 'excludedDomains'], (result) => {
        // الافتراضي هو true (مفعل)
        const isEnabled = result.isEnabled !== undefined ? result.isEnabled : true;
        updateToggleUI(isEnabled);

        // إعدادات الخط
        if (result.fontFamily) fontSelect.value = result.fontFamily;
        
        // إعدادات الحجم
        if (result.fontSizeAdd) {
            fontSizeRange.value = result.fontSizeAdd;
            fontSizeVal.textContent = result.fontSizeAdd;
        }

        // إعدادات ارتفاع السطر
        if (result.lineHeight) {
            lineHeightRange.value = result.lineHeight;
            lineHeightVal.textContent = result.lineHeight;
        }

        // حالة الاستثناء
        if (result.excludedDomains && result.excludedDomains.includes(currentHostname)) {
            updateExcludeBtn(true);
        } else {
            updateExcludeBtn(false);
        }
    });

    // 2. عند الضغط على زر التفعيل/التعطيل
    toggleBtn.addEventListener('change', () => {
        const isEnabled = toggleBtn.checked;
        updateToggleUI(isEnabled);
        
        // حفظ الحالة
        chrome.storage.sync.set({ isEnabled: isEnabled });

        // إرسال رسالة
        sendMessageToActiveTab({ action: "toggle", state: isEnabled });
    });

    // 3. تغيير نوع الخط
    fontSelect.addEventListener('change', () => {
        const fontFamily = fontSelect.value;
        chrome.storage.sync.set({ fontFamily: fontFamily });
        sendMessageToActiveTab({ 
            action: "update-settings", 
            settings: { fontFamily: fontFamily } 
        });
    });

    // 4. تغيير حجم الخط
    fontSizeRange.addEventListener('input', () => {
        const size = parseInt(fontSizeRange.value);
        fontSizeVal.textContent = size;
        chrome.storage.sync.set({ fontSizeAdd: size });
        sendMessageToActiveTab({ 
            action: "update-settings", 
            settings: { fontSizeAdd: size } 
        });
    });

    // 5. تغيير ارتفاع السطر
    lineHeightRange.addEventListener('input', () => {
        const height = parseFloat(lineHeightRange.value);
        lineHeightVal.textContent = height;
        chrome.storage.sync.set({ lineHeight: height });
        sendMessageToActiveTab({ 
            action: "update-settings", 
            settings: { lineHeight: height } 
        });
    });

    // 6. زر استثناء الموقع
    excludeBtn.addEventListener('click', () => {
        if (!currentHostname) return;

        chrome.storage.sync.get(['excludedDomains'], (result) => {
            let excludedDomains = result.excludedDomains || [];
            const isCurrentlyExcluded = excludedDomains.includes(currentHostname);
            
            if (isCurrentlyExcluded) {
                // إزالة من القائمة
                excludedDomains = excludedDomains.filter(d => d !== currentHostname);
                updateExcludeBtn(false);
                sendMessageToActiveTab({ action: "toggle-exclusion", isExcluded: false });
            } else {
                // إضافة للقائمة
                excludedDomains.push(currentHostname);
                updateExcludeBtn(true);
                sendMessageToActiveTab({ action: "toggle-exclusion", isExcluded: true });
            }
            
            chrome.storage.sync.set({ excludedDomains: excludedDomains });
        });
    });

    function updateToggleUI(isEnabled) {
        toggleBtn.checked = isEnabled;
        statusText.textContent = isEnabled ? "Enabled (مفعل)" : "Disabled (معطل)";
        statusText.style.color = isEnabled ? "#2196F3" : "#555";
    }

    function updateExcludeBtn(isExcluded) {
        if (isExcluded) {
            excludeBtn.textContent = "تفعيل في هذا الموقع (إلغاء الاستثناء)";
            excludeBtn.classList.add('excluded');
            excludeBtn.style.backgroundColor = '#4CAF50'; // أخضر
        } else {
            excludeBtn.textContent = "تعطيل في هذا الموقع";
            excludeBtn.classList.remove('excluded');
            excludeBtn.style.backgroundColor = '#ff5252'; // أحمر
        }
    }

    function sendMessageToActiveTab(message) {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, message);
            }
        });
    }
});