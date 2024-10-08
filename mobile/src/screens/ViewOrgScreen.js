import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import Modal from 'react-native-modal';
import RNPickerSelect from 'react-native-picker-select';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../../shared/providers';

// Sample data for organizations
const organizations = [
  {
    id: '1',
    name: 'Mental Health NGO',
    services: 'Counseling, Therapy',
    rating: 4.5,
    address: '123 Elm St, Citytown',
    hoursAvailable: '9 AM - 5 PM',
    type: 'Non-Government Organization',
    image: 'https://via.placeholder.com/150',
  },
  {
    id: '2',
    name: 'Community Health Clinic',
    services: 'Mental Health Checkups, Therapy',
    rating: 4.2,
    address: '456 Oak St, Villagetown',
    hoursAvailable: '8 AM - 6 PM',
    type: 'Government Organization',
    image: 'https://via.placeholder.com/150',
  },
  // More organizations
];

export const ViewOrgScreen = () => {
  const { userType } = useContext(AuthenticatedUserContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFilterModal = () => setFilterModalVisible(!isFilterModalVisible);

  const navigation = useNavigation();

  const handleOrganizationPress = (organization) => {
    navigation.navigate('OrganizationDetails', { organization });
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={16}
          color="#FFD700"
        />
      );
    }
    return stars;
  };

  const renderOrganization = ({ item }) => (
    <TouchableOpacity style={styles.orgCard} onPress={() => handleOrganizationPress(item)}>
      <Image source={{ uri: item.image }} style={styles.orgImage} />
      <View style={styles.orgDetails}>
        <Text style={styles.orgName}>{item.name}</Text>
        <Text style={styles.orgServices}>{item.services}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          <View style={styles.starContainer}>{renderStars(item.rating)}</View>
        </View>
      </View>
      <Ionicons name="arrow-forward-circle-outline" size={24} color="gray" style={styles.forwardIcon} />
    </TouchableOpacity>
  );

  return (
    <RootLayout navigation={navigation} screenName="ViewOrg" userType={userType}>
    <View style={styles.container}>
      <Text style={styles.title}>View Organizations</Text>
      <View style={styles.searchBarRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="gray" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name"
            placeholderTextColor="gray"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      <FlatList
        data={filteredOrganizations}
        renderItem={renderOrganization}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.orgList}
      />
    </View>
    </RootLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: 'black',
  },
  orgList: {
    width: '100%',
  },
  orgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginBottom: 10,
  },
  orgImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  orgDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  orgName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  orgServices: {
    fontSize: 14,
    color: '#555',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  ratingText: {
    fontSize: 14,
    marginRight: 5,
  },
  starContainer: {
    flexDirection: 'row',
  },
  forwardIcon: {
    marginLeft: 10,
  },
});
