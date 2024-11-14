import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  Image
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../providers';
import { getFirestore, collection, getDocs, query, where, addDoc, doc, getDoc, deleteDoc, updateDoc, increment, setDoc, serverTimestamp} from 'firebase/firestore';
import { auth, firestore, storage } from 'src/config';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';

export const ForumPostScreen = ({ route, navigation }) => {
  const { forumId, forumTitle,forumContent,forumAuthorId } = route.params;
  const [isCreator, setIsCreator] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [posts, setPosts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [editedTitle, setEditedTitle] = useState(forumTitle);
  const [editedTags, setEditedTags] = useState([]);
  const [editedContent, setEditedContent] = useState(forumContent);
  const { userType } = useContext(AuthenticatedUserContext);  
  const [authorName, setAuthorName] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [selectedImageUri, setSelectedImageUri] = useState(null);

  const predefinedTags = [
    'Support', 'Awareness', 'Stress', 'Self-care', 'Motivation', 'Wellness', 'Mental Health'
  ];
  //im now in the forumpostscreeen
  
  const checkBanStatus = async () => {
    try {
      if (!auth.currentUser) return;

      const bannedUsersRef = collection(firestore, `forums/${forumId}/bannedUsers`);
      const q = query(bannedUsersRef, where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const banData = snapshot.docs[0].data();
        setIsBanned(true);
        setBanReason(banData.reason || 'No reason provided');
      } else {
        setIsBanned(false);
        setBanReason('');
      }
    } catch (error) {
      console.error('Error checking ban status:', error);
    }
  };
  // Fetch user data, forum details, posts, and membership status on mount
  useEffect(() => { 
    const fetchUserData = async () => {
      try {
        if (auth.currentUser) {
          const userRef = doc(firestore, 'users', auth.currentUser.uid);
          const userSnapshot = await getDoc(userRef);

          if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
          
            setAuthorName(`${userData.firstName} ${userData.lastName}`);
            setIsCreator(auth.currentUser.uid === forumAuthorId); // Check if user is creator
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Could not fetch user data.');
      }
    };
    
    // Placeholder membership check
    const checkMembership = async () => {
    try {
      const db = getFirestore();
      const membershipRef = collection(db, 'memberships'); // assuming there is membership collection
      const q = query(membershipRef, where('forumId', '==', forumId), where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      
      setIsMember(!snapshot.empty); // Set isMember based on whether a document exists
    } catch (error) {
      console.error('Error checking membership:', error);
      Alert.alert('Error', 'Could not check membership status.');
    }
    };
    checkBanStatus();
    fetchUserData();
    fetchPosts();
    checkMembership();
    fetchForumDetails();
  }, [auth.currentUser]);

  const onRefresh = async () => {
    setRefreshing(true); // Set refreshing state to true
    await fetchPosts();  // Fetch posts again
    await fetchForumDetails();
    setRefreshing(false); // Reset refreshing state
  };

  // Function to fetch posts
  const fetchPosts = async () => {
    try {
        const db = getFirestore();
        const postsRef = collection(db, `forums/${forumId}/posts`);
        const q = query(postsRef, where('status', '==', 'approved'));

        const snapshot = await getDocs(q);
        const fetchedPosts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        setPosts(fetchedPosts);
    } catch (error) {
        console.error('Error fetching posts: ', error);
        Alert.alert('Error', 'Could not fetch posts.');
    }
  };

   //Forum Details
   const fetchForumDetails = async () => {
    try {
      const forumRef = doc(firestore, 'forums', forumId);
      const forumSnapshot = await getDoc(forumRef);

      if (forumSnapshot.exists()) {
        const forumData = forumSnapshot.data();
        setEditedContent(forumData.content);
        setEditedTags(forumData.tags || []);
      }
    }   catch (error) {
      console.error('Error fetching forum details:', error);
      Alert.alert('Error', 'Could not fetch forum details.');
    }
    };

  const toggleTag = (tag) => {
    setEditedTags((prevTags) =>
      prevTags.includes(tag)
        ? prevTags.filter((t) => t !== tag)
        : [...prevTags, tag]
    );
  };

  // Join forum handler
  const handleJoinForum = async () => {
    try {
      const membershipRef = collection(firestore, 'memberships');
  
      await addDoc(membershipRef, {
        forumId: forumId,
        userId: auth.currentUser.uid, 
        joinedAt: new Date(),
      });



      
  
      setIsMember(true); // Update UI state to reflect joined status
      Alert.alert('Success', 'You have joined the forum!');
    } catch (error) {
      console.error('Error joining forum:', error);
      Alert.alert('Error', 'Could not join the forum.');
    }
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

  // Function to save forum edits
  const handleSaveForumEdits = async () => {
    try {
      const blacklistedWordsRef = collection(firestore, 'blacklistedWords');
      const snapshot = await getDocs(blacklistedWordsRef);
      const blacklistedWords = snapshot.docs.map(doc => doc.data().word.toLowerCase());

      const editedTitleLower = editedTitle.toLowerCase();
      const editedContentLower = editedContent.toLowerCase();

      if (containsBlacklistedWord(editedTitleLower, blacklistedWords) || 
          containsBlacklistedWord(editedContentLower, blacklistedWords)) {
        Alert.alert('Error', 'The forum title or content contains blacklisted words. Please remove them and try again.');
        return;
      }

      // Proceed with saving edits if no blacklisted words are found
      const forumRef = doc(firestore, 'forums', forumId);
      await updateDoc(forumRef, {
        title: editedTitle,
        content: editedContent,
      });

      setModalVisible(false);
      Alert.alert('Success', 'Forum details updated successfully.');
    } catch (error) {
      console.error('Error updating forum:', error);
      Alert.alert('Error', 'Could not update forum details.');
    }
  };

  // Function to handle image picking and uploading
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Sorry, we need camera roll permissions to make this work!');
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
      console.log("Selected Image URI:", selectedImage);
      setSelectedImageUri(selectedImage); // Store URI without uploading
    }
  };
  
  const renderPostItem = ({ item }) => (
    <TouchableOpacity
      style={styles.postContainer}
      onPress={() => {
        if (isMember || isCreator) {
          navigation.navigate('PostDetails', {
            postId: item.id,
            postAuthor: item.author,
            forumId: forumId,
          });
        } else {
          Alert.alert('Membership Required', 'You must join this forum to view posts.');
        }
      }}
    >
      <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.postContent} numberOfLines={2}>{item.content}</Text>
      <View style={styles.metaContainer}>
        <Text style={styles.authorText}>by Anonymous {item.author}</Text>   
        {item.hasImage && (
          <View style={styles.imageLabelContainer}>
            <Ionicons name="image-outline" size={20} color="#7f4dff" />
            <Text style={styles.imageLabelText}>Image Attached</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // Add new post handler
  const handleAddPost = async () => {
    if (isBanned) {
      Alert.alert('Action Blocked', `You are banned from this forum due to: ${banReason}`);
      return;
    }

    if (newPostTitle && newPostContent) {
      try {
        const blacklistedWordsRef = collection(firestore, 'blacklistedWords');
        const snapshot = await getDocs(blacklistedWordsRef);
        const blacklistedWords = snapshot.docs.map(doc => doc.data().word.toLowerCase());
  
        const postTitleLower = newPostTitle.toLowerCase();
        const postContentLower = newPostContent.toLowerCase();
  
        if (containsBlacklistedWord(postTitleLower, blacklistedWords) || 
            containsBlacklistedWord(postContentLower, blacklistedWords)) {
          Alert.alert('Error', 'Your post contains blacklisted words. Please remove them and try again.');
          return;
        }
  
        let imageUrl = null;
        if (selectedImageUri) { // Only upload if an image has been selected
          const response = await fetch(selectedImageUri);
          const blob = await response.blob();
  
          const imageRef = ref(storage, `forums/posts/${forumId}/postImage.png`);
          await uploadBytes(imageRef, blob);
          imageUrl = await getDownloadURL(imageRef);
          console.log("Image uploaded, download URL:", imageUrl);
        }
  
        const newPost = {
          title: newPostTitle,
          content: newPostContent,
          dateCreated: new Date().toLocaleString(),
          authorId: auth.currentUser.uid,
          authorType: userType,
          authorName: authorName,
          forumId,
          status: 'pending',
          imageUrl: imageUrl,
          hasImage: !imageUrl,
          reacted: 0,
          reactedBy: [],
        };
  
        const forumRef = doc(firestore, 'forums', forumId);
          const postsRef = collection(forumRef, 'posts');

          // Create the new post first and retrieve the document reference
          const postDocRef = await addDoc(postsRef, newPost);

          const postSnap = await getDoc(forumRef);

          // Now that the post has been added, we can safely use the ID
          const newPostId = postDocRef.id; // The new post's ID

          // Create the notification reference
          const notificationRef = doc(collection(firestore, `notifications/${postSnap.data().authorId}/messages`));

          // Set the notification document with the new post ID
          await setDoc(notificationRef, {
            recipientId: auth.currentUser.uid,
            recipientType: postSnap.data().authorType,  
            message: `${authorName} has submitted a new post for review.`,
            type: `post_review`,
            createdAt: serverTimestamp(), 
            isRead: false,
            additionalData: {
              postId: newPostId,  // Use the correct postId here
              forumId: forumId,
            },
          });

          // Fetch and log the notification to check the createdAt field
          const notificationDoc = await getDoc(notificationRef);
          const notificationData = notificationDoc.data();

          if (notificationData && notificationData.createdAt) {
            const createdAtDate = notificationData.createdAt.toDate();
            console.log("Notification createdAt:", createdAtDate); // For debugging
          }
  
        // Clear form inputs
        setNewPostTitle('');
        setNewPostContent('');
        setSelectedImageUri(null); // Clear selected image URI
        setModalVisible(false);
        fetchPosts();
        Alert.alert('Post Pending Approval', 'Your post has been submitted successfully and is currently pending approval.');
      } catch (error) {
        console.error('Error adding post:', error);
        Alert.alert('Error', 'Could not add post.');
      }
    } else {
      Alert.alert('Error', 'Please fill in both the title and content fields.');
    }
  };
  
  
 // Leave forum handler
 const handleLeaveForum = async () => {
  if (isBanned) {
    Alert.alert('Action Blocked', `You are banned from this forum due to: ${banReason}`);
    return;
  }

  Alert.alert('Leave Forum', 'Are you sure you want to leave this forum?', [
    {
      text: 'Cancel',
      style: 'cancel',
    },
    {
      text: 'OK',
      onPress: async () => {
        try {
          const db = getFirestore();
          const membershipRef = collection(db, 'memberships');
          const q = query(membershipRef, where('forumId', '==', forumId), where('userId', '==', auth.currentUser.uid));
          const snapshot = await getDocs(q);

          // Delete each membership document found (should be only one)
          snapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
          });

          setIsMember(false); // Update UI state to reflect leave status
          Alert.alert('Success', 'You have left the forum.');
        } catch (error) {
          console.error('Error leaving forum:', error);
          Alert.alert('Error', 'Could not leave the forum.');
        }
      },
    },
  ]);
};

// Delete forum handler
const handleDeleteForum = async () => {
  Alert.alert('Delete Forum', 'Are you sure you want to delete this forum?', [
    {
      text: 'Cancel',
      style: 'cancel',
    },
    {
      text: 'OK',
      onPress: async () => {
        try {
          // Logic to delete the forum from the database
          await deleteDoc(doc(firestore, 'forums', forumId));
          Alert.alert('Success', 'The forum has been deleted.');
          navigation.goBack(); // Navigate back to the previous screen
        } catch (error) {
          console.error('Error deleting forum:', error);
          Alert.alert('Error', 'Could not delete the forum.');
        }
      },
    },
  ]);
};

const getUserName = async () => {
  const currentUserId = auth.currentUser?.uid;

  if (!currentUserId) return null;

  // Function to fetch document from a collection
  const fetchUserData = async (collectionName) => {
    const docRef = doc(firestore, collectionName, currentUserId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  };

  // Try each collection in order
  const collections = ['users', 'organizations', 'admins', 'professionals'];
  for (const collection of collections) {
    const userData = await fetchUserData(collection);
    if (userData) {
      // Extract the name based on the collection's field structure
      switch (collection) {
        case 'users':
        case 'professionals':
          return `${userData.firstName} ${userData.lastName}`;
        case 'organizations':
          return userData.organizationName;
        case 'admins':
          return `${userData.firstName} ${userData.lastName}`;
        default:
          return null;
      }
    }
  }

  // If not found in any collection
  return null;
};



//Report Forum
const handleReportForum = async () => {
  const reporterName = await getUserName();
  Alert.alert(
    'Report Forum',
    'Are you sure you want to report this forum?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'OK',
        onPress: async () => {
          try {
            // Fetch the forum document to get the authorName
            const forumRef = doc(firestore, 'forums', forumId);
            const forumDoc = await getDoc(forumRef);
          
            if (forumDoc.exists()) {
              // Extract the author's name from the forum document
              const authorName = forumDoc.data().authorName;
              const authorType = forumDoc.data().authorType;
          
              // Increment the report count in the forum
              await updateDoc(forumRef, { reportCount: increment(1) });
          
              // Add a new report
              const reportsRef = collection(forumRef, 'reports');
              await addDoc(reportsRef, {
                authorName: authorName,  
                authorType: authorType,
                reporterName: reporterName,
                reportedBy: auth.currentUser.uid,
                reason: 'Inappropriate content',
                timestamp: new Date(),
              });
          
              Alert.alert('Success', 'Report Submitted.');
            } else {
              console.error('Forum not found');
              Alert.alert('Error', 'Forum not found.');
            }
          } catch (error) {
            console.error('Error reporting forum:', error);
            Alert.alert('Error', 'Could not submit the report. Please try again.');
          }
        },
      },
    ],
    { cancelable: true }
  );
};

return (
  <RootLayout navigation={navigation} screenName={forumTitle} userType={userType} >
    <View style={styles.container}
    >
      {/* Forum Title with Edit Icon */}
      <View style={styles.titleContainer}>
        <Text style={styles.forumTitle}>{forumTitle}</Text>
        
        {isCreator ? (
            <TouchableOpacity onPress={() => { setModalType("edit"); setModalVisible(true); }} style={styles.editIconContainer}>
              <Ionicons name="create-outline" size={24} color="#000" style={styles.editIcon} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleReportForum} style={styles.editIconContainer}>
              <Ionicons name="alert-circle-outline" size={24} color="#000" style={styles.editIcon} />
            </TouchableOpacity>
          )}
      </View>

      <Text style={styles.forumContent}>
        {editedContent}
      </Text>

      {/* Conditionally render Join, Add Post, and either Delete or Leave buttons */}
      {isCreator ? (
        <>
          <TouchableOpacity style={styles.addButton} onPress={() => { setModalType("add"); setModalVisible(true); }}>
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add New Post</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.leaveButton} onPress={handleDeleteForum}>
            <Ionicons name="trash-outline" size={24} color="#fff" />
            <Text style={styles.leaveButtonText}>Delete Forum</Text>
          </TouchableOpacity>
        </>
      ) : !isMember ? (
        <TouchableOpacity style={styles.joinButton} onPress={handleJoinForum}>
          <Ionicons name="person-add" size={24} color="#fff" />
          <Text style={styles.joinButtonText}>Join Forum</Text>
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity style={styles.addButton} onPress={() => { setModalType("add"); setModalVisible(true); }}>
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add New Post</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveForum}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
            <Text style={styles.leaveButtonText}>Leave Forum</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Render posts or no posts message */}
      {posts.length === 0 ? (
        <View style={styles.noPostsContainer}>
          <Text style={styles.noPostsText}>No posts available for this forum.</Text>
        </View>
      ) : (
        <FlatList 
          data={posts} 
          renderItem={renderPostItem} 
          keyExtractor={(item) => item.id} 
          style={styles.postList} 
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Modal for Creating or Editing */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {modalType === "add" ? (
              <>
                <Text style={styles.modalTitle}>Create New Post</Text>
                <TextInput
                  style={styles.newPostTitleInput}
                  placeholder="Post Title"
                  value={newPostTitle}
                  onChangeText={setNewPostTitle}
                />
                <TextInput
                  style={styles.newPostContentInput}
                  placeholder="Post Content"
                  value={newPostContent}
                  onChangeText={setNewPostContent}
                  multiline
                />

                {/* Image Attachment Button */}
                <TouchableOpacity onPress={pickImage} style={styles.attachIcon}>
                    <Ionicons name="image-outline" size={24} color="#7f4dff" />
                    <Text style={styles.attachText}>Attach Image</Text>
                </TouchableOpacity>

                  {selectedImageUri && (
                    <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />
                  )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.submitButton} onPress={handleAddPost}>
                    <Text style={styles.submitButtonText}>Submit</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Edit Forum Details</Text>
                <TextInput
                  style={styles.newPostTitleInput}
                  placeholder="Forum Title"
                  value={editedTitle}
                  onChangeText={setEditedTitle}
                />
                 {/* Input to edit forum content */}
                <TextInput
                  style={styles.newPostTitleInput}
                  placeholder="Edit Forum Content"
                  value={editedContent}
                  onChangeText={(text) => setEditedContent(text)}
                  multiline={true}
                  numberOfLines={4}
                />
                <Text style={styles.tagSectionTitle}>Tags</Text>
                <View style={styles.tagsContainer}>
                  {predefinedTags.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.tagButton,
                        editedTags.includes(tag) && styles.selectedTag,
                      ]}
                      onPress={() => toggleTag(tag)}
                    >
                      <Text style={styles.tagButtonText}>{tag}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.submitButton} onPress={handleSaveForumEdits}>
                    <Text style={styles.submitButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
        padding: 20,
        backgroundColor: '#ffffff',
    },
    forumTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        flex: 1,
    },
    forumContent: {
      fontSize: 16,  
      color: '#000', 
      marginBottom: 20,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center', // Aligns the title and icon vertically
      justifyContent: 'space-between', // Ensures even spacing
      marginBottom: 10,
    },
    editIconContainer: {
      padding: 10,
      justifyContent: 'center',
    },
    editIcon: {
        // size is set directly in the component (size={24}),
        
    },
    joinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#7f4dff',
        padding: 10,
        borderRadius: 8,
        marginBottom: 20,
    },
    joinButtonText: {
        color: '#fff',
        marginLeft: 5,
        fontSize: 16,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#7129F2',
        padding: 10,
        borderRadius: 8,
        marginBottom: 20,
    },
    addButtonText: {
        color: '#fff',
        marginLeft: 5,
        fontSize: 16,
    },
    leaveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#7f4dff',
      padding: 10,
      borderRadius: 8,
      marginBottom: 20,
    },
    leaveButtonText: {
          color: '#fff',
          marginLeft: 5,
          fontSize: 16,
    },
    noPostsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noPostsText: {
        fontSize: 18,
        color: '#888',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
    },
    modalTitle: {
       fontSize: 18,
       fontWeight: 'bold',
       marginBottom: 10,
   },
   newPostTitleInput:{
       borderBottomWidth :1 ,
       borderBottomColor :'#ccc' ,
       marginBottom :10 ,
       paddingVertical :5 ,
   },
   newPostContentInput:{
       borderWidth :1 ,
       borderColor :'#ccc' ,
       borderRadius :5 ,
       padding :10 ,
       height :100 ,
       textAlignVertical :'top' ,
       marginBottom :10 ,
   },
   modalButtons:{
       flexDirection :'row' ,
       justifyContent :'space-between' ,
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
   submitButton:{
       paddingVertical :8 ,
       paddingHorizontal :20 ,
       backgroundColor :'#7f4dff' ,
       borderRadius :5 ,
   },
   submitButtonText:{
       color :'#fff' ,
   },
   postContainer:{ 
       padding :15,
       marginVertical :8 , 
       backgroundColor :'#f0f0f0',
       borderRadius :10,
   },
   tagSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tagButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#eee',
    borderRadius: 15,
    margin: 3,
  },
  selectedTag: {
    backgroundColor: '#7f4dff',
  },
  tagButtonText: {
    color: '#333',
  },
  attachIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  attachText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#000',
  },
  imagePreview: {
    width: 100,
    height: 100,
    marginTop: 10,
    borderRadius: 10,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  imageLabelText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#7f4dff',
  },
  imageLabelContainer: {
    flexDirection: 'row',
    alignItems: 'right',
    marginLeft: 75,
  },
});
