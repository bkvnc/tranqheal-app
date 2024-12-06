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
  Image,
  Switch,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../providers';
import { getFirestore, collection, getDocs, query, where, addDoc, doc, getDoc, deleteDoc, updateDoc, increment, setDoc, serverTimestamp, FieldValue, arrayUnion } from 'firebase/firestore';
import { auth, firestore, storage } from 'src/config';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { LoadingIndicator } from '../components';


export const ForumPostScreen = ({ route, navigation }) => {
  const { forumId } = route.params;
  const [refreshing, setRefreshing] = useState(false);
  const [ loading, setLoading ] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [posts, setPosts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [editedTitle, setEditedTitle] = useState(null);
  const [editedTags, setEditedTags] = useState([]);
  const [editedContent, setEditedContent] = useState(null);
  const { userType } = useContext(AuthenticatedUserContext);  
  const [authorName, setAuthorName] = useState(null);
  const [authorType, setAuthorType] = useState(null);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [forumData, setForumData] = useState(null);
  const [ hasImage, setHasImage ] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [suspendReason , setSuspendReason] = useState('');
  const [isSuspended, setIsSuspended] = useState(false);

  const predefinedTags = [
    'Support', 'Awareness', 'Stress', 'Self-care', 'Motivation', 'Wellness', 'Mental Health'
  ];
  //im now in the forumpostscreeen
  
  const checkBanStatus = async () => {
    try {
      if (!auth.currentUser) {
        console.warn('User is not authenticated.');
        return;
      }
  
      console.log('Checking ban status for user:', auth.currentUser.uid);
  
      const bannedUsersRef = collection(firestore, `forums/${forumId}/bannedUsers`);
      const q = query(bannedUsersRef, where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
  
      if (!snapshot.empty) {
        const banData = snapshot.docs[0].data();
        setIsBanned(true);
        setBanReason(banData.reason ?? 'No reason provided');
      } else {
        setIsBanned(false);
        setBanReason('');
      }
    } catch (error) {
      console.error('Error while checking ban status:', error);
    }
  };

  const checkSuspendStatus = async () => {
    try {
      if (!auth.currentUser) {
        console.warn('User is not authenticated.');
        return;
      }
  
      console.log('Checking suspend status for user:', auth.currentUser.uid);
  
      const suspendedUsersRef = collection(firestore, `forums/${forumId}/suspendedUsers`);
      const q = query(suspendedUsersRef, where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
  
      if (!snapshot.empty) {
        const suspendData = snapshot.docs[0].data();
  
        // Extract suspension details
        const reason = suspendData.reason ?? 'No reason provided';
        const suspendedUntil = suspendData.suspendedUntil?.toDate(); // Convert Firestore timestamp to Date
        const currentDate = new Date();
  
        setIsSuspended(true);
        setSuspendReason(reason);
  
        if (suspendedUntil && suspendedUntil > currentDate) {
          const banEndDate = suspendedUntil.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
  
          // Show alert with suspension details
          Alert.alert(
            'Action Blocked',
            `You are suspended from this forum due to: ${reason}, until ${banEndDate}.`
          );
        } else if (suspendedUntil && suspendedUntil <= currentDate) {
          console.log('Suspension has expired.');
          setIsSuspended(false); // Reset suspension state if expired
        }
      } else {
        setIsSuspended(false);
      }
    } catch (error) {
      console.error('Error while checking suspend status:', error);
    }
  };
  
  
  // Fetch user data, forum details, posts, and membership status on mount
  useEffect(() => { 
    const fetchUserData = async () => {
      try {
        if (auth.currentUser) {
          const userRef = doc(firestore, 'users', auth.currentUser.uid);
          const profRef = doc(firestore, 'professionals', auth.currentUser.uid);
          
      
          const userSnapshot = await getDoc(userRef);

          if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            setAuthorName(`${userData.firstName} ${userData.lastName}`);
            setAuthorType(userData.userType);
          }else{
            const profSnapshot = await getDoc(profRef);
            if (profSnapshot.exists()) {
              const profData = profSnapshot.data();
              setAuthorName(`${profData.firstName} ${profData.lastName}`);
              setAuthorType(profData.userType);
          }
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Could not fetch user data.');
      } finally {
        setLoading(false);
      }
    };
    
    // Placeholder membership check
    const checkMembership = async () => {
    try {
      const membershipRef = collection(firestore, 'memberships'); // assuming there is membership collection
      const q = query(membershipRef, where('forumId', '==', forumId), where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      
      setIsMember(!snapshot.empty); // Set isMember based on whether a document exists
    } catch (error) {
      console.error('Error checking membership:', error);
      Alert.alert('Error', 'Could not check membership status.');
    }
    };
    checkBanStatus();
    checkSuspendStatus();
    fetchUserData();
    fetchPosts();
    checkMembership();
    fetchForumDetails();
  }, [auth.currentUser]);

  const onRefresh = async () => {
    setRefreshing(true); 
    await fetchPosts();  
    await fetchForumDetails();
    setRefreshing(false); 
  };

  // Function to fetch posts
  const fetchPosts = async () => {
    try {
        const postsRef = collection(firestore, `forums/${forumId}/posts`);
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
        const data = forumSnapshot.data();
        setForumData(data);
        setIsCreator(data.authorId === auth.currentUser.uid);
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
      const forumRef = doc(firestore, 'forums', forumId);
      await addDoc(membershipRef, {
        forumId: forumId,
        userId: auth.currentUser.uid, 
        joinedAt: new Date(),
      });

      await updateDoc(forumRef, {
        totalMembers: increment(1),
        members: arrayUnion(auth.currentUser.uid),
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

const openEditModal = () => {
  setEditedTitle(forumData?.title || ""); 
  setEditedContent(forumData?.content || ""); 
  setModalType("edit");
  setModalVisible(true);
};

const safeToLowerCase = (str) => (str ? str.toLowerCase() : "");

// Function to save forum edits
const handleSaveForumEdits = async () => {
  try {
    const blacklistedWordsRef = collection(firestore, 'blacklistedWords');
    const snapshot = await getDocs(blacklistedWordsRef);
    const blacklistedWords = snapshot.docs.map(doc => doc.data().word.toLowerCase());

    const editedTitleLower = safeToLowerCase(editedTitle);
    const editedContentLower = safeToLowerCase(editedContent);

    // Check for blacklisted words
    if (
      containsBlacklistedWord(editedTitleLower, blacklistedWords) || 
      containsBlacklistedWord(editedContentLower, blacklistedWords)
    ) {
      Alert.alert('Error', 'The forum title or content contains blacklisted words. Please remove them and try again.');
      return;
    }

    // Proceed with saving edits if there are changes
    const forumRef = doc(firestore, 'forums', forumId);
    await updateDoc(forumRef, {
      title: editedTitle,
      content: editedContent,
      tags: editedTags,
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
      setSelectedImageUri(selectedImage);
    }
  };
  

  // Add new post handler
  const handleAddPost = async () => {
    if (isBanned) {
      Alert.alert('Action Blocked', `You are banned from this forum due to: ${banReason}`);
      return;
    }

    if (isSuspended) {
      Alert.alert('Action Blocked', `You are suspended from this forum due to: ${suspendReason}`);
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
          setHasImage(true);
        }
  
        const newPost = {
          title: newPostTitle,
          content: newPostContent,
          dateCreated: new Date(),
          authorId: auth.currentUser.uid,
          authorName: authorName,
          authorType: authorType,
          forumId,
          status: 'pending',
          imageUrl: imageUrl,
          hasImage: hasImage,
          reacted: 0,
          reactedBy: [],
          isAnonymous: isAnonymous,
        };

        
  
        const forumRef = doc(firestore, 'forums', forumId);
          const postsRef = collection(forumRef, 'posts');
          const organizationRef = doc(firestore, 'organizations', 'organizationId');

          // Create the new post first and retrieve the document reference
          const postDocRef = await addDoc(postsRef, newPost);
          //update totalPosts in forum
          await updateDoc(forumRef, {
          totalPosts: increment(1),
        })
          // const postSnap = await getDoc(forumRef);
          // const orgSnap = await getDoc(organizationRef);
          // // Now that the post has been added, we can safely use the ID
          // const newPostId = postDocRef.id; // The new post's ID

          // // Create the notification reference
          // const notificationRef = doc(collection(firestore, `notifications/${postSnap.data().authorId}/messages`));

          // // Set the notification document with the new post ID
          // await setDoc(notificationRef, {
          //   recipientId: orgSnap.data().organizationId,
          //   recipientType: postSnap.data().authorType,  
          //   message: `${authorName} has submitted a new post for review.`,
          //   type: `post_review`,
          //   createdAt: serverTimestamp(), 
          //   isRead: false,
          //   additionalData: {
          //     postId: newPostId,  
          //     forumId: forumId,
          //   },
          // });

          // // Fetch and log the notification to check the createdAt field
          // const notificationDoc = await getDoc(notificationRef);
          // const notificationData = notificationDoc.data();

          // if (notificationData && notificationData.createdAt) {
          //   const createdAtDate = notificationData.createdAt.toDate();
          //   console.log("Notification createdAt:", createdAtDate); // For debugging
          // }
  
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
          const membershipRef = collection(firestore, 'memberships');
          const forumRef = doc(firestore, 'forums', forumId);
          const q = query(membershipRef, where('forumId', '==', forumId), where('userId', '==', auth.currentUser.uid));
          const snapshot = await getDocs(q);



          // Delete each membership document found (should be only one)
          snapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
            await updateDoc(forumRef, {
              totalMembers: increment(-1),
              members: arrayRemove(auth.currentUser.uid),
            });
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
  const reporterName = await getUserName();  // Retrieve the name of the reporter
  Alert.alert(
    "Report Forum",
    "Are you sure you want to report this forum?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        onPress: async () => {
          try {
            console.log("Reporting forum with ID:", forumId);

            // Reference the forum
            const forumRef = doc(firestore, "forums", forumId);
            const forumDoc = await getDoc(forumRef);

            if (forumDoc.exists()) {
              // Increment the report count
              const currentReportCount = forumDoc.data().reportCount || 0;
              await updateDoc(forumRef, {
                reportCount: currentReportCount + 1,
              });

              // Add a report document in the `reports` subcollection
              await addDoc(collection(forumRef, "reports"), {
                authorName: forumDoc.data().authorName,
                authorType: forumDoc.data().authorType,
                authorId: forumDoc.data().authorId,
                reporterName: reporterName,
                reportedBy: auth.currentUser.uid,
                reason: "Inappropriate content",
                timestamp: new Date(),
              });

              Alert.alert("Success", "Report submitted.");
            } else {
              Alert.alert("Error", "Forum not found.");
            }
          } catch (error) {
            console.error("Error reporting forum:", error);
            Alert.alert("Error", "Could not submit the report. Please try again.");
          }
        },
      },
    ],
    { cancelable: true }
  );
};

if (loading) {
  return <LoadingIndicator />;
}

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
      <Text style={styles.authorText}>by {item.isAnonymous ? 'Anonymous' : item.authorName}</Text>   
      {item.hasImage && (
        <View style={styles.imageLabelContainer}>
          <Ionicons name="image-outline" size={20} color="#7f4dff" />
          <Text style={styles.imageLabelText}>Image Attached</Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
);

return (
  <RootLayout navigation={navigation} screenName={"ForumPost"} userType={userType} >
    <View style={styles.container}
    >
      {/* Forum Title with Edit Icon */}
      <View style={styles.titleContainer}>
        <Text style={styles.forumTitle}>{forumData?.title}</Text>
        
        {isCreator ? (
          <TouchableOpacity onPress={openEditModal} style={styles.editIconContainer}>
            <Ionicons name="create-outline" size={24} color="#000" style={styles.editIcon} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleReportForum} style={styles.editIconContainer}>
            <Ionicons name="alert-circle-outline" size={24} color="#000" style={styles.editIcon} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.forumAuthor}>by {forumData?.authorName}</Text>
      <Text style={styles.forumContent}>
        {forumData?.content}
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
                <View style={styles.attachContainer}>
                  <TouchableOpacity onPress={pickImage} style={styles.attachButton}>
                    <Ionicons name="image-outline" size={28} color="#2F2F2F" />
                    <Text style={styles.attachText}>Attach Image</Text>
                  </TouchableOpacity>
                  {selectedImageUri && (
                    <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />
                  )}
                </View>

                  {/* Anonymous Toggle */}
                  <View style={styles.toggleContainer}>
                    <Text style={styles.toggleLabel}>Post as Anonymous</Text>
                    <Switch
                      value={isAnonymous}
                      onValueChange={(value) => setIsAnonymous(value)}
                    />
                  </View>

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

  // Forum Header Styles
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 10,
},
forumTitle: {
    fontSize: 26, 
    fontWeight: 'bold',
    flex: 1,
    color: '#333', 
},
forumAuthor: {
    fontSize: 14, 
    color: '#666', 
},
forumContent: {
    fontSize: 16,  
    color: '#444', 
    marginVertical: 10,
    lineHeight: 22, 
},
editIconContainer: {
    padding: 10,
},
editIcon: {
    
},

  // Post List Styles
postContainer: { 
    padding: 15,
    marginVertical: 8, 
    backgroundColor: '#f9f9f9', 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0', 
},
postTitle: {
    fontSize: 16,
    fontWeight: '600', 
    color: '#222', 
    marginBottom: 5,
    lineHeight: 20, 
},
postContent: {
    fontSize: 14,
    color: '#555', 
    lineHeight: 18, 
},
metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
},
authorText: {
    fontSize: 12,
    color: '#777', 
},
imageLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    justifyContent: 'flex-end',
},
imageLabelText: {
    marginLeft: 5,
    fontSize: 12,
    color: '#7f4dff',
},

 // Add New Post or Join Forum Styles
joinButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center', 
  backgroundColor: '#7f4dff',
  paddingVertical: 12,
  paddingHorizontal: 20, 
  borderRadius: 10, 
  marginBottom: 15, 
},
joinButtonText: {
  color: '#fff',
  marginLeft: 8, 
  fontSize: 16,
  fontWeight: '500', 
},
addButton: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#7129F2',
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 10,
  marginBottom: 15,
},
addButtonText: {
  color: '#fff',
  marginLeft: 8,
  fontSize: 16,
  fontWeight: '500',
},

// Leave Forum or Delete Forum Styles
leaveButton: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#7f4dff',
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 10,
  marginBottom: 15,
},
leaveButtonText: {
  color: '#fff',
  marginLeft: 8,
  fontSize: 16,
  fontWeight: '500',
},

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', 
},
modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 24, 
    borderRadius: 12, 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOpacity: 0.2,
    shadowRadius: 10,
},
modalTitle: {
    fontSize: 20, 
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333', 
},
newPostTitleInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#bbb', 
    marginBottom: 15, 
    paddingVertical: 8,
},
newPostContentInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8, 
    padding: 12,
    height: 120, 
    textAlignVertical: 'top',
    marginBottom: 15,
},
attachContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start', 
},
attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5, 
},
attachText: {
    marginLeft: 8, 
    fontSize: 16,
    color: '#444', 
},
imagePreview: {
    width: 70, 
    height: 70,
    marginBottom: 12,
    borderRadius: 12,
},
toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8, 
},
toggleLabel: {
    fontSize: 16,
    color: '#444',
},
modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
},
cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    backgroundColor: '#e0e0e0', 
    borderRadius: 8,
},
cancelButtonText: {
    color: '#444', 
    fontWeight: '500',
},
submitButton: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    backgroundColor: '#7f4dff',
    borderRadius: 8,
},
submitButtonText: {
    color: '#fff',
    fontWeight: '600', 
},

  // Tags Section Styles
  tagSectionTitle: {
    fontSize: 18, 
    fontWeight: 'bold',
    marginBottom: 8, 
    color: '#333',
},
tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12, 
},
tagButton: {
    paddingVertical: 6, 
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 18, 
    margin: 4,
    borderWidth: 1,
    borderColor: 'transparent', 
},
selectedTag: {
    backgroundColor: '#7f4dff',
    borderColor: '#6a3bdc', 
},
tagButtonText: {
    color: '#333',
    fontWeight: '500', 
},

  // No Posts Message Styles
noPostsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20, 
},
noPostsText: {
    fontSize: 18, 
    color: '#888',
    textAlign: 'center', 
    lineHeight: 26, 
},
});