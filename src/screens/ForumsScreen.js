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
  const [authorType, setAuthorType] = useState(null);
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
  const [showAllTags, setShowAllTags] = useState({});

  // Predefined tags
  const predefinedTags = ['Support', 'Awareness', 'Stress', 'Self-care', 'Motivation', 'Wellness', 'Mental Health'];
  const [selectedTags, setSelectedTags] = useState([]);
  

  useEffect(() => {
    if (user) {
      fetchUserDataAndForums();
    }
  }, [user]);

  // Function to fetch user data and forums
  const fetchUserDataAndForums = async () => {
    try {
      if (user) {
        // Fetch user profile from Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        const profRef = doc(firestore, 'professionals', auth.currentUser.uid);
        const userSnapshot = await getDoc(userDocRef);
        
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
  
  // Handle tag selection for search
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  //Clear tags in search
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

  if (loading) {
    return <LoadingIndicator />;
  }
  
  //Toggle for +more tag
  const toggleTagVisibility = (forumId) => {
    setShowAllTags((prevState) => ({
      ...prevState,
      [forumId]: !prevState[forumId], // Toggle only the specific card
    }));
  };
  
  // Render forum item
  const renderForumItem = ({ item }) => {
    const maxTagsToShow = 2;
    const formattedDate = item.dateCreated
      ? new Date(item.dateCreated.seconds * 1000).toLocaleDateString()
      : '';
    const isExpanded = showAllTags[item.id] || false; // Check if the current forum item's tags are expanded
  
    return (
      <View style={styles.forumContainer} key={item.id}>
        <Text style={styles.forumTitle}>{item.title}</Text>
  
        {/* Meta Information */}
        <View style={styles.metaContainer}>
          <Text style={styles.forumDate}>{formattedDate}</Text>
  
          {/* Tags */}
          <View style={styles.tagContainer}>
            {item.tags &&
              (isExpanded ? item.tags : item.tags.slice(0, maxTagsToShow)).map((tag, index) => (
                <Text key={index} style={styles.tag}>
                  {tag}
                </Text>
              ))}
  
            {/* Show more tags button */}
            {item.tags && item.tags.length > maxTagsToShow && (
              <TouchableOpacity
                onPress={() => toggleTagVisibility(item.id)} // Toggle the expanded state for this specific forum
                style={styles.moreTagsContainer}
              >
                <Text style={styles.moreTags}>
                  {isExpanded ? 'Show less' : `${item.tags.length - maxTagsToShow}`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
  
        {/* Visit Button */}
        <TouchableOpacity
          style={styles.visitButton}
          onPress={() =>
            navigation.navigate('ForumDetails', {
              forumId: item.id,
              forumTitle: item.title,
              forumAuthorId: item.authorId,
            })
          }
        >
          <Ionicons name="arrow-forward" size={18} color="white" />
          <Text style={styles.visitButtonText}>Visit</Text>
        </TouchableOpacity>
      </View>
    );
  };
  

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
                    <Text
                      style={[styles.tagOptionText, selectedTags.includes(tag) ? { color: '#fff' } : { color: '#333' }]}
                    >
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
            {filteredForums.length === 0 ? <Text></Text> : filteredForums.map((forum) => renderForumItem({ item: forum }))}
          </View>
        </View>
      </ScrollView>
  
      {/* Modal for Creating a Forum */}
      <Modal visible={isModalVisible} animationType="slide" onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Forum</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)} />
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
    padding: 24, 
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12, 
    marginBottom: 6,
  },
  textContainer: {
    flex: 1,
    marginRight: 12, 
  },
  greeting: {
    fontSize: 28, 
    fontWeight: 'bold',
  },
  subText: {
    fontSize: 15, 
    color: '#6c757d',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addForumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7129F2',
    padding: 12, 
    borderRadius: 10, 
  },
  addForumButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 16, 
  },
  
  // Search Bar and Tag Filter
searchContainer: { 
  paddingHorizontal: 10, 
  paddingBottom: 8, 
  borderBottomWidth: 1,
  borderBottomColor: '#ddd',
},
searchInput: {
  height: 44, 
  paddingHorizontal: 12, 
  marginBottom: 6,
  fontSize: 16,
  borderColor: '#ddd',
  borderWidth: 1,
  borderRadius: 12, 
  backgroundColor: '#f9f9f9', 
  color: '#333', 
},
searchActionsContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 5, 
},
searchButton: {
  flex: 1,
  backgroundColor: '#7129F2',
  paddingVertical: 12, 
  paddingHorizontal: 14,
  borderRadius: 8, 
  marginRight: 8, 
  alignItems: 'center',
},
clearButton: {
  flex: 1,
  backgroundColor: '#ECE6F0', 
  paddingVertical: 12,
  paddingHorizontal: 14,
  borderRadius: 8,
  alignItems: 'center',
},
searchButtonText: {
  color: '#fff',
  fontSize: 15, 
  fontWeight: '600',
},
clearButtonText: {
  color: '#333',
  fontSize: 15,
  fontWeight: '500',
},
forumsList: {
 marginBottom: 14,
},

// Search Tags
tagOption: {
  paddingVertical: 8, 
  paddingHorizontal: 14,
  backgroundColor: '#ECE6F0',
  borderRadius: 20, 
  marginTop: 5, 
},
selectedTagOption: {
  backgroundColor: '#7129F2',
},
tagOptionText: {
  fontSize: 14, 
  color: '#333',
  fontWeight: '500', 
},

  // Forum Card and Title Styling
  forumContainer: {
    padding: 15, 
    marginBottom: 14, 
    backgroundColor: '#f0f0f0',
    borderRadius: 12, 
  },
  forumTitle: {
    fontSize: 22, 
    fontWeight: 'bold',
    marginBottom: 5,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', 
  },
  forumDate: {
    fontSize: 13, 
    color: '#6c757d',
    marginBottom: 5,
    marginRight: 10, 
  },
  tagContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12, 
    gap: 6, 
    maxWidth: '85%', 
  },
  tag: {
    backgroundColor: '#B9A2F1',
    color: '#fff',
    paddingHorizontal: 8, 
    paddingVertical: 4,
    borderRadius: 10, 
    fontSize: 13, 
    marginHorizontal: 2,
    marginBottom: 4,
  },
  moreTagsContainer: {
    marginTop: 3, 
    alignSelf: 'flex-start',
  },
  moreTags: {
    backgroundColor: '#B9A2F1',
    color: '#fff',
    paddingHorizontal: 10, 
    paddingVertical: 4,
    borderRadius: 10, 
    fontSize: 13, 
    fontWeight: 'bold',
    marginLeft: 3,
  },
  visitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7f4dff',
    paddingVertical: 8, 
    paddingHorizontal: 12,
    borderRadius: 8, 
    alignSelf: 'flex-start',
  },
  visitButtonText: {
    color: '#fff',
    fontSize: 14, 
    marginLeft: 6,
    fontWeight: '600', 
  },
  
  // Modal Styles for Create Forum
  modalContainer: {
    flex: 1,
    padding: 24, 
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24, 
    fontWeight: 'bold',
    color: '#333', 
    marginBottom: 8,
  },
  modalInput: {
    marginBottom: 15,
    borderColor: '#ddd',
    borderWidth: 1,
    padding: 14, 
    borderRadius: 12, 
    fontSize: 16, 
    backgroundColor: '#f9f9f9', 
  },
  tagSelectionTitle: {
    fontSize: 16, 
    marginBottom: 8, 
    fontWeight: '600',
    color: '#555',
  },
  predefinedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12, 
    gap: 8, 
  },
  predefinedTag: {
    backgroundColor: '#ECE6F0',
    paddingVertical: 10,
    paddingHorizontal: 16, 
    borderRadius: 16, 
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTag: {
    backgroundColor: '#7129F2',
  },
  unselectedTag: {
    backgroundColor: '#ECE6F0',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20, 
  },
  createForumButton: {
    flex: 1,
    backgroundColor: '#7129F2',
    paddingVertical: 12, 
    paddingHorizontal: 20,
    borderRadius: 12, 
    alignItems: 'center',
    marginRight: 10,
  },
  createForumButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0', 
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc', 
  },
  cancelButtonText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '600',
  },
  
});












