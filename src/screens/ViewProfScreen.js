import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image,  FlatList, RefreshControl } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Modal from 'react-native-modal';
import RNPickerSelect from 'react-native-picker-select';
import { Picker } from '@react-native-picker/picker';
import { LoadingIndicator } from '../components';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../providers';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../config';
import { filterProfessionals } from 'src/utils/filterProfessionals';


export const ViewProfScreen = ({ navigation }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedTimeAvailable, setSelectedTimeAvailable] = useState('');
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfessionals = async () => {
    try {
      const professionalsCollection = collection(firestore, 'professionals');
      const professionalSnapshot = await getDocs(professionalsCollection);
      const professionalList = professionalSnapshot.docs
        .map((doc) => {
          const data = doc.data();
          return { id: doc.id, ...data };
        })

      setProfessionals(professionalList);
    } catch (error) {
      console.error('Error fetching professionals:', error.message);
    } finally { 
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfessionals();
    setRefreshing(false);
  };

  const filteredProfessionals = professionals.filter((professional) => {
    const fullName = `${professional.firstName || ''} ${professional.middleName || ''} ${professional.lastName || ''}`.trim();

    return (
      (selectedGender ? professional.gender === selectedGender : true) &&
      (minRating > 0 ? professional.rating >= minRating : true) &&
      (selectedSpecialty ? professional.specialization?.[selectedSpecialty] === true : true) &&
      (selectedTimeAvailable ? professional.availability?.[selectedTimeAvailable.toLowerCase()] === true : true) &&
      fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }).sort((a, b) => b.rating - a.rating);

  const toggleFilterModal = () => setFilterModalVisible(!isFilterModalVisible);

  const handleApplyFilters = () => {
    toggleFilterModal();
  };

  const handleClearFilters = () => {
    setSelectedGender(null);
    setMinRating(0);
    setSelectedSpecialty('');
    setSelectedTimeAvailable('');
    setSearchQuery('');
  };

  const handleProfessionalPress = (professionalId) => {
    navigation.navigate('ProfessionalDetails', { professionalId });
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

  const renderProfessional = ({ item }) => {
    const fullName = `${item.firstName || ''} ${item.middleName || ''} ${item.lastName || ''}`.trim();
    const rating = item.rating || 0;

    return (
      <TouchableOpacity style={styles.professionalCard} onPress={() => handleProfessionalPress(item.id)}>
        <Image source={{ uri: item.profileImage }} style={styles.professionalImage} />
        <View style={styles.professionalDetails}>
          <Text style={styles.professionalName}>{fullName}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            <View style={styles.starContainer}>{renderStars(item.rating)}</View>
          </View>
        </View>
        <Ionicons name="arrow-forward-circle-outline" size={24} color="gray" style={styles.forwardIcon} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <RootLayout navigation={navigation} screenName="ViewProf" userType={userType}>
        <View style={styles.container}>
          <Text style={styles.title}>View Professionals</Text>
          <View style={styles.searchBarRow}>
            <TouchableOpacity style={styles.sliderButton} onPress={toggleFilterModal}>
              <Ionicons name="options-outline" size={24} color="white" />
            </TouchableOpacity>
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
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            data={filteredProfessionals}
            renderItem={renderProfessional}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.professionalsList}
          />
          <Modal isVisible={isFilterModalVisible} onBackdropPress={toggleFilterModal}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Filter Professionals By</Text>

              <Text style={styles.filterLabel}>Specialization</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedSpecialty}
                  onValueChange={(value) => setSelectedSpecialty(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Specialty" value="" />
                  {filterProfessionals.specializationItems.map((item) => (
                    <Picker.Item key={item.value} label={item.label} value={item.value} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.filterLabel}>Gender</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedGender}
                  onValueChange={(value) => setSelectedGender(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Gender" value="" />
                  {filterProfessionals.genderItems.map((item) => (
                    <Picker.Item key={item.value} label={item.label} value={item.value} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.filterLabel}>Minimum Rating</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={minRating}
                  onValueChange={(value) => setMinRating(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Minimum Rating" value={0} />
                  {filterProfessionals.ratingItems.map((item) => (
                    <Picker.Item key={item.value} label={item.label} value={item.value} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.filterLabel}>Available Time</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedTimeAvailable}
                  onValueChange={(value) => setSelectedTimeAvailable(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Time Available" value="" />
                  {filterProfessionals.timeItems.map((item) => (
                    <Picker.Item key={item.value} label={item.label} value={item.value} />
                  ))}
                </Picker>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={handleApplyFilters}>
                  <Text style={styles.buttonText}>Apply Filters</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.clearButton]}
                  onPress={handleClearFilters}
                >
                  <Text style={styles.buttonText}>Clear Filters</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={toggleFilterModal}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
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
  sliderButton: {
    backgroundColor: '#B9A2F1',
    padding: 10,
    borderRadius: 32,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
  professionalsList: {
    width: '100%',
  },
  professionalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginBottom: 10,
  },
  professionalImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  professionalDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  professionalName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  professionalSpecialty: {
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
  modalContent: {
    backgroundColor: '#F7F2FA',
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: 'white',
    marginBottom: 15,
  },
  picker: {
    height: 50,
    color: 'black',
  },
  
  buttonContainer: {
    flexDirection: 'column',
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#7129F2',
    padding: 10,
    borderRadius: 100,
    alignItems: 'center',
    marginVertical: 5,
    width: '80%', 
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  clearButton: {
    backgroundColor: '#7129F2',
  },
  cancelButton: {
    backgroundColor: '#7129F2',
  },
  
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30,
    backgroundColor: 'white',
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    backgroundColor: 'white',
  }
});