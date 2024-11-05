import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Modal from 'react-native-modal';
import RNPickerSelect from 'react-native-picker-select';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../providers';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../config';


export const ViewOrgScreen = ({ navigation }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const organizationsCollection = collection(firestore, 'organizations');
        const organizationSnapshot = await getDocs(organizationsCollection);
        const organizationList = organizationSnapshot.docs.map(doc => {
          const data = doc.data();
          return { id: doc.id, ...data, organizationName: data.organizationName, servicesOffered: data.servicesOffered || [] };
        });

        setOrganizations(organizationList);
      } catch (error) {
        console.error('Error fetching organizations:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  const filteredOrganizations = organizations.filter(org =>
    (org.organizationName || '').toLowerCase().includes(searchQuery.toLowerCase())
);

  const toggleFilterModal = () => setFilterModalVisible(!isFilterModalVisible);

  const handleOrganizationPress = (organization) => {
    navigation.navigate('OrganizationDetails', { organization });
  };

  const renderOrganization = ({ item }) => (
    <TouchableOpacity style={styles.orgCard} onPress={() => handleOrganizationPress(item)}>
      <Image source={{ uri: item.profileImage }} style={styles.orgImage} />
      <View style={styles.orgDetails}>
        <Text style={styles.orgName}>{item.organizationName}</Text>
        <Text style={styles.orgServices}>
          {(item.servicesOffered || []).join(', ')}
        </Text>
      </View>
      <Ionicons name="arrow-forward-circle-outline" size={24} color="gray" style={styles.forwardIcon} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading organizations...</Text>
      </View>
    );
  }

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
  forwardIcon: {
    marginLeft: 10,
  },
});
