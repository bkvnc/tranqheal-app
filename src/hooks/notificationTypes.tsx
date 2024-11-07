// src/types/notificationTypes.ts
export const NotificationTypes = {
    // User-related notifications
    JOIN: 'join',
    LEAVE: 'leave',
    
    // Post-related notifications
    POST_SUBMISSION: 'post_submission',
    POST_COMMENT: 'post_comment',
    POST_REACTION: 'post_reaction',
    POST_DELETION: 'post_delete',
    POST_APPROVAL: 'post_approved',
    
    // Comment-related notifications
    COMMENT_REACTION: 'comment_reaction',
    COMMENT_DELETION: 'comment_delete',
    

    // Application-related notifications

    APPLICATION_SUBMISSION: 'application_submission',
    APPLICATION_APPROVAl: 'application_approved',
    APPLICATION_REJECTION: 'application_rejection',
    APPLICATION_REVIEW: 'application_review',
    
    // Subscription-related notifications
    SUB_SUCCESS: 'subscription_success',
    SUB_CREATED: 'subscription_created',
    SUB_EXPIRING: 'subscription_expiring',
    SUB_EXPIRED: 'subscription_expired',
    SUB_CANCELLED: 'subscription_cancelled',
    SUB_RENEWAL: 'subscription_renewal',
    SUB_RENEWAL_APPROVAL: 'subscription_renewal_approval',
    SUB_RENEWAL_REJECTION: 'subscription_renewal_rejection',
    SUB_RENEWAL_REVIEW: 'subscription_renewal_review',
    
    // Payment-related notifications
    PAYMENT_SUCCESS: 'payment_success',
    PAYMENT_FAILURE: 'payment_failure',

    // Matching
    MATCH: 'match',
} as const;

export type NotificationType = typeof NotificationTypes[keyof typeof NotificationTypes]; 
