// src/types/notificationTypes.ts
export const NotificationTypes = {
    JOIN: 'join',
    LEAVE: 'leave',
    POST_SUBMISSION: 'post_submission',
    POST_COMMENT: 'post_comment',
    POST_REACTION: 'post_reaction',
    POST_DELETION: 'post_delete',
    COMMENT_REACTION: 'comment_reaction',
    COMMENT_DELETION: 'comment_delete',
    APPLICATION_APPROVAL: 'application_approval',
    APPLICATION_REJECTION: 'application_rejection',
    APPLICATION_SUBMISSION: 'application_submission',
    APPLICATION_REVIEW: 'application_review',
    SUB_CREATED: 'subscription_created',
    SUB_EXPIRING: 'subscription_expiring',
    SUB_EXPIRED: 'subscription_expired',
    SUB_CANCELLED: 'subscription_cancelled',
    SUB_RENEWAL: 'subscription_renewal',
    SUB_RENEWAL_APPROVAL: 'subscription_renewal_approval',
    SUB_RENEWAL_REJECTION: 'subscription_renewal_rejection',
    SUB_RENEWAL_REVIEW: 'subscription_renewal_review',

} as const;

export type NotificationType = typeof NotificationTypes[keyof typeof NotificationTypes];
