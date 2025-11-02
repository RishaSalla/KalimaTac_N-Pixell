// --- [1] الثوابت الأساسية (Constants) ---
export const BASE_CATEGORIES = ["إنسان", "حيوان", "جماد", "نبات", "بلاد"];
export const ARABIC_LETTERS = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'];

// --- [2] الحالة الافتراضية (Default State) ---
export const DEFAULT_STATE = {
    settings: { 
        secs: 10, 
        sounds: true, 
        theme: "dark", 
        extraCats: [], 
        playerNames: { X: "فريق X", O: "فريق O" },
        playMode: "team",
        teamMembers: { X: [], O: [] }, 
    },
    match: { 
        round: 1, 
        totalScore: { X: 0, O: 0 },
        totalRounds: 3, 
        usedCombinations: [] 
    }, 
    roundState: { 
        board: [], 
        scores: { X: 0, O: 0 }, 
        starter: "X", 
        phase: null, 
        activeCell: null, 
        gameActive: true, 
        winInfo: null,
        teamMemberIndex: { X: 0, O: 0 } 
    },
    timer: { 
        intervalId: null, 
        deadline: 0 
    }
};

// --- [3] إدارة الحالة (State Management) ---

// الحالة الحالية (يتم إنشاء نسخة عميقة من الحالة الافتراضية)
let currentState = JSON.parse(JSON.stringify(DEFAULT_STATE)); 

// دالة للحصول على الحالة الحالية
export function getState() {
    return currentState;
}

// دالة لإعادة تعيين الحالة (لعبة جديدة)، مع الحفاظ على الإعدادات القديمة
export function resetState() {
    const oldSettings = JSON.parse(JSON.stringify(currentState.settings));
    currentState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    currentState.settings = oldSettings; 
}

// دالة لتحميل حالة محفوظة من الذاكرة
export function loadState(newState) {
    currentState = newState;
}
