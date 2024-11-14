import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal, Alert, StyleSheet, Image, RefreshControl } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import moment from 'moment';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../providers';
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, Timestamp} from 'firebase/firestore';
import { auth, Colors, firestore } from 'src/config';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { LoadingIndicator } from '../components';

export const PostDetailsScreen = ({ route, navigation }) => {
  const { user, userType } = useContext(AuthenticatedUserContext);
  const { postId, forumId } = route.params;
  const [postData, setPostData] = useState(null);
  const [authorName, setAuthorName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [ loading, setLoading ] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentToEdit, setCommentToEdit] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [userCommentReacted, setUserCommentReacted] = useState({});
  const [reacts, setReacts] = useState(0);
  const [userReacted, setUserReacted] = useState(false); 
  const [editCommentText, setEditCommentText] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [isEditPostModalVisible, setIsEditPostModalVisible] = useState(false); 
  const [isEditCommentModalVisible, setIsEditCommentModalVisible] = useState(false);
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [blacklistedWords, setBlacklistedWords] = useState([]);
  const [editedImageUri, setEditedImageUri] = useState(null);
  

  const onRefresh = async () => {
    setRefreshing(true); 
    await fetchPostDetails();  
    await fetchComments();
    await fetchBlacklistedWords();
    setRefreshing(false); 
  };

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
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserData();
    fetchPostDetails();  
    fetchComments();
    fetchBlacklistedWords();
  }, [auth.currentUser]);

  //Fetch Post Details
  const fetchPostDetails = async () => {
    try {
      const postRef = doc(firestore, `forums/${forumId}/posts`, postId);
      const postSnapshot = await getDoc(postRef);
  
      if (postSnapshot.exists()) {
        const data = postSnapshot.data();
        const currentReactCount = data.reacted || 0;
        setPostData(data);
        setReacts(currentReactCount);
        
        setUserReacted(data.reactedBy.includes(user.uid)); // Check if the user has reacted
      } else {
        console.error('Post not found.');
        Alert.alert('Error', 'Post not found.');
      }
    } catch (error) {
      console.error('Error fetching post details:', error);
      Alert.alert('Error', 'Could not fetch post details.');
    }
  };
  
  //Fecth Comments
  const fetchComments = async () => {
    try {
      const commentsRef = collection(firestore, `forums/${forumId}/posts/${postId}/comments`);
      const snapshot = await getDocs(commentsRef);
  
      if (!snapshot.empty) {
        const fetchedComments = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            dateCreated: data.dateCreated ? data.dateCreated.toDate() : null,
            userReacted: data.commentReactedBy && data.commentReactedBy.includes(user.uid), // Check if the user has reacted to this comment
          };
        });
        setComments(fetchedComments);
      } else {
        console.log('No comments found for this post.');
        setComments([]); // Clear the comments if none exist
      }
    } catch (error) {
      console.error("Error fetching comments: ", error.message);
      Alert.alert('Error', 'Could not fetch comments.');
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
  const fetchBlacklistedWords = async () => {
    try {
        const blacklistedWordsRef = collection(firestore, 'blacklistedWords');
        const snapshot = await getDocs(blacklistedWordsRef);
        setBlacklistedWords(snapshot.docs.map(doc => doc.data().word.toLowerCase()));
      } catch (error) {
        console.error("Error fetching blacklisted words:", error);
      }
    };
  
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
  
    let imageUrl = postData?.imageUrl; // Keep the existing image URL unless a new one is uploaded
  
    if (editedImageUri) { // Only upload if a new image has been selected
      try {
        const response = await fetch(editedImageUri);
        const blob = await response.blob();
  
        const storage = getStorage(); 
        const imageRef = ref(storage, `forums/posts/${forumId}/postImage_${postId}.png`);
        await uploadBytes(imageRef, blob);
  
        // Get the download URL for the uploaded image
        imageUrl = await getDownloadURL(imageRef);
        console.log("Image uploaded, download URL:", imageUrl);
      } catch (error) {
        console.error("Error uploading image:", error);
        Alert.alert('Error', 'Failed to upload the image. Please try again.');
        return;
      }
    }
  
    try {
      // Reference to the post document in Firestore
      const postRef = doc(firestore, `forums/${forumId}/posts`, postId);
  
      // Update the post with the new title, content, and image URL 
      await updateDoc(postRef, {
        title: editedTitle,
        content: editedContent,
        imageUrl: imageUrl, 
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
      dateCreated: Timestamp.now(),
      author: authorName,
      authorId: user.uid,
    };
  
    try {
      const docRef = await addDoc(
        collection(firestore, `forums/${forumId}/posts/${postId}/comments`), 
        newCommentObj
      );
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
      const commentRef = doc(firestore, `forums/${forumId}/posts/${postId}/comments`, commentToEdit.id);
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
      // Immediately update UI state
      const hasUserReacted = userReacted;
      const newReactCount = hasUserReacted ? reacts - 1 : reacts + 1;
  
      // Toggle reaction state and update local count
      setUserReacted(!hasUserReacted);
      setReacts(newReactCount);
  
      // Update Firestore asynchronously
      const postRef = doc(firestore, `forums/${forumId}/posts`, postId);
  
      // Read current data from Firestore to determine the right update
      const postDoc = await getDoc(postRef);
  
      if (postDoc.exists()) {
        const postData = postDoc.data();
        const reactedBy = postData.reactedBy || [];
  
        // Determine if user is adding or removing a reaction
        let updatedReactedBy;
        if (hasUserReacted) {
          // If the user has already reacted, remove their reaction
          updatedReactedBy = reactedBy.filter(id => id !== user.uid);
        } else {
          // Otherwise, add their reaction
          updatedReactedBy = [...reactedBy, user.uid];
        }
  
        // Update Firestore with the new reaction count and the updated reactedBy list
        await updateDoc(postRef, {
          reacted: newReactCount,
          reactedBy: updatedReactedBy,
        });
      }
    } catch (error) {
      console.error("Error updating reaction: ", error);
      Alert.alert("Error", "Could not update reaction.");
  
      // Optional: Revert UI update if Firestore update fails
      setUserReacted(userReacted);
      setReacts(userReacted ? reacts + 1 : reacts - 1);
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
        await fetchComments(); // Refresh comments after the update
      }
    } catch (error) {
      console.error('Error reacting to comment:', error);
      Alert.alert('Error', 'Could not update reaction.');
    }
  };
  
  //Delete Comment Handler
const handleDeleteComment = async (commentId) => {
  Alert.alert(
    "Delete Comment",
    "Are you sure you want to delete this comment?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        onPress: async () => {
          try {
            const commentRef = doc(firestore, `forums/${forumId}/posts/${postId}/comments`, commentId);
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
        },
      },
    ] 
  ); 
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
      <Text style={styles.commentAuthor}> {item.authorName}</Text>
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
              name={item.userReacted ? "heart" : "heart-outline"} 
              size={20}
              color={item.userReacted ? 'red' : '#333333'} 
            />
            <Text style={styles.reactionCountText}>{item.commentReacted || 0}</Text>
          </TouchableOpacity>
      </View>
    </View>
);

//Pick image
const pickImage = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission denied', 'We need camera roll permissions to attach images.');
    return;
  }

  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  if (!result.canceled) {
    const selectedImage = result.assets[0].uri;
    setEditedImageUri(selectedImage); // Store the selected image URI
  }
};

if (loading) {
  return <LoadingIndicator />;
}

 return (
    <RootLayout navigation={navigation} screenName="Post Details" userType={userType}>
      <View style={styles.container}>
      {/* Post Header and Comments */}
      <FlatList
        data={showComments ? comments : []} 
        keyExtractor={(item) => item.id}
        renderItem={renderCommentItem} 
        contentContainerStyle={{ paddingBottom: 70 }} // Space for the input box
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View>
            {/* Post Content */}
            <Text style={styles.postTitle}>{postData?.title}</Text>
            <View style={styles.metaContainer}>
              <Text style={styles.timeText}>
                {new Date(postData?.dateCreated.toDate()).toLocaleString('en-US', {hour12: true})}
              </Text>
              <Text style={styles.authorText}>{postData?.authorName}</Text>
            </View>

            {/* Post Image */}
            {postData?.imageUrl ? (
              <TouchableOpacity onPress={() => setIsImageModalVisible(true)}>
                <Image source={{ uri: postData.imageUrl }} style={styles.postImage} />
              </TouchableOpacity>
            ) : null}
            
            <Text style={styles.postContent}>{postData?.content}</Text>

            {/* Reaction and Comment Icons */}
            <View style={styles.reactContainer}>
              <TouchableOpacity onPress={() => setShowComments(!showComments)} style={styles.iconButton}>
                <Ionicons name="chatbox-ellipses-outline" size={24} color="#333" />
                <Text>{comments.length}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleReact} style={styles.iconButton}>
                <Ionicons name={userReacted ? 'heart' : 'heart-outline'} size={24} color={userReacted ? 'red' : '#333'} />
                <Text>{reacts}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsOptionsModalVisible(true)} style={styles.iconButton}>
                <Ionicons name="ellipsis-horizontal" size={24} color="#333" />
              </TouchableOpacity>
            </View>
          </View>
        }
      />
      
        { showComments && (
            <View style={styles.commentInputContainer}>
              {/* Comment Input Box */}
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
          )
        }

        {/* Image Modal */}
        <Modal visible={isImageModalVisible} transparent animationType="fade">
              <View style={styles.imageModalOverlay}>
                <TouchableOpacity onPress={() => setIsImageModalVisible(false)} style={styles.closeModalButton}>
                  <Ionicons name="close" size={32} color="#fff" />
                </TouchableOpacity>
                {postData?.imageUrl && (
                  <Image
                    source={{ uri: postData.imageUrl }}
                    style={styles.fullScreenImage} // Fullscreen image style
                    resizeMode="contain"
                  />
                )}
              </View>
            </Modal>
  
        {/* Options Modal */}
        <Modal visible={isOptionsModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {postData?.authorId === user.uid ? (
                <>
                  <TouchableOpacity onPress={() => {
                    setEditedTitle(postData.title);
                    setEditedContent(postData.content);
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
                style={[styles.textInput, { height: 100 }]} 
                placeholder="Post Content"
                value={editedContent}
                onChangeText={setEditedContent}
                multiline
                textAlignVertical="top"
              />
              
              <TouchableOpacity onPress={pickImage} style={styles.attachIcon}>
                <Ionicons name="image-outline" size={24} color="#2F2F2F" />
                <Text style={styles.attachText}>Attach Image</Text>
              </TouchableOpacity>

                {/* Display Selected Image */}
                {editedImageUri && (
                  <Image source={{ uri: editedImageUri }} style={styles.imagePreview} />
                )}

              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setIsEditPostModalVisible(false)} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSavePostEdits} style={styles.saveButton}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
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
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => {
                  setIsEditCommentModalVisible(false);
                  setCommentToEdit(null);
                  setEditCommentText('');
                }} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleEditComment} style={styles.saveButton}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  postContent: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 16,
  },
  commentsContainer: {
    flexGrow: 1,  
    marginBottom: 60, 
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingVertical: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
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
  commentsContainer: {
    flex: 1,
    marginBottom: 8, 
  },
  textInput: { 
    borderColor: '#ccc', 
    borderWidth: 1, 
    padding: 8, 
    height: 60, 
    maxHeight: 150, 
    textAlignVertical: 'top' 
  },
  iconRow: { 
    flexDirection: 'row', 
    gap: 10, 
    marginTop: 5 
  },
  timeText: { 
    fontSize: 12, 
    color: '#888' 
  },
  authorText: { 
    fontSize: 12, 
    color: '#888' 
  },
  postContent: { 
    fontSize: 16, 
    marginTop: 10,
    marginBottom: 10, 
  },
  reactContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginBottom: 10 ,
  },
  iconButton: { 
    alignItems: 'center' 
  },
  commentInput: {
    flex: 1,
    padding: 5,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    fontSize: 16,
    marginRight: 8,
  },
  sendButton: {
    padding: 8,
  },
  commentItem: { 
    borderBottomColor: '#ccc', 
    borderBottomWidth: 1, 
    paddingVertical: 8 
  },
  commentAuthor: { 
    fontWeight: 'bold' 
  },
  commentContent: { 
    marginVertical: 4 
  },
  commentDate: { 
    fontSize: 12, 
    color: '#888' 
  },
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    zIndex: 1000, 
  },
  modalContent: { 
    width: '90%', 
    padding: 20, 
    backgroundColor: '#fff', 
    borderRadius: 10,
  },
  modalOption: { 
    fontSize: 18, 
    marginBottom: 20 
  },
  modalCancel: { 
    fontSize: 16, 
    color: '#000' 
  },
  modalButtons:{
    flexDirection :'row' ,
    justifyContent :'space-between',
    marginTop: 20,
  },
  cancelButton:{
    paddingVertical :8 ,
    paddingHorizontal :20 ,
    backgroundColor :'#ccc' ,
    borderRadius :5 ,
  },
  cancelButtonText:{
      color :'#000' ,
  },
  saveButton:{
      paddingVertical :8 ,
      paddingHorizontal :20 ,
      backgroundColor :'#7f4dff' ,
      borderRadius :5 ,
  },
  saveButtonText:{
      color :'#fff' ,
  },
  reactionCountText: {
    fontSize: 12,
    color: '#333',
    marginTop: 2, 
    textAlign: 'center', 
  },
  postImage: {
    width: 270,
    height: 270,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  attachIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  attachText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#000',
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Dark overlay background
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fullScreenImage: {
    width: '100%',  // Make the image take the full width of the screen
    height: '100%', // Make the image take the full height of the screen
    resizeMode: 'contain', // Keeps the aspect ratio intact when zooming
  },
  closeModalButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Optional: adds a background to the icon
    borderRadius: 25, // Optional: to make the background circular
    padding: 8, // Optional: adjust padding around the icon
  },
});
