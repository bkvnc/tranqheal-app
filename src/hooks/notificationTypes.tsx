// src/types/notificationTypes.ts
export const NotificationTypes = {
    JOIN: 'join',
    LEAVE: 'leave',
    POST_SUBMISSION: 'post_submission',
    POST_COMMENT: 'post_comment',
    POST_REACTION: 'post_reaction',
    POST_DELETION: 'post_delete',
} as const;

export type NotificationType = typeof NotificationTypes[keyof typeof NotificationTypes];
