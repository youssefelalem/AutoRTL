document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggleBtn');
    const statusText = document.getElementById('statusText');

    // 1. استرجاع الحالة المحفوظة عند فتح القائمة
    chrome.storage.local.get(['isEnabled'], (result) => {
        // الافتراضي هو true (مفعل) إذا لم يكن محفوظاً من قبل
        const isEnabled = result.isEnabled !== undefined ? result.isEnabled : true;
        updateUI(isEnabled);
    });

    // 2. عند الضغط على الزر
    toggleBtn.addEventListener('change', () => {
        const isEnabled = toggleBtn.checked;
        updateUI(isEnabled);
        
        // حفظ الحالة
        chrome.storage.local.set({ isEnabled: isEnabled });

        // إرسال رسالة للصفحة الحالية لتطبيق التغيير فوراً
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "toggle", state: isEnabled });
            }
        });
    });

    function updateUI(isEnabled) {
        toggleBtn.checked = isEnabled;
        statusText.textContent = isEnabled ? "مفعل" : "معطل";
        statusText.style.color = isEnabled ? "#2196F3" : "#555";
    }
});