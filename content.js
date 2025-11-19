if (window.hasRunAutoRTL) {
   // إذا كان السكريبت يعمل، نطلب منه تحديث نفسه عبر رسالة وهمية (اختياري)
   // أو نكتفي بالخروج لأن النسخة القديمة لا تزال تعمل وتستقبل الرسائل
   throw new Error("AutoRTL already loaded"); 
}
window.hasRunAutoRTL = true;

(function() {
let isExtensionEnabled = true;
let currentSettings = {
    fontFamily: 'default',
    fontSizeAdd: 0,
    lineHeight: 1.5
};
let isDomainExcluded = false;
let lastRightClickedElement = null;

const arabicPattern = /[\u0600-\u06FF]/;
let observer = null;
let debounceTimer = null;

// قائمة العناصر المستهدفة
const TARGET_TAGS = ['P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TD', 'TH', 'BLOCKQUOTE', 'TEXTAREA', 'INPUT', 'DIV', 'SPAN'];
const TARGET_SELECTORS = 'p, li, h1, h2, h3, h4, h5, h6, td, th, blockquote, textarea, input[type="text"], input[type="search"], .model-response-text, div, span';

// حقن خطوط Google Fonts
const fontsLink = document.createElement('link');
fontsLink.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&family=Tajawal:wght@400;700&family=Noto+Sans+Arabic:wght@400;700&family=IBM+Plex+Sans+Arabic:wght@400;700&family=Amiri:wght@400;700&display=swap';
fontsLink.rel = 'stylesheet';
document.head.appendChild(fontsLink);

// تتبع العنصر الذي تم النقر عليه بالزر الأيمن
document.addEventListener('contextmenu', (event) => {
    lastRightClickedElement = event.target;
}, true);

// دالة للتحقق مما إذا كان النص يبدأ بالعربية
function isArabicContent(text) {
    if (!text) return false;
    const firstStrongChar = text.match(/[\w\u0600-\u06FF]/);
    if (firstStrongChar && arabicPattern.test(firstStrongChar[0])) {
        return true;
    }
    return arabicPattern.test(text);
}

// تطبيق التنسيقات على عنصر
function applyStyles(element) {
    if (currentSettings.fontFamily !== 'default') {
        // استخدام !important لضمان تطبيق الخط فوق خطوط الموقع
        element.style.setProperty('font-family', currentSettings.fontFamily, 'important');
    } else {
        element.style.removeProperty('font-family');
    }

    // إعادة تعيين حجم الخط أولاً للحصول على الحجم الأصلي من CSS
    // هذا يمنع التراكم المستمر للحجم عند تحديث الإعدادات
    element.style.fontSize = '';

    if (currentSettings.fontSizeAdd !== 0) {
        const computedStyle = window.getComputedStyle(element);
        const currentSize = parseFloat(computedStyle.fontSize);
        if (!isNaN(currentSize)) {
            // نتأكد أن الحجم الجديد لا يقل عن حد معين (مثلاً 8px)
            const newSize = Math.max(8, currentSize + currentSettings.fontSizeAdd);
            element.style.fontSize = `${newSize}px`;
        }
    }

    if (currentSettings.lineHeight > 1.0) {
        element.style.lineHeight = currentSettings.lineHeight;
    }
}

// معالجة عنصر واحد
function processElement(element, forceRTL = false) {
    // تجاهل الأكواد
    if (element.closest('pre') || element.closest('code') || element.classList.contains('code-line')) return;

    // تجاهل العناصر التي قد تكون حاويات تخطيط حساسة
    // إذا كان العنصر يحتوي على position: absolute أو fixed، غالباً لا يجب تغيير اتجاهه
    const style = window.getComputedStyle(element);
    if (style.position === 'absolute' || style.position === 'fixed') return;

    // تحسين الأداء: للعناصر العامة مثل div و span، نتحقق أولاً مما إذا كانت تحتوي على نص مباشر
    // لتجنب معالجة حاويات التخطيط الفارغة التي قد تسبب مشاكل في التصميم
    if ((element.tagName === 'DIV' || element.tagName === 'SPAN') && element.childElementCount > 0) {
        let hasDirectText = false;
        for (let node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 3) {
                hasDirectText = true;
                break;
            }
        }
        if (!hasDirectText) return;
    }

    const text = element.value || element.textContent;
    const isArabic = isArabicContent(text);
    
    if (forceRTL || isArabic) {
        if (element.getAttribute('data-rtl-modified') !== 'true' || forceRTL) {
            element.style.direction = 'rtl';
            element.style.textAlign = 'right';
            element.setAttribute('data-rtl-modified', 'true');

            // إصلاح التداخل مع القوائم الجانبية:
            // في بعض المواقع، تحويل الاتجاه لليمين قد يدفعه تحت القوائم الثابتة يميناً
            // لذا نضيف هامشاً يميناً صغيراً أو نتأكد من عدم تجاوز العرض
            // لكن الحل الأفضل هو عدم تغيير اتجاه الحاويات الكبيرة جداً (مثل body أو main wrappers)
            // بل فقط النصوص الداخلية. الكود الحالي يستهدف p, h1, div, etc.
            
            // تحسين للقوائم النقطية
            if(element.tagName === 'LI') {
                element.style.listStylePosition = 'inside'; // تغيير من outside لـ inside لمنع اختفاء النقاط
            }
        }
        // تطبيق التنسيقات دائماً للعربية
        applyStyles(element);
    }
}

// دالة التطبيق (التشغيل)
function applyRTL() {
    if (!isExtensionEnabled || isDomainExcluded) return;

    const elements = document.querySelectorAll(TARGET_SELECTORS);
    elements.forEach(el => processElement(el));
}

// دالة إزالة التأثير
function removeRTL() {
    const elements = document.querySelectorAll('[data-rtl-modified="true"]');
    elements.forEach(element => {
        element.style.direction = '';
        element.style.textAlign = '';
        element.style.listStylePosition = '';
        element.style.fontFamily = '';
        element.style.fontSize = '';
        element.style.lineHeight = '';
        element.removeAttribute('data-rtl-modified');
    });
}

// تحميل الإعدادات والبدء
chrome.storage.sync.get(['isEnabled', 'fontFamily', 'fontSizeAdd', 'lineHeight', 'excludedDomains'], (result) => {
    isExtensionEnabled = result.isEnabled !== undefined ? result.isEnabled : true;
    
    // تحميل الإعدادات
    if (result.fontFamily) currentSettings.fontFamily = result.fontFamily;
    if (result.fontSizeAdd) currentSettings.fontSizeAdd = result.fontSizeAdd;
    if (result.lineHeight) currentSettings.lineHeight = result.lineHeight;

    // التحقق من الاستثناء
    const hostname = window.location.hostname;
    if (result.excludedDomains && result.excludedDomains.includes(hostname)) {
        isDomainExcluded = true;
    }

    if (isExtensionEnabled && !isDomainExcluded) {
        startObserver();
    }
});

// الاستماع للرسائل
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggle") {
        isExtensionEnabled = request.state;
        if (isExtensionEnabled && !isDomainExcluded) {
            applyRTL();
            startObserver();
        } else {
            if (observer) observer.disconnect();
            removeRTL();
        }
    }
    
    if (request.action === "toggle-exclusion") {
        isDomainExcluded = request.isExcluded;
        
        if (isDomainExcluded) {
            // تم استثناء الموقع -> إيقاف كل شيء وإزالة التأثيرات
            if (observer) observer.disconnect();
            removeRTL();
        } else {
            // تم إلغاء الاستثناء -> تشغيل
            if (isExtensionEnabled) {
                applyRTL();
                startObserver();
            }
        }
    }
    
    if (request.action === "update-settings") {
        // تحديث الإعدادات محلياً
        if (request.settings.isEnabled !== undefined) isExtensionEnabled = request.settings.isEnabled;
        if (request.settings.fontFamily !== undefined) currentSettings.fontFamily = request.settings.fontFamily;
        if (request.settings.fontSizeAdd !== undefined) currentSettings.fontSizeAdd = request.settings.fontSizeAdd;
        if (request.settings.lineHeight !== undefined) currentSettings.lineHeight = request.settings.lineHeight;

        // إعادة التطبيق أو الإزالة بناءً على الحالة الجديدة
        if (isExtensionEnabled && !isDomainExcluded) {
            applyRTL();
            startObserver(); // التأكد من تشغيل المراقب عند إعادة التفعيل
        } else {
            // إذا تم التعطيل، نقوم بإزالة التأثيرات فوراً
            if (observer) observer.disconnect();
            removeRTL();
        }
    }

    if (request.action === "context-menu-action") {
        if (lastRightClickedElement) {
            if (request.command === "force-rtl") {
                lastRightClickedElement.style.direction = "rtl";
                lastRightClickedElement.style.textAlign = "right";
                applyStyles(lastRightClickedElement); // تطبيق الخط أيضاً
            } else if (request.command === "force-ltr") {
                lastRightClickedElement.style.direction = "ltr";
                lastRightClickedElement.style.textAlign = "left";
            }
        }
    }
});

function startObserver() {
    applyRTL();
    
    if (!observer) {
        observer = new MutationObserver((mutations) => {
            if (!isExtensionEnabled || isDomainExcluded) return;
            
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                applyRTL();
            }, 200);
        });
    }
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}
})();