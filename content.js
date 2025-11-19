let isExtensionEnabled = true;
const arabicPattern = /[\u0600-\u06FF]/;
let observer = null;
let debounceTimer = null;

// قائمة العناصر المستهدفة
const TARGET_TAGS = ['P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TD', 'TH', 'BLOCKQUOTE', 'TEXTAREA', 'INPUT'];
const TARGET_SELECTORS = 'p, li, h1, h2, h3, h4, h5, h6, td, th, blockquote, textarea, input[type="text"], input[type="search"], .model-response-text';

// دالة للتحقق مما إذا كان النص يبدأ بالعربية (أكثر دقة)
function isArabicContent(text) {
    if (!text) return false;
    // نبحث عن أول حرف "قوي" (ليس مسافة أو علامة ترقيم)
    // إذا كان عربياً، نعتبر النص عربياً
    const firstStrongChar = text.match(/[\w\u0600-\u06FF]/);
    if (firstStrongChar && arabicPattern.test(firstStrongChar[0])) {
        return true;
    }
    // fallback: إذا كان يحتوي على نسبة معينة من العربية (اختياري، لكن الطريقة الأولى غالباً تكفي للعناوين والفقرات)
    return arabicPattern.test(text);
}

// معالجة عنصر واحد
function processElement(element) {
    if (element.getAttribute('data-rtl-modified') === 'true') return;
    
    // تجاهل الأكواد
    if (element.closest('pre') || element.closest('code') || element.classList.contains('code-line')) return;

    const text = element.value || element.textContent;
    
    if (isArabicContent(text)) {
        element.style.direction = 'rtl';
        element.style.textAlign = 'right';
        element.setAttribute('data-rtl-modified', 'true');

        if(element.tagName === 'LI') {
            element.style.listStylePosition = 'outside';
            // element.style.marginRight = '25px'; // قد يسبب مشاكل في التصميم، نكتفي بالاتجاه
        }
    }
}

// دالة التطبيق (التشغيل)
function applyRTL() {
    if (!isExtensionEnabled) return;

    // نستخدم :not لتجنب إعادة فحص العناصر التي تم تعديلها بالفعل لتحسين الأداء
    // ملاحظة: بناء جملة querySelectorAll مع :not لكل عنصر قد يكون طويلاً، لذا سنقوم بالفلترة في JS أو نستخدم selector ذكي
    // للأداء الجيد، سنجلب العناصر ونتحقق من السمة في JS (أسرع من selector معقد جداً)
    
    const elements = document.querySelectorAll(TARGET_SELECTORS);

    elements.forEach(processElement);
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
            if (!isExtensionEnabled) return;
            
            // Debounce: تأخير التنفيذ قليلاً لعدم إرهاق المتصفح عند التغييرات السريعة
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