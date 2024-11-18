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
import { getDocs, getFirestore, collection, addDoc,doc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, firestore } from 'src/config';
import { LoadingIndicator } from '../components';


export const ForumsScreen = ({ navigation }) => {
  const { user, userType } = useContext(AuthenticatedUserContext); 
  const [authorName, setAuthorName] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [ loading, setLoading ] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [forums, setForums] = useState([]);
  const [filteredForums, setFilteredForums] = useState([]); 
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [forumTitle, setForumTitle] = useState('');
  const [forumContent, setForumContent] = useState('');
  const [blacklistedWords, setBlacklistedWords] = useState([]);
  const [showAllTags, setShowAllTags] = useState(false);

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
        // Fetch user profile from Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setAuthorName(`${userData.firstName} ${userData.lastName}`);
        } else {
          console.warn('No such document!');
        }
  
        // Fetch forums as before
        const postsRef = collection(firestore, 'forums');
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
    } finally {
      setLoading(false);
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
    fetchBlacklistedWords();
  }, []);

   // Search function to filter forums by title or tags
   const searchFilterFunction = () => {
    let newData = forums;

    if (searchQuery) {
      newData = newData.filter((forum) => {
        const forumTitle = forum.title ? forum.title.toUpperCase() : '';
        const forumTags = forum.tags ? forum.tags.map(tag => tag.toUpperCase()) : [];
        const searchText = searchQuery.toUpperCase();
        return forumTitle.includes(searchText) || forumTags.some(tag => tag.includes(searchText));
      });
    }

    if (selectedTags.length > 0) {
      newData = newData.filter((forum) =>
        forum.tags && selectedTags.every(selectedTag => forum.tags.includes(selectedTag))
      );
    }

    setFilteredForums(newData);
  };
  
  // Handle tag selection
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  //Clear tags
  const clearFilterTags = () => {
    setSelectedTags([]);
  };

  // Function to fetch blacklisted words from Firebase
  const fetchBlacklistedWords = async () => {
    try {
      const blacklistedWordsRef = collection(firestore, 'blacklistedWords');
      const snapshot = await getDocs(blacklistedWordsRef);
      const words = snapshot.docs.map(doc => doc.data().word.toLowerCase());
      setBlacklistedWords(words);
    } catch (error) {
      console.error("Error fetching blacklisted words:", error);
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
  const containsBlacklistedWord = (text) => {
    return blacklistedWords.some((word) => {
      const regex = createFlexibleRegex(word);  // Create a flexible regex for each blacklisted word
      return regex.test(text);  // Test the text against the flexible regex pattern
    });
  };

  // Validation and create forum
  const createForum = async () => {
  if (!forumTitle || !forumContent) {
    Alert.alert('Error', 'Please enter both a title and content for the forum.');
    return;
  }

  // Check for blacklisted words in title and content
  const forumTitleLower = forumTitle.toLowerCase();
  const forumContentLower = forumContent.toLowerCase();

  if (containsBlacklistedWord(forumTitleLower) || containsBlacklistedWord(forumContentLower)) {
    Alert.alert('Error', 'Forum title or content contains blacklisted words. Please remove them and try again.');
    return;
  }
  
    const newForum = {
      authorId: auth.currentUser.uid,
      authorName: authorName,
      authorType: userType,
      title: forumTitle,
      status: 'pending',
      content: forumContent,
      dateCreated: Timestamp.now(),
      tags: selectedTags,
    };

    try {
      const docRef = await addDoc(collection(firestore, 'forums'), newForum);
      setForums([...forums, { id: docRef.id, ...newForum }]);
      setFilteredForums([...filteredForums, { id: docRef.id, ...newForum }]);
      setForumTitle('');
      setForumContent('');
      setSelectedTags([]);
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error creating forum: ", error);
      Alert.alert('Error', 'Could not create forum.');
    }
  };

  // Render forum item
  const renderForumItem = ({ item }) => {
    const maxTagsToShow = 2;
    // Format the forum creation date
    const formattedDate = item.dateCreated ? new Date(item.dateCreated.seconds * 1000).toLocaleDateString() : '';
  
    return (
      <View style={styles.forumContainer} key={item.id}>
        <Text style={styles.forumTitle}>{item.title}</Text>
  
        {/* Meta Information (Date and Tags) */}
        <View style={styles.metaContainer}>
          {/* Date above tags */}
          <Text style={styles.forumDate}>{formattedDate}</Text>
  
          {/* Display Tags */}
          <View style={styles.tagContainer}>
            {item.tags &&
              (showAllTags ? item.tags : item.tags.slice(0, maxTagsToShow)).map((tag, index) => (
                <Text key={index} style={styles.tag}>{tag}</Text>
              ))}
  
            {/* Toggle Button for More Tags */}
            {item.tags && item.tags.length > maxTagsToShow && (
              <TouchableOpacity onPress={() => setShowAllTags(!showAllTags)}>
                <Text style={styles.moreTags}>
                  {showAllTags ? 'Show less' : `+${item.tags.length - maxTagsToShow}`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
  
        <TouchableOpacity
          style={styles.visitButton}
          onPress={() => navigation.navigate('ForumDetails', {
            forumId: item.id,
            forumTitle: item.title,
            forumAuthorId: item.authorId,
          })}
        >
          <Ionicons name="arrow-forward" size={18} color="white" />
          <Text style={styles.visitButtonText}>Visit</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return <LoadingIndicator />;
  }
  
  return (
    <RootLayout navigation={navigation} screenName="Forums" userType={userType}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.container}>
          {/* Header and Search Bar */}
          <View style={styles.header}>
            <View style={styles.textContainer}>
              <Text style={styles.greeting}>Forums</Text>
              <Text style={styles.subText}>Connect, Discuss, and Support</Text>
            </View>
            <View style={styles.iconContainer}>
              <TouchableOpacity style={styles.addForumButton} onPress={() => setIsModalVisible(true)}>
                <Ionicons name="add-circle-outline" size={24} color="white" />
                <Text style={styles.addForumButtonText}>Create Forum</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsSearching(!isSearching)} style={{ marginLeft: 8 }}>
                <Ionicons name="search-outline" size={32} color="black" />
              </TouchableOpacity>
            </View>
          </View>
  
          {/* Search Bar and Tag Filter */}
          {isSearching && (
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search forums..."
                value={searchQuery}
                onChangeText={(text) => setSearchQuery(text)}
              />
              <View style={styles.predefinedTagsContainer}>
                {predefinedTags.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.tagOption, selectedTags.includes(tag) ? styles.selectedTagOption : null]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[styles.tagOptionText, selectedTags.includes(tag) ? { color: '#fff' } : { color: '#333' }]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.searchActionsContainer}>
                <TouchableOpacity style={styles.searchButton} onPress={searchFilterFunction}>
                  <Text style={styles.searchButtonText}>Search</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.clearButton} onPress={clearFilterTags}>
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
            </View>
            </View>
          )}
  
          {/* Display Filtered Forums */}
          <View style={styles.forumsList}>
          {filteredForums.length === 0 ? (
            <Text></Text>
          ) : (
            filteredForums.map((forum) => renderForumItem({ item: forum, key: forum.id }))
          )}
          </View>
        </View>
      </ScrollView>
  
      {/* Modal for Creating a Forum */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Forum</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
            </TouchableOpacity>
          </View>
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
          <Text style={styles.tagSelectionTitle}>Select Tags:</Text>
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
                <Text style={[styles.tagOptionText, selectedTags.includes(tag) ? { color: '#fff' } : { color: '#333' }]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.createForumButton} onPress={createForum}>
              <Text style={styles.createForumButtonText}>Create Forum</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  searchContainer: {
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  searchInput: {
    height: 40,
    paddingHorizontal: 10,
    fontSize: 16,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
  },
  searchActionsContainer: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 10,
  },
  searchButton: {
    flex: 1, 
    backgroundColor: '#7129F2',
    padding: 10,
    borderRadius: 5,
    marginRight: 5, 
    alignItems: 'center', 
  },
  clearButton: {
    flex: 1, 
    backgroundColor: '#D3D3D34D',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center', 
  },
  searchButtonText: {
    color: 'white',
  },
  clearButtonText: {
    color: '#333',
  },  
  forumsList: {
    marginTop: 20,
  },
  forumContainer: {
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  forumTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  forumDate: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
    marginRight: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  tag: {
    backgroundColor: '#B9A2F1',
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 7,
    fontSize: 12,
    marginHorizontal: 3,
    marginBottom: 3,
  },
  moreTags: {
    backgroundColor: '#B9A2F1',
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 7,
    fontSize: 12,
    marginHorizontal: 3,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  visitButton: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7f4dff',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  visitButtonText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 4,
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
    color: '#fff',
  },
  tagOptionText: {
    fontSize: 14,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalInput: {
    marginBottom: 15,
    borderColor: '#ddd',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
  },
  predefinedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 5,
    gap: 5,
  },
  predefinedTag: {
    padding: 10,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedTag: {
    backgroundColor: '#B9A2F1',
  },
  unselectedTag: {
    backgroundColor: '#ECE6F0',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  createForumButton: {
    backgroundColor: '#7129F2',
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
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

