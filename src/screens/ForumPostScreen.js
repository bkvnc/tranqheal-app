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
  ScrollView
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../providers';
import { getFirestore, collection, getDocs, query, where, addDoc, doc, getDoc, deleteDoc, updateDoc} from 'firebase/firestore';
import { auth, firestore } from 'src/config';

export const ForumPostScreen = ({ route, navigation }) => {
  const { forumId, forumTitle,forumContent,forumAuthorId } = route.params;
  const [isCreator, setIsCreator] = useState(false);
  const [isMember, setIsMember] = useState(false);
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

  const predefinedTags = [
    'Support', 'Awareness', 'Stress', 'Self-care', 'Motivation', 'Wellness', 'Mental Health'
  ];
  //im now in the forumpostscreeen
  
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

  // Add new post handler
  const handleAddPost = async () => {
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

        const newPost = {
          title: newPostTitle,
          content: newPostContent,
          dateCreated: new Date().toLocaleString(),
          authorId: auth.currentUser.uid,
          forumId,
          status: 'pending',
        };

        const forumRef = doc(firestore, 'forums', forumId);
        const postsRef = collection(forumRef, 'posts');
        await addDoc(postsRef, newPost);

        setNewPostTitle('');
        setNewPostContent('');
        setModalVisible(false);
        fetchPosts();  // Fetch updated posts
        Alert.alert('Post Pending Approval', 'Your post has been submitted successfully and is currently pending approval.');
      } catch (error) {
        console.error('Error adding post:', error);
        Alert.alert('Error', 'Could not add post.');
      }
    } else {
      Alert.alert('Error', 'Please fill in both the title and content fields.');
    }
  };

  const renderPostItem = ({ item }) => (
    <TouchableOpacity
      style={styles.postContainer}
      onPress={() => {
        if (isMember || isCreator) {
          navigation.navigate('PostDetails', {
            postId: item.id,
            postTitle: item.title,
            postContent: item.content,
            postAuthor: item.author,
            postTime: item.time,
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
        <Text style={styles.timeText}>{item.time}</Text>
        <Text style={styles.authorText}>by Anonymous {item.author}</Text>
        
      </View>
    </TouchableOpacity>
  );

 // Leave forum handler
 const handleLeaveForum = async () => {
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

return (
  <RootLayout navigation={navigation} screenName={forumTitle} userType={userType} >
    <View style={styles.container}
    >
      {/* Forum Title with Edit Icon */}
      <View style={styles.titleContainer}>
        <Text style={styles.forumTitle}>{forumTitle}</Text>
        
        {isCreator && (
          <TouchableOpacity onPress={() => { setModalType("edit"); setModalVisible(true); }} style={styles.editIconContainer}>
            <Ionicons name="create-outline" size={24} color="#000" style={styles.editIcon} />
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
        // so no need to add size styling here
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
});
