const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { https } = require('firebase-functions/v2');
const admin = require('firebase-admin');

admin.initializeApp();
const firestore = admin.firestore();

// 1. New Professional Application Notification
exports.notifyNewProfessionalApplication = onDocumentCreated('organizations/{organizationId}/applications/{applicationId}', async (event) => {
  try {
    const applicationData = event.data?.data();
    if (!applicationData) return;

    const notificationData = {
      recipientId: applicationData.organizationId,
      recipientType: 'organization',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      message: `A new professional has applied to your organization.`,
      type: 'application_submission',
      isRead: false,
      additionalData: { applicationId: event.params.applicationId },
    };

    await firestore.collection('notifications').add(notificationData);
  } catch (error) {
    console.error("Error in notifyNewProfessionalApplication:", error);
  }
});

// 2. Post in Forum Notification
exports.notifyUserPostOnForum = onDocumentCreated('forums/{forumId}/posts/{postId}', async (event) => {
  try {
    const postData = event.data?.data();
    if (!postData) return;

    const notificationData = {
      recipientId: postData.authorId,
      recipientType: postData.authorType,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      message: `${postData.authorName || 'A user'} has posted in your forum.`,
      type: 'user_post',
      isRead: false,
      additionalData: { forumId: event.params.forumId, postId: event.params.postId },
    };

    await firestore.collection('notifications').add(notificationData);
  } catch (error) {
    console.error("Error in notifyUserPostOnForum:", error);
  }
});

// 3. Post Status Update Notification
exports.notifyPostStatusUpdate = onDocumentUpdated('forums/{forumId}/posts/{postId}', async (event) => {
  try {
    const postData = event.data?.data();
    if (!postData || postData.status !== 'approved') return;

    const notificationData = {
      recipientId: postData.authorId,
      recipientType: postData.authorType,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      message: `Your post has been approved.`,
      type: 'post_approved',
      isRead: false,
      additionalData: { forumId: event.params.forumId, postId: event.params.postId },
    };

    await firestore.collection('notifications').add(notificationData);
  } catch (error) {
    console.error("Error in notifyPostStatusUpdate:", error);
  }
});

// 4. Comment Notification on Org Post
exports.notifyCommentOnOrgPost = onDocumentCreated('forums/{forumId}/posts/{postId}/comments/{commentId}', async (event) => {
  try {
    const commentData = event.data?.data();
    if (!commentData) return;

    const notificationData = {
      recipientId: commentData.organizationId,
      recipientType: 'organization',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      message: `A user has commented on your post.`,
      type: 'new_comment',
      isRead: false,
      additionalData: { forumId: event.params.forumId, postId: event.params.postId, commentId: event.params.commentId },
    };

    await firestore.collection('notifications').add(notificationData);
  } catch (error) {
    console.error("Error in notifyCommentOnOrgPost:", error);
  }
});

// 5. Subscription Status Updates
exports.notifySubscriptionUpdate = onDocumentUpdated('subscriptions/{subscriptionId}', async (event) => {
  try {
    const subscriptionData = event.data?.data();
    if (!subscriptionData) return;

    let message = 'Your subscription status has been updated.';
    switch (subscriptionData.status) {
      case 'active':
        message = 'Your subscription has been activated.';
        break;
      case 'expired':
        message = 'Your subscription has expired.';
        break;
      case 'renewal_pending':
        message = 'Your subscription renewal is pending.';
        break;
      case 'canceled':
        message = 'Your subscription has been canceled.';
        break;
    }

    const notificationData = {
      recipientId: subscriptionData.organizationId,
      recipientType: 'organization',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      message,
      type: 'subscription_update',
      isRead: false,
      additionalData: { subscriptionId: event.params.subscriptionId },
    };

    await firestore.collection('notifications').add(notificationData);
  } catch (error) {
    console.error("Error in notifySubscriptionUpdate:", error);
  }
});

// 6. Subscription Expiry Warning
exports.checkSubscriptionsExpiry = https.onRequest(async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);

    const subscriptionsSnapshot = await firestore.collection('subscriptions')
      .where('expiryDate', '==', admin.firestore.Timestamp.fromDate(sevenDaysLater))
      .get();

    const notifications = [];
    subscriptionsSnapshot.forEach(doc => {
      const subscriptionData = doc.data();
      const notificationData = {
        recipientId: subscriptionData.organizationId,
        recipientType: 'organization',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        message: `Your subscription will expire in 7 days.`,
        type: 'subscription_expiry_warning',
        isRead: false,
        additionalData: { subscriptionId: doc.id },
      };
      notifications.push(firestore.collection('notifications').add(notificationData));
    });

    await Promise.all(notifications);
    res.status(200).send('Expiry notifications sent successfully.');
  } catch (error) {
    console.error('Error sending expiry notifications:', error);
    res.status(500).send('Error sending expiry notifications.');
  }
});

// 7. Reaction Notification on Comment
exports.notifyReactionOnComment = onDocumentCreated('forums/{forumId}/posts/{postId}/comments/{commentId}/reactions/{reactionId}', async (event) => {
  try {
    const reactionData = event.data?.data();
    if (!reactionData) return;

    const notificationData = {
      recipientId: reactionData.seekerId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      message: `Someone reacted to your comment.`,
      type: 'reaction',
      isRead: false,
      additionalData: { postId: event.params.postId, commentId: event.params.commentId },
    };

    await firestore.collection('notifications').add(notificationData);
  } catch (error) {
    console.error("Error in notifyReactionOnComment:", error);
  }
});
