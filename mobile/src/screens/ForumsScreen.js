import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, StyleSheet, Modal, Button, Dimensions, Alert, ScrollView, KeyboardAvoidingView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { RootLayout } from '../navigation/RootLayout';

// Get screen width
const { width } = Dimensions.get('window');

export const ForumsScreen = ({ navigation }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [forums, setForums] = useState([
    { id: '1', title: 'Mental Health Awareness', timeFrame: '2h ago', tags: ['Support', 'Awareness', 'Wellness', 'Motivation'] },
    { id: '2', title: 'Stress Management', timeFrame: '5h ago', tags: ['Stress', 'Self-care', 'Mental Health', 'Wellness'] },
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false); 
  const [forumTitle, setForumTitle] = useState(''); 
  const [forumContent, setForumContent] = useState(''); 
  const [tags, setTags] = useState([]);

  // Predefined tags
  const predefinedTags = ['Support', 'Awareness', 'Stress', 'Self-care', 'Motivation', 'Wellness', 'Mental Health'];

  // Handle tag selection
  const toggleTag = (tag) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  // Validation
  const createForum = () => {
    if (!forumTitle || !forumContent) {
      Alert.alert('Error', 'Please enter both a title and content for the forum.');
      return;
    }

    const newForum = {
      id: (forums.length + 1).toString(),
      title: forumTitle,
      timeFrame: 'Just now',
      tags: tags,
    };
    setForums([...forums, newForum]);
    setForumTitle('');
    setForumContent('');
    setTags([]);
    setIsModalVisible(false); 
  };

  const renderForumItem = ({ item }) => {
    const displayedTags = item.tags.slice(0, 2);
    const remainingTagsCount = item.tags.length - 2;

    return (
      <View style={styles.forumContainer}>
        <Text style={styles.forumTitle}>{item.title}</Text>
        <View style={styles.metaContainer}>
          <Text style={styles.timeFrame}>{item.timeFrame}</Text>
          <View style={styles.tagContainer}>
            {displayedTags.map((tag, index) => (
              <Text key={index} style={styles.tag}>{tag}</Text>
            ))}
            {remainingTagsCount > 0 && (
              <Text style={styles.moreTagsText}>{`+${remainingTagsCount}`}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.visitButton}
          onPress={() => navigation.navigate('ForumDetails', { forumId: item.id, forumTitle: item.title, forumTags: item.tags })}
        >
          <Ionicons name="arrow-forward" size={18} color="white" style={styles.visitIcon} />
          <Text style={styles.visitButtonText}>Visit Forum</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <RootLayout navigation={navigation} screenName="Forums">
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
            <TouchableOpacity onPress={() => setIsSearching(!isSearching)}>
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
              onChangeText={(text) => setSearchQuery(text)}
            />
          </View>
        )}

        {/* Forum List */}
        <ScrollView style={styles.forumsList}>
          {forums.map((forum) => renderForumItem({ item: forum }))}
        </ScrollView>

        {/* Modal for Adding New Forum */}
        <Modal visible={isModalVisible} animationType="slide">
          <KeyboardAvoidingView behavior="padding" style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Forum</Text>
                <TouchableOpacity style={styles.createForumButton} onPress={createForum}>
                      <Text style={styles.ForumButtonText}>Create Forum</Text>
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

            {/* Tag Selection */}
            <Text style={styles.tagSelectionTitle}>Select Tags</Text>
            <View style={styles.predefinedTagsContainer}>
              {predefinedTags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.predefinedTag,
                    tags.includes(tag) ? styles.selectedTag : styles.unselectedTag,
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={styles.tagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
              <TouchableOpacity style={styles.createForumCancelButton} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.ForumButtonText}>Cancel</Text>
              </TouchableOpacity>
          </KeyboardAvoidingView>
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#B9A2F1',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    margin: 2,
    borderRadius: 12,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
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
    marginBottom: 15,
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
  visitButton: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7f4dff',
    padding: 10,
    borderRadius: 8,
  },
  visitIcon: {
    marginRight: 5,
  },
  visitButtonText: {
    color: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  ForumButtonText: {
    color: '#fff',
    alignItems: 'center',
    marginLeft: 5,
  },
  createForumButton: {  
    backgroundColor: '#7129F2',
    padding: 10,
    borderRadius: 8,
    display: 'flex',
    marginTop: 20,
    alignItems: 'center',
    height: 40,
  },
  createForumCancelButton: {  
    backgroundColor: '#7129F2',
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
    height: 40,
    display: 'flex',
  },
});
