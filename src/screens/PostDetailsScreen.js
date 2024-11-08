import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal, Alert, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import moment from 'moment';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../providers';
import { getFirestore, collection, addDoc, getDocs, getDoc, query, where, doc, updateDoc, deleteDoc, setDoc, } from 'firebase/firestore';
import { auth, firestore } from 'src/config';

export const PostDetailsScreen = ({ route, navigation }) => {
  const { user, userType } = useContext(AuthenticatedUserContext);
  const { postId, postTitle, postContent, postTime, forumId } = route.params;
  const [authorName, setAuthorName] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [reacts, setReacts] = useState(0);
  const [userReacted, setUserReacted] = useState(false);
  const [userCommentReacted, setUserCommentReacted] = useState({});
  const [showComments, setShowComments] = useState(false);
  const [isEditPostModalVisible, setIsEditPostModalVisible] = useState(false); 
  const [isEditCommentModalVisible, setIsEditCommentModalVisible] = useState(false);
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);
  const [commentToEdit, setCommentToEdit] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editedTitle, setEditedTitle] = useState(postTitle);
  const [editedContent, setEditedContent] = useState(postContent);
  const [postAuthor, setPostAuthor] = useState('');
  const [blacklistedWords, setBlacklistedWords] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (auth.currentUser) {
          const userRef = doc(firestore, 'users', auth.currentUser.uid);
          const userSnapshot = await getDoc(userRef);
  
          if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            setAuthorName(`${userData.firstName} ${userData.lastName}`);

          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Could not fetch user data.');
      }
    };
  
    fetchUserData();
    fetchPostDetails();
  }, [auth.currentUser]);

  //Fetch Post Details
  const fetchPostDetails = async () => {
    try {
      const postRef = doc(firestore, `forums/${forumId}/posts`, postId);
      const postSnapshot = await getDoc(postRef);
  
      if (postSnapshot.exists()) {
        const postData = postSnapshot.data();
      
        setEditedTitle(postData.title);
        setEditedContent(postData.content);
        setReacts(postData.reacted || 0);
        setPostAuthor(postData.authorId);
        
        // Check if the current user has reacted
        const reactedBy = postData.reactedBy || [];
        setUserReacted(reactedBy.includes(user.uid));

      } else {
        console.error('Post not found.');
        Alert.alert('Error', 'Post not found.');
      }
    } catch (error) {
      console.error('Error fetching post details:', error);
      Alert.alert('Error', 'Could not fetch post details.');
    }
  };
  

  // Function to handle the delete post action
const handleDeletePost = () => {
  Alert.alert(
    'Delete Post',
    'Are you sure you want to delete this post?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'OK',
        onPress: async () => {
          try {
            const postRef = doc(firestore, `forums/${forumId}/posts`, postId);
            await deleteDoc(postRef);
            Alert.alert('Success', 'Post deleted successfully.');
            navigation.goBack(); // Go back to the previous screen after deletion
          } catch (error) {
            console.error('Error deleting post:', error);
            Alert.alert('Error', 'Could not delete the post.');
          }
        },
      },
    ],
    { cancelable: false } // Prevents dismissal of the alert by tapping outside
  );
};

//Fecth Comments
useEffect(() => {
  const fetchComments = async () => {
    try {
      const commentsRef = collection(firestore, `forums/${forumId}/posts/${postId}/comments`);
      const snapshot = await getDocs(commentsRef);

      if (!snapshot.empty) {
        const fetchedComments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          dateCreated: doc.data().dateCreated ? doc.data().dateCreated.toDate() : null,
        }));
        setComments(fetchedComments);
      } else {
        console.log('No comments found for this post.');
        setComments([]); // Clear the comments if none exist
      }
    } catch (error) {
      console.error("Error fetching comments: ", error.message); // Log the exact error message
      Alert.alert('Error', 'Could not fetch comments.');
    }
  };

  fetchComments();
}, [postId]);

  // Helper function to create a flexible regex pattern that detects repeated letters
  const createFlexibleRegex = (word) => {
      const pattern = word
        .split('')
        .map(letter => `[${letter}]{1,3}`)  // Allow up to 3 repetitions of each character
        .join('[\\W_]*');  // Allow non-word characters (including underscores) between letters

      return new RegExp(`${pattern}`, 'i');  // Case-insensitive match, no word boundaries
  };

  // Check if text contains any blacklisted words or their variations
  const containsBlacklistedWord = (text, blacklistedWords) => {
    return blacklistedWords.some((word) => {
      const regex = createFlexibleRegex(word);  // Create a flexible regex for each blacklisted word
      return regex.test(text);  // Test the text against the flexible regex pattern
    });
  };

  //Fetch blacklisted words
  useEffect(() => {
    const fetchBlacklistedWords = async () => {
      try {
        const blacklistedWordsRef = collection(firestore, 'blacklistedWords');
        const snapshot = await getDocs(blacklistedWordsRef);
        setBlacklistedWords(snapshot.docs.map(doc => doc.data().word.toLowerCase()));
      } catch (error) {
        console.error("Error fetching blacklisted words:", error);
      }
    };
  
    fetchBlacklistedWords();
  }, []);

  //Edit Post Handle
  const handleSavePostEdits = async () => {
    // Check for blacklisted words in title and content
    const titleLower = editedTitle.toLowerCase();
    const contentLower = editedContent.toLowerCase();
  
    const isTitleBlacklisted = containsBlacklistedWord(titleLower, blacklistedWords);
    const isContentBlacklisted = containsBlacklistedWord(contentLower, blacklistedWords);
  
    if (isTitleBlacklisted || isContentBlacklisted) {
      Alert.alert('Error', 'Your post contains blacklisted words. Please remove them and try again.');
      return;
    }
  
    try {
      const postRef = doc(firestore, `forums/${forumId}/posts`, postId);
      await updateDoc(postRef, {
        title: editedTitle,
        content: editedContent,
      });
      
      // Update local state to reflect changes
      setEditedTitle(editedTitle);
      setEditedContent(editedContent);
      setIsEditPostModalVisible(false);
      Alert.alert('Success', 'Post updated successfully.');
    } catch (error) {
      console.error('Error updating post:', error);
      Alert.alert('Error', 'Could not update the post.');
    }
  };

  //Handle Comment
  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment before submitting.');
      return;
    }
  
    const commentLower = newComment.toLowerCase();
    const isCommentBlacklisted = containsBlacklistedWord(commentLower, blacklistedWords);
  
    if (isCommentBlacklisted) {
      Alert.alert('Error', 'Your comment contains blacklisted words. Please remove them and try again.');
      return;
    }
  
    // Proceed to add the comment if no blacklisted words are found
    const newCommentObj = {
      content: newComment,
      dateCreated: new Date(),
      author: authorName,
      authorId: user.uid,
    };
  
    try {
      const db = getFirestore();
      const docRef = await addDoc(collection(db, `forums/${forumId}/posts/${postId}/comments`), newCommentObj);
  
      // Add the new comment to the local state
      setComments([{ ...newCommentObj, id: docRef.id }, ...comments]);
      setNewComment(''); // Clear the input field
  
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert('Error', 'Could not add comment.');
    }
  };

   //Edit Comment Handle
   const handleEditComment = async () => {
    if (!editCommentText.trim() || !commentToEdit) {
      Alert.alert('Error', 'Please enter some text to update the comment.');
      return;
    }
  
    const commentLower = editCommentText.toLowerCase();
    const isCommentBlacklisted = containsBlacklistedWord(commentLower, blacklistedWords);
  
    if (isCommentBlacklisted) {
      Alert.alert('Error', 'Your comment contains blacklisted words. Please remove them and try again.');
      return;
    }
  
    try {
      const db = getFirestore();
      const commentRef = doc(db, `forums/${forumId}/posts/${postId}/comments`, commentToEdit.id);
      await updateDoc(commentRef, { content: editCommentText });
  
      // Update local state to reflect changes
      setComments(comments.map(comment =>
        comment.id === commentToEdit.id ? { ...comment, content: editCommentText } : comment
      ));
      setIsEditCommentModalVisible(false);
      setCommentToEdit(null);
      setEditCommentText('');
    } catch (error) {
      console.error("Error updating comment:", error);
      Alert.alert('Error', 'Could not update comment.');
    }
  };
  
  //Handle React Post
  const handleReact = async () => {
    try {
      const db = getFirestore();
      const postRef = doc(db, `forums/${forumId}/posts`, postId);
      const postDoc = await getDoc(postRef);
  
      if (postDoc.exists()) {
        const postData = postDoc.data();
        const currentReacts = postData.reacted || 0;
        const reactedBy = postData.reactedBy || [];
  
        // Check if the user has already reacted to this post
        const hasUserReacted = reactedBy.includes(user.uid);
  
        if (hasUserReacted) {
          // Remove reaction and user ID from reactedBy array
          await updateDoc(postRef, {
            reacted: currentReacts - 1,
            reactedBy: reactedBy.filter(id => id !== user.uid),
          });
          setReacts(currentReacts - 1);
        } else {
          // Add reaction and user ID to reactedBy array
          await updateDoc(postRef, {
            reacted: currentReacts + 1,
            reactedBy: [...reactedBy, user.uid],
          });
          setReacts(currentReacts + 1);
        }
  
        // Update local state
        setUserReacted(!hasUserReacted);
      }
    } catch (error) {
      console.error("Error updating reaction: ", error);
      Alert.alert('Error', 'Could not update reaction.');
    }
  };

  // Function to handle reaction on a specific comment
  const handleCommentReact = async (commentId) => {
    try {
      const commentRef = doc(firestore, 'forums', forumId, 'posts', postId, 'comments', commentId);
      const commentSnapshot = await getDoc(commentRef);
  
      if (commentSnapshot.exists()) {
        const commentData = commentSnapshot.data();
        const isReacted = (commentData.commentReactedBy || []).includes(user.uid);
  
        // Toggle reaction in Firebase
        const updatedReactedBy = isReacted
          ? commentData.commentReactedBy.filter((uid) => uid !== user.uid)
          : [...(commentData.commentReactedBy || []), user.uid];
  
        const updatedReactCount = isReacted
          ? (commentData.commentReacted || 1) - 1
          : (commentData.commentReacted || 0) + 1;
  
        await updateDoc(commentRef, {
          commentReactedBy: updatedReactedBy,
          commentReacted: updatedReactCount,
        });
  
        // Update local state
        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  commentReactedBy: updatedReactedBy,
                  commentReacted: updatedReactCount,
                }
              : comment
          )
        );
  
        setUserCommentReacted((prevReactions) => ({
          ...prevReactions,
          [commentId]: !isReacted,
        }));
      }
    } catch (error) {
      console.error('Error reacting to comment:', error);
      Alert.alert('Error', 'Could not update reaction.');
    }
  };
  
  //Delete Comment Handler
  const handleDeleteComment = async (commentId) => {
    try {
      const db = getFirestore();
      const commentRef = doc(db, `forums/${forumId}/posts/${postId}/comments`, commentId);
      const commentDoc = await getDoc(commentRef);

      if (commentDoc.exists() && commentDoc.data().authorId === user.uid) {
        await deleteDoc(commentRef);
        setComments(comments.filter(comment => comment.id !== commentId));
      } else {
        Alert.alert('Error', 'You do not have permission to delete this comment.');
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      Alert.alert('Error', 'Could not delete comment.');
    }
  };

  // Report a post
const handleReportPost = (postId) => {
  Alert.alert(
    "Report Post",
    "Are you sure you want to report this post?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        onPress: async () => {
          try {
            // Reference to the post document
            const postRef = doc(firestore, `forums/${forumId}/posts`, postId);
            const postDoc = await getDoc(postRef);

            if (postDoc.exists()) {
              // Increment the reportCount field
              const currentReportCount = postDoc.data().reportCount || 0;
              await updateDoc(postRef, {
                reportCount: currentReportCount + 1,
              });

              // Add a new report document in the 'reports' subcollection
              await addDoc(collection(postRef, "reports"), {
                reportedBy: user.uid,
                reason: "Inappropriate content",  
                timestamp: new Date(),
              });

              Alert.alert("Success", "Post has been reported.");
            } else {
              Alert.alert("Error", "Post not found.");
            }
          } catch (error) {
            console.error("Error reporting post:", error);
            Alert.alert("Error", "Could not report the post.");
          }
        },
      },
    ],
    { cancelable: false }
  );
};

  
 // Report a comment
const handleReportComment = (commentId) => {
  Alert.alert(
    "Report Comment",
    "Are you sure you want to report this comment?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        onPress: async () => {
          try {
            // Reference to the comment document
            const commentRef = doc(firestore, `forums/${forumId}/posts/${postId}/comments`, commentId);
            const commentDoc = await getDoc(commentRef);

            if (commentDoc.exists()) {
              // Increment the reportCount field
              const currentReportCount = commentDoc.data().reportCount || 0;
              await updateDoc(commentRef, {
                reportCount: currentReportCount + 1,
              });

              // Add a new report document in the 'reports' subcollection
              await addDoc(collection(commentRef, "reports"), {
                reportedBy: user.uid,
                reason: "Inappropriate content",  
                timestamp: new Date(),
              });

              Alert.alert("Success", "Comment has been reported.");
            } else {
              Alert.alert("Error", "Comment not found.");
            }
          } catch (error) {
            console.error("Error reporting comment:", error);
            Alert.alert("Error", "Could not report the comment.");
          }
        },
      },
    ],
    { cancelable: false }
  );
};


  //Render Comments
  const renderCommentItem = ({ item }) => (
    <View style={styles.commentItem}>
      <Text style={styles.commentAuthor}> Anonymous</Text>
      <Text style={styles.commentContent}>{item.content}</Text>
      <Text style={styles.commentDate}>
        {item.dateCreated ? moment(item.dateCreated).fromNow() : 'Unknown date'}
      </Text>
      <View style={styles.iconRow}>
        {item.authorId === user.uid ? (
          <>
            <TouchableOpacity onPress={() => {
              console.log("Editing comment:", item);
              setCommentToEdit(item);
              setEditCommentText(item.content);
              setIsEditCommentModalVisible(true);
            }}>
              <Ionicons name="create-outline" size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteComment(item.id)}>
              <Ionicons name="trash-outline" size={20} color="#000" />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={() => handleReportComment(item.id)}>
            <Ionicons name="alert-circle-outline" size={20} color="#000" />
          </TouchableOpacity>
        )}
          <TouchableOpacity onPress={() => handleCommentReact(item.id)}>
            <Ionicons
            name={userCommentReacted[item.id] ? 'heart' : 'heart-outline'}
            size={20}
            color={userCommentReacted[item.id] && (item.commentReacted || 0) > 0 ? '#d9534f' : '#333'}
            />
             <Text style={styles.reactionCountText}>{item.commentReacted || 0}</Text>
          </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    <RootLayout navigation={navigation} screenName="Post Details" userType={userType}>
      <View style={styles.container}>
        <Text style={styles.postTitle}>{postTitle}</Text>
        <View style={styles.metaContainer}>
          <Text style={styles.timeText}>{postTime}</Text>
          <Text style={styles.authorText}>by Anonymous</Text>
        </View>
        <Text style={styles.postContent}>{postContent}</Text>

        <View style={styles.reactContainer}>
          <TouchableOpacity onPress={() => setShowComments(!showComments)} style={styles.iconButton}>
            <Ionicons name="chatbox-ellipses-outline" size={24} color="#333" />
            <Text>{comments.length}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReact} style={styles.iconButton}>
            <Ionicons name={userReacted ? 'heart' : 'heart-outline'} size={24} color={userReacted ? '#d9534f' : '#333'} />
            <Text>{reacts}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsOptionsModalVisible(true)} style={styles.iconButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Options Modal */}
        <Modal visible={isOptionsModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {postAuthor === user.uid ? ( // Check if the current user is the post author
                <>
                  <TouchableOpacity onPress={() => {
                    setEditedTitle(postTitle);
                    setEditedContent(postContent);
                    setIsEditPostModalVisible(true);
                    setIsOptionsModalVisible(false);
                  }}>
                    <Text style={styles.modalOption}>Edit Post</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    handleDeletePost();
                    setIsOptionsModalVisible(false);
                  }}>
                    <Text style={styles.modalOption}>Delete Post</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={() => {
                  handleReportPost(postId);
                  setIsOptionsModalVisible(false);
                }}>
                  <Text style={styles.modalOption}>Report Post</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setIsOptionsModalVisible(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {showComments && (
          <>
            <FlatList
              style={styles.commentList}
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={renderCommentItem}
            />
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity onPress={handleAddComment} style={styles.sendButton}>
                <Ionicons name="send-outline" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Edit Post Modal */}
        <Modal visible={isEditPostModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TextInput
                style={styles.textInput}
                placeholder="Post Title"
                value={editedTitle}
                onChangeText={setEditedTitle}
              />
              <TextInput
                style={[styles.textInput, { height: 100 }]} // Adjust height for content input
                placeholder="Post Content"
                value={editedContent}
                onChangeText={setEditedContent}
                multiline
                textAlignVertical="top"
              />
              <TouchableOpacity onPress={handleSavePostEdits}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsEditPostModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Edit Comment Modal */}
        <Modal visible={isEditCommentModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TextInput
                style={styles.textInput}
                placeholder="Edit Comment"
                value={editCommentText}
                onChangeText={setEditCommentText}
              />
              <TouchableOpacity onPress={handleEditComment}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                setIsEditCommentModalVisible(false);
                setCommentToEdit(null);
                setEditCommentText('');
              }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
       </Modal>
      </View>
    </RootLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  postTitle: { fontSize: 24, fontWeight: 'bold' },
  metaContainer: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  textInput: { borderColor: '#ccc', borderWidth: 1, padding: 8, height: 60, maxHeight: 150, textAlignVertical: 'top' },
  iconRow: { flexDirection: 'row', gap: 10, marginTop: 5 },
  timeText: { fontSize: 12, color: '#888' },
  authorText: { fontSize: 12, color: '#888' },
  postContent: { fontSize: 16, marginBottom: 16 },
  reactContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  iconButton: { alignItems: 'center' },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingVertical: 8,
  },
  commentInput: {
    flex: 1,
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    fontSize: 16,
    marginRight: 8,
  },
  sendButton: {
    padding: 8,
  },
  commentList: { marginVertical: 16 },
  commentItem: { borderBottomColor: '#ccc', borderBottomWidth: 1, paddingVertical: 8 },
  commentAuthor: { fontWeight: 'bold' },
  commentContent: { marginVertical: 4 },
  commentDate: { fontSize: 12, color: '#888' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 },
  modalContent: { width: '80%', padding: 20, backgroundColor: '#fff', borderRadius: 10 },
  modalOption: { fontSize: 18, marginBottom: 20 },
  modalCancel: { fontSize: 16, color: '#000' },
  modalSaveText: { fontSize: 22, color: '#000' }, 
  modalCancelText: { fontSize: 20, color: '#000'},
  reactionCountText: {
    fontSize: 12,
    color: '#333',
    marginTop: 2, 
    textAlign: 'center', 
  },
});
