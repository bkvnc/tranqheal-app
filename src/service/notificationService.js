// Firebase setup
import * as admin from 'firebase-admin';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';

admin.initializeApp();
const firestore = admin.firestore();




// A. Notifications for Organizations (Web Users)

// 1. New Professional Application
exports.notifyNewProfessionalApplication = onDocumentCreated('applications/{applicationId}', async (event) => {
  const applicationData = event.data?.data();
  if (!applicationData) return;

  const notificationData = {
    recipientId: applicationData.organizationId,
    recipientType: 'organization',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    message: `A new professional has applied to your organization.`,
    type: 'new_application',
    isRead: false,
    additionalData: { applicationId: event.params.applicationId }
  };

  await firestore.collection('notifications').add(notificationData);
});

// 2. User Posts on Forum
exports.notifyUserPostOnForum = onDocumentCreated('forums/{forumId}/posts/{postId}', async (event) => {
  const postData = event.data?.data();
  if (!postData) return;

  const notificationData = {
    recipientId: postData.organizationId,
    recipientType: 'organization',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    message: `A user has posted in your forum.`,
    type: 'user_post',
    isRead: false,
    additionalData: { forumId: event.params.forumId, postId: event.params.postId }
  };

  await firestore.collection('notifications').add(notificationData);
});

// 3. Comments on Organization’s Post
exports.notifyCommentOnOrgPost = onDocumentCreated('forums/{forumId}/posts/{postId}/comments/{commentId}', async (event) => {
  const commentData = event.data?.data();
  if (!commentData) return;

  const notificationData = {
    recipientId: commentData.organizationId,
    recipientType: 'organization',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    message: `A user has commented on your post.`,
    type: 'new_comment',
    isRead: false,
    additionalData: { forumId: event.params.forumId, postId: event.params.postId, commentId: event.params.commentId }
  };

  await firestore.collection('notifications').add(notificationData);
});

// 4. Forum Approved
exports.notifyForumApproval = onDocumentUpdated('forums/{forumId}', async (event) => {
  const forumData = event.data?.data();
  if (!forumData || forumData.status !== 'approved') return;

  const notificationData = {
    recipientId: forumData.organizationId,
    recipientType: 'organization',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    message: `Your forum has been approved.`,
    type: 'forum_approved',
    isRead: false,
    additionalData: { forumId: event.params.forumId }
  };

  await firestore.collection('notifications').add(notificationData);
});

// 5. Subscription Status Updates
exports.notifySubscriptionUpdate = onDocumentUpdated('subscriptions/{subscriptionId}', async (event) => {
  const subscriptionData = event.data?.data();
  if (!subscriptionData) return;

  const notificationData = {
    recipientId: subscriptionData.organizationId,
    recipientType: 'organization',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    message: `Your subscription status has been updated.`,
    type: 'subscription_update',
    isRead: false,
    additionalData: { subscriptionId: event.params.subscriptionId }
  };

  await firestore.collection('notifications').add(notificationData);
});

// B. Notifications for Seekers (Mobile Users)

// 1. Reaction to Comment
exports.notifyReactionOnComment = onDocumentCreated('posts/{postId}/comments/{commentId}/reactions/{reactionId}', async (event) => {
  const reactionData = event.data?.data();
  if (!reactionData) return;

  const notificationData = {
    recipientId: reactionData.seekerId,
    recipientType: 'seeker',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    message: `Someone reacted to your comment.`,
    type: 'reaction',
    isRead: false,
    additionalData: { postId: event.params.postId, commentId: event.params.commentId }
  };

  await firestore.collection('notifications').add(notificationData);
});

// 2. Comment on Their Post
exports.notifyCommentOnSeekerPost = onDocumentCreated('posts/{postId}/comments/{commentId}', async (event) => {
  const commentData = event.data?.data();
  if (!commentData) return;

  const notificationData = {
    recipientId: commentData.postOwnerId,
    recipientType: 'seeker',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    message: `Someone commented on your post.`,
    type: 'new_comment',
    isRead: false,
    additionalData: { postId: event.params.postId, commentId: event.params.commentId }
  };

  await firestore.collection('notifications').add(notificationData);
});

// 3. Professional Matching
exports.notifySeekerMatch = onDocumentCreated('matches/{matchId}', async (event) => {
  const matchData = event.data?.data();
  if (!matchData) return;

  const notificationData = {
    recipientId: matchData.seekerId,
    recipientType: 'seeker',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    message: `You have been matched with a professional.`,
    type: 'match',
    isRead: false,
    additionalData: { matchId: event.params.matchId }
  };

  await firestore.collection('notifications').add(notificationData);
});

// 4. Post Approved
exports.notifyPostApproval = onDocumentUpdated('posts/{postId}', async (event) => {
  const postData = event.data?.data();
  if (!postData || postData.status !== 'approved') return;

  const notificationData = {
    recipientId: postData.seekerId,
    recipientType: 'seeker',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    message: `Your post has been approved.`,
    type: 'post_approved',
    isRead: false,
    additionalData: { postId: event.params.postId }
  };

  await firestore.collection('notifications').add(notificationData);
});

// C. Notifications for Professionals (Mobile Users)

// 1. Seeker Matching
exports.notifyProfessionalMatch = onDocumentCreated('matches/{matchId}', async (event) => {
  const matchData = event.data?.data();
  if (!matchData) return;

  const notificationData = {
    recipientId: matchData.professionalId,
    recipientType: 'professional',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    message: `A seeker has been matched with you.`,
    type: 'match',
    isRead: false,
    additionalData: { matchId: event.params.matchId }
  };

  await firestore.collection('notifications').add(notificationData);
});

// 2. Reaction to Comment
exports.notifyReactionOnProfessionalComment = onDocumentCreated('posts/{postId}/comments/{commentId}/reactions/{reactionId}', async (event) => {
  const reactionData = event.data?.data();
  if (!reactionData) return;

  const notificationData = {
    recipientId: reactionData.professionalId,
    recipientType: 'professional',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    message: `Someone reacted to your comment.`,
    type: 'reaction',
    isRead: false,
    additionalData: { postId: event.params.postId, commentId: event.params.commentId }
  };

  await firestore.collection('notifications').add(notificationData);
});

// 3. Comment on Their Post
exports.notifyCommentOnProfessionalPost = onDocumentCreated('posts/{postId}/comments/{commentId}', async (event) => {
  const commentData = event.data?.data();
  if (!commentData) return;

  const notificationData = {
    recipientId: commentData.professionalId,
    recipientType: 'professional',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    message: `Someone commented on your post.`,
    type: 'new_comment',
    isRead: false,
    additionalData: { postId: event.params.postId, commentId: event.params.commentId }
  };

  await firestore.collection('notifications').add(notificationData);
});

// 4. Application Status Update
exports.notifyApplicationStatusUpdate = onDocumentUpdated('applications/{applicationId}', async (event) => {
  const applicationData = event.data?.data();
  if (!applicationData) return;

  const notificationData = {
    recipientId: applicationData.professionalId,
    recipientType: 'professional',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    message: `Your application status has been updated.`,
    type: 'application_status',
    isRead: false,
    additionalData: { applicationId: event.params.applicationId }
  };

  await firestore.collection('notifications').add(notificationData);
});



