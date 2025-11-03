// --- [1] الثوابت الأساسية (Constants) ---
export const BASE_CATEGORIES = ["إنسان", "حيوان", "جماد", "نبات", "بلاد"];
export const ARABIC_LETTERS = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'];

// --- [2] الحالة الافتراضية (Default State) ---
export const DEFAULT_STATE = {
    settings: { 
        secs: 10, 
        sounds: true, 
        theme: "dark", 
        // [حذف] تم إزالة الفئات الإضافية
        playerNames: { X: "فريق X", O: "فريق O" },
        playMode: "team",
        teamMembers: { X: [], O: [] }, 
    },
    match: { 
// ... existing code ...
    timer: { 
        intervalId: null, 
        deadline: 0 
    }
};

// --- [3] إدارة الحالة (State Management) ---
// ... existing code ...
