// src/utils/validationUtils.ts

/**
 * Checks if the content contains any blacklisted words.
 *
 * @param content - The content to check (e.g., post, comment, forum description).
 * @param blacklistedWords - Array of blacklisted words.
 * @returns `true` if any blacklisted word is found, otherwise `false`.
 */
export const containsBlacklistedWords = (content: string, blacklistedWords: string[]): boolean => {
    if (!blacklistedWords.length) return false;

    // Create a regex pattern from the blacklisted words
    const pattern = `\\b(${blacklistedWords.join('|')})\\b`;
    const regex = new RegExp(pattern, 'i');

    // Test if the content contains any of the blacklisted words
    return regex.test(content);
};


/**
 * Checks if the content length is within the specified limits.
 *
 * @param content - The content to validate.
 * @param minLength - Minimum length required.
 * @param maxLength - Maximum length allowed.
 * @returns `true` if the content length is valid, otherwise `false`.
 */
export const isContentLengthValid = (content: string, minLength: number, maxLength: number): boolean => {
    const length = content.length;
    return length >= minLength && length <= maxLength;
};


/**
 * Validates the format of an email address.
 *
 * @param email - The email address to validate.
 * @returns `true` if the email is valid, otherwise `false`.
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};


/**
 * Checks if the content is empty or just whitespace.
 *
 * @param content - The content to check.
 * @returns `true` if the content is not empty, otherwise `false`.
 */
export const isContentNotEmpty = (content: string): boolean => {
    return content.trim().length > 0;
};

