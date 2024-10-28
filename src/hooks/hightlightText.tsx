export const highlightText = (text: string, blacklistedWords: string[]) => {
    const regex = new RegExp(`\\b(${blacklistedWords.join("|")})\\b`, "gi");
    return text.replace(regex, "<span class='highlight'>$1</span>");
};