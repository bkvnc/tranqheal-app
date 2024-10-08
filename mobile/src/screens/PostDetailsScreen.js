import React, { useState, useEffect, useContext } from 'react'; 
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Modal, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import moment from 'moment';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../../shared/providers';

export const PostDetailsScreen = ({ route, navigation }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  const { postId, postTitle, postContent, postAuthor, postTime, userId } = route.params;

  const [comments, setComments] = useState([
    { id: '1', author: 'User1', content: 'This is so insightful!', time: moment().subtract(1, 'hours').fromNow(), userId: 'user1', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
    { id: '2', author: 'User2', content: 'I completely agree!', time: moment().subtract(2, 'hours').fromNow(), userId: 'user2', avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
  ]);

  const [newComment, setNewComment] = useState('');
  const [likes, setLikes] = useState(10);
  const [userReacted, setUserReacted] = useState(null);
  const [commentToEdit, setCommentToEdit] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [isMember, setIsMember] = useState(true); // Placeholder for membership check

  useEffect(() => {
    checkMembership();
  }, []);

  const checkMembership = async () => {
    setIsMember(true); // Assuming the user is a member
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const newCommentObj = {
        id: String(comments.length + 1),
        author: 'You',
        content: newComment,
        time: moment().fromNow(),
        userId: userId,
        avatar: 'https://randomuser.me/api/portraits/lego/5.jpg' // Placeholder avatar for the user
      };
      setComments([newCommentObj, ...comments]);
      setNewComment('');
    } else {
      Alert.alert('Error', 'Please enter a comment before submitting.');
    }
  };

  const handleReact = () => {
    if (userReacted !== 'like') {
      setLikes(likes + 1);
      setUserReacted('like');
    } else {
      setLikes(likes - 1);
      setUserReacted(null);
    }
  };

  const handleEditComment = (commentId) => {
    const commentToEdit = comments.find(comment => comment.id === commentId);
    setCommentToEdit(commentToEdit);
    setIsEditModalVisible(true);
  };

  const saveEditedComment = () => {
    setComments(comments.map(comment =>
      comment.id === commentToEdit.id
        ? { ...comment, content: commentToEdit.content }
        : comment
    ));
    setIsEditModalVisible(false);
  };

  const handleDeleteComment = (commentId) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => setComments(comments.filter(comment => comment.id !== commentId)) },
      ]
    );
  };

  const confirmReport = (type, id) => {
    Alert.alert(
      `Report ${type}`,
      `Are you sure you want to report this ${type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', onPress: () => handleReport(type, id) },
      ]
    );
  };

  const handleReport = (type, id) => {
    Alert.alert(`Report ${type}`, `You have reported the ${type}.`);
    setIsReportModalVisible(false);
  };

  const toggleComments = () => {
    setShowComments(prevState => !prevState);
  };

  const handleEllipsisPress = (type, item) => {
    if (type === 'comment') {
      if (item.userId === userId) {
        Alert.alert('Actions', null, [
          { text: 'Edit', onPress: () => handleEditComment(item.id) },
          { text: 'Delete', onPress: () => handleDeleteComment(item.id) },
          { text: 'Cancel', style: 'cancel' },
        ]);
      } else {
        confirmReport('comment', item.id);
      }
    } else if (type === 'post') {
      if (postAuthor === 'You') {
        Alert.alert('Actions', null, [
          { text: 'Edit Post', onPress: () => {} }, // Add functionality to edit post
          { text: 'Delete Post', onPress: () => {} }, // Add functionality to delete post
          { text: 'Cancel', style: 'cancel' },
        ]);
      } else {
        confirmReport('post', postId);
      }
    }
  };

  const renderCommentItem = ({ item }) => (
    <View style={styles.commentImage}>
      <Image source={{ uri: item.avatar }} style={styles.commentAvatar} />
        <View style={styles.commentContainer}>
          <View style={styles.commentContentContainer}>
            <Text style={styles.commentAuthor}>{item.author}</Text>
            <Text style={styles.commentContent}>{item.content}</Text>
            <Text style={styles.commentTime}>{item.time}</Text>
            <View style={styles.commentActions}>
              <TouchableOpacity onPress={() => handleEllipsisPress('comment', item)}>
                <Ionicons name="ellipsis-horizontal" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
    </View>
  );

  return (
    <RootLayout navigation={navigation} screenName="Post Details" userType={userType}>
      <View style={styles.container}>
        <Text style={styles.postTitle}>{postTitle}</Text>
        <View style={styles.metaContainer}>
          <Text style={styles.timeText}>{postTime}</Text>
          <Text style={styles.authorText}>by {postAuthor}</Text>
        </View>
        <Text style={styles.postContent}>{postContent}</Text>
        <View style={styles.reactContainer}>
          <TouchableOpacity onPress={toggleComments} style={styles.commentButton}>
            <Ionicons name="chatbox-ellipses-outline" size={24} />
            <Text style={styles.commentCountText}>{comments.length}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReact} style={styles.reactButton}>
            <Ionicons name={userReacted === 'like' ? 'heart' : 'heart-outline'} size={24} color={userReacted === 'like' ? '#d9534f' : '#333'} />
            <Text style={styles.reactText}>{likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleEllipsisPress('post', { postId })} style={styles.reactButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {showComments && (
          <>
            <Text style={styles.commentSectionTitle}>Comments</Text>
            <FlatList
              data={comments}
              renderItem={renderCommentItem}
              keyExtractor={(item) => item.id}
              style={styles.commentList}
            />
          </>
        )}

        {isMember ? (
          <View style={styles.addCommentContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              value={newComment}
              onChangeText={setNewComment}
            />
            <TouchableOpacity style={styles.submitCommentButton} onPress={handleAddComment}>
              <Text style={styles.submitCommentButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.notMemberText}>You must join this forum to comment.</Text>
        )}
      </View>
    </RootLayout>
  );
};

// Style
const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  postTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  authorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  postContent: {
    fontSize: 16,
    marginBottom: 16,
  },
  reactContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  reactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  reactText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentCountText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  commentList: {
    marginBottom: 16,
  },
  commentImage: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  commentContainer: {
    backgroundColor: '#F4F4F4',
    padding: 12,  // Adjust padding for consistent spacing
    borderRadius: 15,
    marginBottom: 15,
    flex: 1,      // Allow the container to take up available space based on content
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  commentContentContainer: {
    flex: 1,
  },
  commentAuthor: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  commentContent: {
    fontSize: 14,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: '#666',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  submitCommentButton: {
    backgroundColor: '#7129F2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 8,
    borderRadius: 4,
  },
  submitCommentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  notMemberText: {
    color: '#dc3545',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});


export default PostDetailsScreen;
