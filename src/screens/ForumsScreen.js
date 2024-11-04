import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput, 
  Modal,
  StyleSheet,
  Dimensions,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  RefreshControl
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AuthenticatedUserContext } from '../providers';
import { RootLayout } from '../navigation/RootLayout';
import { getDocs, getFirestore, collection, addDoc,doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from 'src/config';


export const ForumsScreen = ({ navigation }) => {
  const { user, userType } = useContext(AuthenticatedUserContext); 
  const [authorName, setAuthorName] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [forums, setForums] = useState([]);
  const [filteredForums, setFilteredForums] = useState([]); 
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [forumTitle, setForumTitle] = useState('');
  const [forumContent, setForumContent] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Predefined tags
  const predefinedTags = ['Support', 'Awareness', 'Stress', 'Self-care', 'Motivation', 'Wellness', 'Mental Health'];
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    if (user) {
      setAuthorName(`${user.firstName} ${user.lastName}`);  // Use context data
      fetchUserDataAndForums();
    }
  }, [user]);

  // Function to fetch user data and forums
  const fetchUserDataAndForums = async () => {
    try {
      if (user) {
        // Fetch forums as before
        const db = getFirestore();
        const postsRef = collection(db, 'forums');
        const snapshot = await getDocs(postsRef);
        const fetchedForums = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setForums(fetchedForums);
        setFilteredForums(fetchedForums); // Initialize filtered forums
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Could not fetch data.');
    }
  };

  // Refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserDataAndForums(); // Fetch user and forums data on refresh
    setRefreshing(false);
  };

  useEffect(() => {
    fetchUserDataAndForums(); // Fetch user data and forums on mount
  }, []);

   // Search function to filter forums by title or tags
  const searchFilterFunction = (text) => {
    setSearchQuery(text); // Update search query
    let newData = forums; // Start with all forums

    // Filter by search text
    if (text) {
      newData = newData.filter((forum) => {
        const forumTitle = forum.title ? forum.title.toUpperCase() : '';
        const forumTags = forum.tags ? forum.tags.map(tag => tag.toUpperCase()) : [];
        const searchText = text.toUpperCase();

        return forumTitle.includes(searchText) || forumTags.some(tag => tag.includes(searchText));
      });
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      newData = newData.filter((forum) =>
        forum.tags && selectedTags.some(selectedTag => forum.tags.includes(selectedTag))
      );
    }
    
    setFilteredForums(newData); // Update filtered forums
  };

  // Handle tag selection
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
    // If you're in the search section, call the search filter function
    if (isSearching) {
      searchFilterFunction(searchQuery);
    }
  };

  // Validation and create forum
  const createForum = async () => {
    if (!forumTitle || !forumContent) {
      Alert.alert('Error', 'Please enter both a title and content for the forum.');
      return;
    }

    const newForum = {
      authorId: auth.currentUser.uid,
      authorName: authorName,
      authorType: userType,
      title: forumTitle,
      status: 'pending',
      content: forumContent,
      dateCreated: new Date().toLocaleString(),
      tags: selectedTags, // Use selectedTags for forum creation
    };

    try {
      const db = getFirestore();
      const docRef = await addDoc(collection(db, 'forums'), newForum);
      setForums([...forums, { id: docRef.id, ...newForum }]);
      setFilteredForums([...filteredForums, { id: docRef.id, ...newForum }]); // Update filtered list as well
      setForumTitle('');
      setForumContent('');
      setSelectedTags([]); // Clear selected tags after creating the forum
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error creating forum: ", error);
      Alert.alert('Error', 'Could not create forum.');
    }
  };

  // Render forum item
  const renderForumItem = ({ item }) => {
    const maxTagsToShow = 3; // Set the maximum number of tags to display

    return (
      <View style={styles.forumContainer}>
        <Text style={styles.forumTitle}>{item.title}</Text>

        {/* Display only the first few tags */}
        <View style={styles.tagContainer}>
          {item.tags && item.tags.slice(0, maxTagsToShow).map((tag, index) => (
            <Text key={index} style={styles.tag}>{tag}</Text>
          ))}
          {item.tags && item.tags.length > maxTagsToShow && (
            <Text style={styles.moreTags}>+{item.tags.length - maxTagsToShow} more</Text> // Show "more" indicator
          )}
        </View>

        <TouchableOpacity
          style={styles.visitButton}
          onPress={() => navigation.navigate('ForumDetails', 
            {
              forumId: item.id,
              forumTitle: item.title,
              forumAuthorId: item.authorId, // Pass the creator's ID to ForumPostScreen
            })}
        >
          <Ionicons name="arrow-forward" size={18} color="white" />
          <Text style={styles.visitButtonText}>Visit Forum</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <RootLayout navigation={navigation} screenName="Forums" userType={userType}>
       <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.textContainer}>
            <Text style={styles.greeting}>Forums</Text>
            <Text style={styles.subText}>Connect, Discuss, and Support</Text>
          </View>

          <View style={styles.iconContainer}>
            <TouchableOpacity style={styles.addForumButton} onPress={() => setIsModalVisible(true)}>
              <Ionicons name="add-circle-outline" size={24} color="white" />
              <Text style={styles.addForumButtonText}> Add Forum</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsSearching(!isSearching)} style={{ marginLeft: 8 }}>
              <Ionicons name="search-outline" size={32} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        {isSearching && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search forums..."
              value={searchQuery}
              onChangeText={(text) => {
                searchFilterFunction(text); // Call search function
              }}
            />

              {/* Tag List for Filtering */}
              <View style={styles.predefinedTagsContainer}>
              {predefinedTags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.tagOption, selectedTags.includes(tag) && styles.selectedTagOption]}
                  onPress={() => toggleTag(tag)} // Toggle selection
                >
                  <Text style={styles.tagOptionText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
              )}

        {/* Forum List */}
        <ScrollView style={styles.forumsList}>
          {filteredForums.map((forum) => (
            <View key={forum.id}>{renderForumItem({ item: forum })}</View> // Add key prop
          ))}
        </ScrollView>

        {/* Modal for Adding New Forum */}
        <Modal visible={isModalVisible} animationType="slide">
          <KeyboardAvoidingView behavior="padding" style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Forum</Text>
            </View>

            {/* Forum title and content inputs */}
            <TextInput
              style={styles.modalInput}
              placeholder="Forum Title"
              value={forumTitle}
              onChangeText={(text) => setForumTitle(text)}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Forum Content"
              value={forumContent}
              onChangeText={(text) => setForumContent(text)}
              multiline
            />

            {/* Tag Selection */}
            <Text style={styles.tagSelectionTitle}>Select Tags</Text>
            <View style={styles.predefinedTagsContainer}>
              {predefinedTags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.predefinedTag,
                    selectedTags.includes(tag) ? styles.selectedTag : styles.unselectedTag,
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={styles.tagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Buttons in a row */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.createForumButton} onPress={createForum}>
                <Text style={styles.createForumButtonText}>Create Forum</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
        </View>
      </ScrollView>
    </RootLayout>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  greeting: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  addForumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7129F2',
    padding: 10,
    borderRadius: 8,
  },
  addForumButtonText: {
    color: '#fff',
    marginLeft: 5,
  },
  subText: {
    fontSize: 14,
    color: '#6c757d',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
   },
   searchContainer:{
     marginTop :20 ,
     borderBottomWidth :1 ,
     borderBottomColor :'#ccc' ,
   },
   searchInput:{
     height :40 ,
     paddingHorizontal :10 ,
     fontSize :16 ,
     borderColor :'#ddd' ,
     borderWidth :1 ,
     borderRadius :10 ,
   },
   forumsList:{
     marginTop :20 ,
   },
   forumContainer:{
     padding :15 ,
     marginBottom :15 ,
     backgroundColor:'#f0f0f0' ,
     borderRadius :10 ,
   },
   forumTitle:{
     fontSize :18 ,
     fontWeight:'bold' ,
   },
   metaContainer:{
     flexDirection:'row' ,
     justifyContent:'space-between' ,
     alignItems:'center' ,
   },
   tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8, 
  },
  tag: {
    backgroundColor: '#B9A2F1',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 5, 
    marginVertical: 5, 
    gap: 5,
    borderRadius: 12,
  },
   moreTags: {
    backgroundColor: '#B9A2F1',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    margin: 2,
    borderRadius: 12,
    fontWeight: 'bold',
    },
    tagList: {
      flexDirection: 'row',
      marginTop: 10,
    },
    tagOption: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: '#ECE6F0',
      borderRadius: 16,
      margin: 6,
    },
    tagSelectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 10, 
    },
    selectedTagOption: {
      backgroundColor: '#7129F2', 
    },
    tagOptionText: {
      color: '#000',
      fontSize: 14,
    },
   modalContainer:{
     flex :1 ,
     padding :20 ,
   },
   modalHeader:{
     flexDirection:'row' ,
     justifyContent:'space-between' ,
     alignItems:'center' ,
     marginTop :20 ,
     marginBottom :20 ,
   },
   modalTitle:{
     fontSize :22 ,
     fontWeight:'bold' ,
     marginBottom :8 ,
   },
   modalInput:{
     marginBottom :15 ,
     borderColor:'#ddd' ,
     borderWidth :1 ,
     padding :10 ,
     borderRadius :10 ,
   },
   predefinedTagsContainer:{
     flexDirection:'row' ,
     flexWrap:'wrap' ,
     marginBottom :5 ,
     gap: 5,
   },
   predefinedTag:{
     padding :10 ,
     borderRadius :20 ,
     marginRight :10 ,
     marginBottom :10 ,
   },
   selectedTag:{
       backgroundColor:'#B9A2F1',
   },
   unselectedTag:{
       backgroundColor:'#ECE6F0',
   },
   visitButton:{
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7f4dff',
    paddingVertical: 4,   // Slight padding to fit content snugly
    paddingHorizontal: 8, // Adjusted padding to fit around text
    borderRadius: 10,
    alignSelf: 'flex-start', 
   },
   visitButtonText:{
       color :'#fff', 
       fontSize: 14, // Adjust font size as desired
       marginLeft: 4,
   },
   buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  createForumButton: {
    backgroundColor: '#7129F2',  // Violet color
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  createForumButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',  
    flex: 1,
  },
  cancelButtonText: {
    color: '#000',  // 
    fontSize: 16,
    fontWeight: 'bold',
  },  
});
