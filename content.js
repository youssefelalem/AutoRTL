let isExtensionEnabled = true;
const arabicPattern = /[\u0600-\u06FF]/;
let observer = null;

// دالة التطبيق (التشغيل)
function applyRTL() {
    if (!isExtensionEnabled) return;

    const elements = document.querySelectorAll('p, li, h1, h2, h3, h4, .model-response-text');

    elements.forEach(element => {
        // التحقق من النص العربي وتجاهل الأكواد
        if (element.textContent && arabicPattern.test(element.textContent)) {
            if (element.closest('pre') || element.closest('code') || element.classList.contains('code-line')) return;

            if (element.getAttribute('data-rtl-modified') !== 'true') {
                element.style.direction = 'rtl';
                element.style.textAlign = 'right';
                element.setAttribute('data-rtl-modified', 'true'); // علامة لنعرف أننا عدلناه

                if(element.tagName === 'LI') {
                    element.style.listStylePosition = 'outside';
                    element.style.marginRight = '25px';
                    element.style.unicodeBidi = 'plaintext';
                }
            }
        }
    });
}

// دالة إزالة التأثير (عند الإيقاف)
function removeRTL() {
    const elements = document.querySelectorAll('[data-rtl-modified="true"]');
    elements.forEach(element => {
        element.style.direction = '';
        element.style.textAlign = '';
        element.style.listStylePosition = '';
        element.style.marginRight = '';
        element.style.unicodeBidi = '';
        element.removeAttribute('data-rtl-modified');
    });
}

// بداية التشغيل: نتحقق من الذاكرة أولاً
chrome.storage.local.get(['isEnabled'], (result) => {
    isExtensionEnabled = result.isEnabled !== undefined ? result.isEnabled : true;
    
    if (isExtensionEnabled) {
        startObserver();
    }
});

// الاستماع لرسائل الـ Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggle") {
        isExtensionEnabled = request.state;
        
        if (isExtensionEnabled) {
            applyRTL();
            startObserver();
        } else {
            if (observer) observer.disconnect();
            removeRTL();
        }
    }
});

function startObserver() {
    applyRTL(); // تشغيل أولي
    
    if (!observer) {
        observer = new MutationObserver((mutations) => {
            if (isExtensionEnabled) applyRTL();
        });
    }
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}