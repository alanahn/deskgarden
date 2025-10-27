const DEFAULT_SENTENCE_SPLIT_REGEX = /[^.!?？！。…]+[.!?？！。…]+|[^.!?？！。…]+$/g;
export function clampTextBySentences(text, min = 10, max = 14) {
    if (!text)
        return text;
    const sentences = text.match(DEFAULT_SENTENCE_SPLIT_REGEX);
    if (!sentences || sentences.length <= max) {
        return text;
    }
    return sentences.slice(0, max).join(" ").trim();
}
export function clampTextByChars(text, max = 800) {
    if (!text)
        return text;
    if (text.length <= max)
        return text;
    return text.slice(0, max).trim();
}
export function clampArray(arr, min = 5, max = 7) {
    if (!Array.isArray(arr))
        return arr;
    if (arr.length <= max)
        return arr;
    return arr.slice(0, max);
}
export function normalizeAfter(payload, limits = {}) {
    const { sentenceMin = 10, sentenceMax = 14, charMax = 800, itemMin = 5, itemMax = 7, } = limits;
    const result = { ...payload };
    if (typeof payload.afterImageDescription === "string") {
        let desc = payload.afterImageDescription;
        desc = clampTextBySentences(desc, sentenceMin, sentenceMax);
        desc = clampTextByChars(desc, charMax);
        result.afterImageDescription = desc;
    }
    if (Array.isArray(payload.changedItems)) {
        const items = clampArray(payload.changedItems, itemMin, itemMax);
        if (items) {
            result.changedItems = items;
        }
    }
    return result;
}
