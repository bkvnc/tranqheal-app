import React, { useState, useEffect, useContext } from 'react'; 
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal, Alert, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import moment from 'moment';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../providers';
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, deleteDoc } from 'firebase/firestore';

export const PostDetailsScreen = ({ route, navigation }) => {
  const { userType, user } = useContext(AuthenticatedUserContext); // Access user context
  const { postId, postTitle, postContent, postAuthor, postTime } = route.params;

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likes, setLikes] = useState(0);
  const [userReacted, setUserReacted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [commentToEdit, setCommentToEdit] = useState(null);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false); 
  const [commentToReportId, setCommentToReportId] = useState(null); 

  // Fetch comments from Firestore when component mounts
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const db = getFirestore();
        const commentsRef = collection(db, 'comments');
        const q = query(commentsRef, where('postId', '==', postId));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          setComments([]); // Handle empty comments
          return;
        }

        const fetchedComments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setComments(fetchedComments);
      } catch (error) {
        console.error("Error fetching comments: ", error);
        Alert.alert('Error', 'Could not fetch comments.');
      }
    };

    fetchComments();
  }, [postId]);

  // Handle adding a new comment
  const handleAddComment = async () => {
    if (newComment.trim()) {
      const newCommentObj = {
        content: newComment,
        dateCreated: new Date(),
        author: user.displayName || 'You', // Use display name or fallback to 'You'
        authorId: user.uid, // Use the authenticated user's ID
        postId: postId,
      };
      try {
        const db = getFirestore();
        await addDoc(collection(db, 'comments'), newCommentObj); 
        setComments([newCommentObj, ...comments]); 
        setNewComment('');
      } catch (error) {
        console.error("Error adding comment: ", error);
        Alert.alert('Error', 'Could not add comment.');
      }
    } else {
      Alert.alert('Error', 'Please enter a comment before submitting.');
    }
  };

  // Handle user reaction (like/unlike)
  const handleReact = async () => {
    try {
      const db = getFirestore();
      const postRef = doc(db, 'posts', postId);
      if (!userReacted) {
        // Add a like
        setLikes(likes + 1);
      } else {
        // Remove a like
        setLikes(likes > 0 ? likes - 1 : 0);
      }
      setUserReacted(!userReacted);
      await updateDoc(postRef, {
        likes: userReacted ? likes - 1 : likes + 1,
      });
    } catch (error) {
      console.error("Error updating reaction: ", error);
      Alert.alert('Error', 'Could not update reaction.');
    }
  };

  // Handle editing a comment
  const handleEditComment = async (commentId, updatedContent) => {
    const commentRef = doc(getFirestore(), 'comments', commentId);
    await updateDoc(commentRef, { content: updatedContent });
    // Update the local state
    setComments(prevComments =>
      prevComments.map(comment =>
        comment.id === commentId ? { ...comment, content: updatedContent } : comment
      )
    );
    setIsEditModalVisible(false);
  };

  // Handle deleting a comment
  const handleDeleteComment = async (commentId) => {
    const commentRef = doc(getFirestore(), 'comments', commentId);
    await deleteDoc(commentRef);
    // Update the local state
    setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
  };

  // Render a single comment
  const renderCommentItem = ({ item }) => (
    <View style={styles.commentContainer}>
      <Text style={styles.commentAuthor}>{item.author}</Text>
      <Text style={styles.commentContent}>{item.content}</Text>
      <Text style={styles.commentDate}>{moment(item.dateCreated.toDate()).fromNow()}</Text>
      <TouchableOpacity onPress={() => {
        setCommentToEdit(item);
        setIsEditModalVisible(true);
      }}>
        <Ionicons name="create-outline" size={20} color="#007AFF" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDeleteComment(item.id)}>
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
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

        {/* Reaction and Comments Section */}
        <View style={styles.reactContainer}>
          <TouchableOpacity onPress={() => setShowComments(!showComments)} style={styles.iconButton}>
            <Ionicons name="chatbox-ellipses-outline" size={24} color="#333" />
            <Text>{comments.length}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleReact} style={styles.iconButton}>
            <Ionicons name={userReacted ? 'heart' : 'heart-outline'} size={24} color={userReacted ? '#d9534f' : '#333'} />
            <Text>{likes}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {showComments && (
          <>
            <FlatList
              data={comments}
              renderItem={renderCommentItem}
              keyExtractor={(item) => item.id}
              style={styles.commentList}
            />

            {/* Comment Input */}
            <View style={styles.addCommentContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                value={newComment}
                onChangeText={(text) => setNewComment(text)}
              />
              <TouchableOpacity style={styles.submitCommentButton} onPress={handleAddComment}>
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Edit Comment Modal */}
        {isEditModalVisible && (
          <Modal visible={isEditModalVisible} transparent animationType="slide">
            {/* Modal content for editing a comment */}
            {/* ... */}
          </Modal>
        )}

        {/* Report Comment Modal */}
        {isReportModalVisible && (
          <Modal visible={isReportModalVisible} transparent animationType="slide">
            {/* Report confirmation modal content */}
            {/* ... */}
          </Modal>
        )}
      </View>
    </RootLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  postTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#888',
  },
  authorText: {
    fontSize: 12,
    color: '#888',
  },
  postContent: {
    fontSize: 16,
    marginBottom: 16,
  },
  reactContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  iconButton: {
    alignItems: 'center',
  },
  commentList: {
    marginVertical: 16,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 8,
    marginRight: 8,
  },
  submitCommentButton: {
    backgroundColor: '#007BFF',
    padding: 8,
    borderRadius: 4,
  },
  submitButtonText: {
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  actionText: {
    color: '#007BFF',
    marginHorizontal: 8,
  },
  commentItem: {
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  commentAuthor: {
    fontWeight: 'bold',
  },
  commentContent: {
    marginVertical: 4,
  },
  commentDate: {
    fontSize: 12,
    color: '#888',
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButtonText: {
    color: '#FF0000',
  },
});
