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
                currentHostname = '';
                excludeBtn.style.display = 'none';
            }
        }
    });

    // استرجاع الإعدادات
    chrome.storage.sync.get(['isEnabled', 'fontFamily', 'fontSizeAdd', 'lineHeight', 'excludedDomains'], (result) => {
        const isEnabled = result.isEnabled !== undefined ? result.isEnabled : true;
        const fontFamily = result.fontFamily || 'default';
        const fontSizeAdd = result.fontSizeAdd || 0;
        const lineHeight = result.lineHeight || 1.5;
        const excludedDomains = result.excludedDomains || [];

        // تحديث الواجهة
        updateUI(isEnabled);
        fontSelect.value = fontFamily;
        fontSizeRange.value = fontSizeAdd;
        fontSizeVal.textContent = fontSizeAdd;
        lineHeightRange.value = lineHeight;
        lineHeightVal.textContent = lineHeight;

        // تحديث زر الاستثناء
        updateExcludeBtn(excludedDomains.includes(currentHostname));
    });

    // 1. زر التبديل الرئيسي
    toggleBtn.addEventListener('change', () => {
        const isEnabled = toggleBtn.checked;
        updateUI(isEnabled);
        saveAndApply({ isEnabled: isEnabled });
    });

    // 2. تغيير الخط
    fontSelect.addEventListener('change', () => {
        saveAndApply({ fontFamily: fontSelect.value });
    });

    // 3. تغيير حجم الخط
    fontSizeRange.addEventListener('input', () => {
        fontSizeVal.textContent = fontSizeRange.value;
        saveAndApply({ fontSizeAdd: parseInt(fontSizeRange.value) });
    });

    // 4. تغيير ارتفاع السطر
    lineHeightRange.addEventListener('input', () => {
        lineHeightVal.textContent = lineHeightRange.value;
        saveAndApply({ lineHeight: parseFloat(lineHeightRange.value) });
    });

    // 5. زر الاستثناء
    excludeBtn.addEventListener('click', () => {
        if (!currentHostname) return;

        chrome.storage.sync.get(['excludedDomains'], (result) => {
            let excludedDomains = result.excludedDomains || [];
            const isExcluded = excludedDomains.includes(currentHostname);

            if (isExcluded) {
                // إزالة من القائمة
                excludedDomains = excludedDomains.filter(d => d !== currentHostname);
            } else {
                // إضافة للقائمة
                excludedDomains.push(currentHostname);
            }

            chrome.storage.sync.set({ excludedDomains: excludedDomains }, () => {
                updateExcludeBtn(!isExcluded);
                // إعادة تحميل الصفحة لتطبيق التغيير الجذري
                chrome.tabs.reload();
            });
        });
    });

    function updateUI(isEnabled) {
        toggleBtn.checked = isEnabled;
        statusText.textContent = isEnabled ? "مفعل" : "معطل";
        statusText.style.color = isEnabled ? "#2196F3" : "#999";
    }

    function updateExcludeBtn(isExcluded) {
        if (isExcluded) {
            excludeBtn.textContent = "تفعيل في هذا الموقع";
            excludeBtn.classList.add('excluded');
        } else {
            excludeBtn.textContent = "تعطيل في هذا الموقع";
            excludeBtn.classList.remove('excluded');
        }
    }

    function saveAndApply(settings) {
        chrome.storage.sync.set(settings);
        
        // إرسال رسالة للصفحة الحالية
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { 
                    action: "update-settings", 
                    settings: settings 
                });
            }
        });
    }
});