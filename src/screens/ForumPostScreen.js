import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Dimensions,
  Alert,
  FlatList,
  KeyboardAvoidingView
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { RootLayout } from '../navigation/RootLayout';
import { getFirestore, collection, getDocs, query, where, addDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const ForumPostScreen = ({ route, navigation }) => {
    const { forumId, forumTitle } = route.params; // Get forumId and forumTitle from route params

    const [posts, setPosts] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');

    // Fetch posts from Firestore when component mounts
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const db = getFirestore();
                const postsRef = collection(db, 'posts');
                const q = query(postsRef, where('forumId', '==', forumId)); // Query posts by forumId
                const snapshot = await getDocs(q);
                const fetchedPosts = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setPosts(fetchedPosts); // Set fetched posts in state
            } catch (error) {
                console.error("Error fetching posts: ", error);
                Alert.alert('Error', 'Could not fetch posts.');
            }
        };
        fetchPosts();
    }, [forumId]);

    const handleAddPost = async () => {
        if (newPostTitle && newPostContent) {
            const newPost = {
                title: newPostTitle,
                content: newPostContent,
                time: new Date().toLocaleString(),
                author: 'You',
                forumId: forumId // Associate post with forum
            };
            try {
                await addDoc(collection(getFirestore(), 'posts'), newPost); // Add new post to Firestore
                setPosts([newPost, ...posts]); // Update local state with new post
                setNewPostTitle('');
                setNewPostContent('');
                setModalVisible(false);
            } catch (error) {
                console.error("Error adding post: ", error);
                Alert.alert('Error', 'Could not add post.');
            }
        } else {
            Alert.alert('Error', 'Please fill in both the title and content fields.');
        }
    };

    const renderPostItem = ({ item }) => (
        <TouchableOpacity
            style={styles.postContainer}
            onPress={() =>
                navigation.navigate('PostDetails', {
                    postId: item.id,
                    postTitle: item.title,
                    postContent: item.content,
                    postAuthor: item.author,
                    postTime: item.time,
                })
            }
        >
            <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.postContent} numberOfLines={2}>
                {item.content}
            </Text>
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

                {/* Add New Post Button */}
                <TouchableOpacity 
                    style={styles.addButton} 
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="add-circle-outline" size={24} color="#fff" />
                    <Text style={styles.addButtonText}>Add New Post</Text>
                </TouchableOpacity>

                {/* Posts List */}
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
                            <Text style={styles.modalTitle}>Create a New Post</Text>
                            <TextInput
                                style={styles.newPostTitleInput}
                                placeholder="Post Title"
                                value={newPostTitle}
                                onChangeText={setNewPostTitle}
                            />
                            <TextInput
                                style={styles.newPostContentInput}
                                placeholder="What's on your mind?"
                                value={newPostContent}
                                onChangeText={setNewPostContent}
                                multiline={true}
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
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        marginHorizontal: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    newPostTitleInput: {
        borderColor: '#ddd',
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        marginBottom: 10,
    },
    newPostContentInput:{
      borderColor:'#ddd' ,
      borderWidth :1 ,
      paddingHorizontal :10 ,
      paddingVertical :5 ,
      borderRadius :5 ,
      marginBottom :10 ,
      height :100 ,
   },
   modalButtons:{
       flexDirection:'row' ,
       justifyContent:'space-between' ,
   },
   cancelButton:{
       backgroundColor:'#ff4d4d' ,
       padding :10 ,
       borderRadius :5 ,
       flex :1 ,
       marginRight :5 ,
   },
   cancelButtonText:{
       color:'#fff' ,
       textAlign:'center' ,
   },
   submitButton:{
       backgroundColor:'#4CAF50' ,
       padding :10 ,
       borderRadius :5 ,
       flex :1 ,
   },
   submitButtonText:{
       color:'#fff' ,
       textAlign:'center' ,
   },
    postContainer:{
       padding :15 ,
       marginBottom :15 ,
       backgroundColor:'#f0f0f0' ,
       borderRadius :10 ,
   },
   postTitle:{
       fontSize :18 ,
       fontWeight:'bold' ,
   },
   postContent:{
       fontSize :16 ,
       color:'#333' ,
   },
   metaContainer:{
       flexDirection:'row' ,
       justifyContent:'space-between' ,
       marginTop :10 ,
   },
   timeText:{
       fontSize :12 ,
       color:'#888' ,
   },
   authorText:{
       fontSize :12 ,
       color:'#888' ,
   }
});

export default ForumPostScreen;