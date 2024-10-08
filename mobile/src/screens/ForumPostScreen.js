import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, StyleSheet, Dimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { RootLayout } from '../navigation/RootLayout';

const { width } = Dimensions.get('window');

export const ForumPostScreen = ({ route, navigation }) => {
    const { forumId, forumTitle, forumTags } = route.params;

    // Sample data for posts
    const [posts, setPosts] = useState([
        { id: '1', title: 'How do I manage anxiety?', content: 'I need advice on coping with anxiety...', time: '2h ago', author: 'John Doe' },
        { id: '2', title: 'What are the best practices for self-care?', content: 'Looking for tips on self-care routines.', time: '4h ago', author: 'Jane Smith' },
    ]);

    const [modalVisible, setModalVisible] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [isJoined, setIsJoined] = useState(false);
    const [memberCount, setMemberCount] = useState(50); // Sample member count
    const [selectedTags, setSelectedTags] = useState(['Mental Health', 'Self-care']); // Sample selected tags

    const handleJoinForum = () => {
        if (!isJoined) {
            setIsJoined(true);
            setMemberCount(memberCount + 1);
        }
    };

    const handleAddPost = () => {
        if (newPostTitle && newPostContent) {
            const newPost = {
                id: String(posts.length + 1),
                title: newPostTitle,
                content: newPostContent,
                time: 'Just now',
                author: 'You',
            };
            setPosts([newPost, ...posts]);
            setNewPostTitle('');
            setNewPostContent('');
            setModalVisible(false);
        } else {
            alert('Please fill in both the title and content fields.');
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

    const renderTags = () => {
      return (
        <View style={styles.tagContainer}>
          {forumTags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text color="white">{tag}</Text>
            </View>
          ))}
        </View>
      );
    };

    return (
        <RootLayout navigation={navigation} screenName={forumTitle}>
            <View style={styles.container}>
                <View style={styles.headerContainer}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.header} numberOfLines={1}>{forumTitle}</Text>
                    </View>
                    <View style={styles.joinSection}>
                        <Text style={styles.memberCount}>{memberCount} Members</Text>
                        {!isJoined ? (
                            <TouchableOpacity style={styles.joinButton} onPress={handleJoinForum}>
                                <Text style={styles.joinButtonText}>Join</Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.joinedText}>Joined</Text>
                        )}
                    </View>
                </View>
                {renderTags()}
                <View style={styles.divider} />

                <TouchableOpacity
                    style={styles.addPostButton}
                    onPress={() => (isJoined ? setModalVisible(true) : alert('Join the forum to post'))}
                >
                    <Ionicons name="add-circle-outline" size={24} color="white" />
                    <Text style={styles.addPostButtonText}>Add Post</Text>
                </TouchableOpacity>

                <FlatList data={posts} renderItem={renderPostItem} keyExtractor={(item) => item.id} style={styles.postList} />

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
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    titleContainer: {
        flex: 1, // Adjust to occupy available space
        marginRight: 10, // Margin to avoid overlap with joinSection
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        flexWrap: 'wrap',
    },
    joinSection: {
        alignItems: 'center',
    },
    memberCount: {
        fontSize: 12,
        marginBottom: 5,
        color: '#6c757d',
    },
    joinButton: {
        backgroundColor: '#7129F2',
        padding: 10,
        borderRadius: 8,
    },
    joinButtonText: {
        color: 'white',
    },
    joinedText: {
        color: '#6c757d',
        fontSize: 16,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginVertical: 10, 
    },
    tag: {
      backgroundColor: '#B9A2F1',
      color: '#fff',
      paddingHorizontal: 8,
      paddingVertical: 4,
      margin: 2,
      borderRadius: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#ddd',
        marginVertical: 20,
    },
    addPostButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#7129F2',
        padding: 10,
        borderRadius: 8,
        marginBottom: 20,
    },
    addPostButtonText: {
        color: 'white',
        marginLeft: 5,
        fontSize: 16,
    },
    postList: {
        marginTop: 20,
    },
    postContainer: {
        backgroundColor: '#f0f0f0',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    postTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
        maxWidth: width - 40,
        flexWrap: 'wrap',
        color: '#333',
    },
    postContent: {
        fontSize: 14,
        color: '#333',
        marginBottom: 10,
    },
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timeText: {
        fontSize: 12,
        color: '#6c757d',
    },
    authorText: {
        fontSize: 12,
        color: '#6c757d',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    newPostTitleInput: {
        fontSize: 16,
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
    },
    newPostContentInput: {
        fontSize: 16,
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 8,
        minHeight: 80,
        marginBottom: 10,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cancelButton: {
        backgroundColor: '#f44336',
        padding: 10,
        borderRadius: 8,
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 16,
    },
    submitButton: {
        backgroundColor: '#7129F2',
        padding: 10,
        borderRadius: 8,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
    },
});
