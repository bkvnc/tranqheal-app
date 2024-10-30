import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  Alert
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { RootLayout } from '../navigation/RootLayout';
import { getFirestore, collection, getDocs, query, where, addDoc, doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from 'src/config';

export const ForumPostScreen = ({ route, navigation }) => {
  const { forumId, forumTitle, forumAuthorId } = route.params;
  const [userType, setUserType] = useState(null);
  const [authorName, setAuthorName] = useState('');
  const [posts, setPosts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => { 
    const fetchUserData = async () => {
      try {
        if (auth.currentUser) {
          const userRef = doc(firestore, 'users', auth.currentUser.uid);
          const userSnapshot = await getDoc(userRef);

          if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            setUserType(userData.userType);
            setAuthorName(`${userData.firstName} ${userData.lastName}`);
            setIsCreator(auth.currentUser.uid === forumAuthorId); // Check if user is creator
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Could not fetch user data.');
      }
    };

    fetchUserData();
    fetchPosts();
    checkMembership();
  }, [auth.currentUser]);

  // Function to fetch posts
  const fetchPosts = async () => {
    try {
      const db = getFirestore();
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, where('forumId', '==', forumId), where('status', '==', 'approved'));

      const snapshot = await getDocs(q);
      const fetchedPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error fetching posts: ', error);
      Alert.alert('Error', 'Could not fetch posts.');
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

  // Join forum handler
  const handleJoinForum = async () => {
    setIsMember(true);
    Alert.alert('Success', 'You have joined the forum!');
  };

  // Add new post handler
  const handleAddPost = async () => {
    if (newPostTitle && newPostContent) {
      const newPost = {
        title: newPostTitle,
        content: newPostContent,
        time: new Date().toLocaleString(),
        userType,
        authorId: auth.currentUser.uid,
        authorName,
        forumId,
        status: 'pending'
      };
      try {
        await addDoc(collection(getFirestore(), 'posts'), newPost);
        setNewPostTitle('');
        setNewPostContent('');
        setModalVisible(false);
        fetchPosts(); // Refresh posts after adding a new one
      } catch (error) {
        console.error('Error adding post: ', error);
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
        <Text style={styles.authorText}>by {item.author}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <RootLayout navigation={navigation} screenName={forumTitle}>
      <View style={styles.container}>
        <Text style={styles.forumTitle}>{forumTitle}</Text>
  
        {/* Conditionally render Join or Add Post Button */}
        {isCreator ? (
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add New Post</Text>
          </TouchableOpacity>
        ) : (
          !isMember && (
            <TouchableOpacity 
              style={styles.joinButton} 
              onPress={handleJoinForum}
            >
              <Ionicons name="person-add" size={24} color="#fff" />
              <Text style={styles.joinButtonText}>Join Forum</Text>
            </TouchableOpacity>
          )
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
          />
        )}
  
        {/* Modal for adding a new post */}
        <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
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
});
