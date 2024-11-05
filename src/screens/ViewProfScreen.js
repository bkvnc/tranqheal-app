import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image,  FlatList } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Modal from 'react-native-modal';
import RNPickerSelect from 'react-native-picker-select';
import { RootLayout } from '../navigation/RootLayout';
import { AuthenticatedUserContext } from '../providers';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../config';

export const ViewProfScreen = ({ navigation }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [ minRating, setMinRating ] = useState(0);
  const [ selectedGender, setSelectedGender ] = useState(null);
  const [ selectedTimeAvailable, setSelectedTimeAvailable ] = useState(null);
  const [ professionals, setProfessionals ] = useState([]);
  const [ loading, setLoading ] = useState(true);

  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        const professionalsCollection = collection(firestore, 'professionals');
        const professionalSnapshot = await getDocs(professionalsCollection);
        const professionalList = professionalSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log("Fetched professional: ", data);
          return { id: doc.id, ...data, availability: data.availability };
        })
        .filter(professional => professional.status === 'Verified');

        setProfessionals(professionalList);
      } catch (error) {
        console.error('Error fetching professionals:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionals();
  }, []);

  const filteredProfessionals = professionals.filter(professional => {
    const fullName = `${professional.firstName || ''} ${professional.middleName || ''} ${professional.lastName || ''}`.trim();
  
    return (
      (selectedGender ? professional.gender === selectedGender : true) &&
      (minRating > 0 ? professional.rating >= minRating : true) && 
      (selectedTimeAvailable ? professional.availability[selectedTimeAvailable.toLowerCase()] : true) &&
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
    setSelectedTimeAvailable(null);
  };

  const handleProfessionalPress = (professional) => {
    navigation.navigate('ProfessionalDetails', { professional });
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
    const rating = item.rating !== undefined ? item.rating : 0;

    return (
      <TouchableOpacity style={styles.professionalCard} onPress={() => handleProfessionalPress(item)}>
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
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading professionals...</Text>
      </View>
    );
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
          data={filteredProfessionals}
          renderItem={renderProfessional}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.professionalsList}
      />
        {/* Filter Modal */}
        <Modal isVisible={isFilterModalVisible} onBackdropPress={toggleFilterModal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Professional By</Text>
            
              {/* Specialty Dropdown */}
              <Text style={styles.filterLabel}>Specialty</Text>
              <RNPickerSelect
                onValueChange={(value) => setSelectedSpecialty(value)}
                items={[
                  { label: 'All', value: '' },
                  { label: 'Psychiatrist', value: 'Psychiatrist' },
                  { label: 'Therapist', value: 'Therapist' },
                  { label: 'Clinical Psychologist', value: 'Clinical Psychologist' },
                  { label: 'Counselor', value: 'Counselor' },
                ]}
                placeholder={{ label: 'Select Specialty', value: null }}
                style={pickerSelectStyles}
              />

               {/* Gender Dropdown */}
               <Text style={styles.filterLabel}>Gender</Text>
              <RNPickerSelect
                onValueChange={(value) => setSelectedGender(value)}
                items={[
                  { label: 'All', value: '' },
                  { label: 'Male', value: 'Male' },
                  { label: 'Female', value: 'Female' },
                ]}
                placeholder={{ label: 'Select Gender', value: null }}
                style={pickerSelectStyles}
                value={selectedGender}
              />

                {/* Rating Dropdown */}
                <Text style={styles.filterLabel}>Minimum Rating</Text>
              <RNPickerSelect
                onValueChange={(value) => setMinRating(value)}
                items={[
                  { label: 'All', value: 0 },
                  { label: '1', value: 1 },
                  { label: '2', value: 2 },
                  { label: '3', value: 3 },
                  { label: '4', value: 4 },
                  { label: '5', value: 5 },
                ]}
                placeholder={{ label: 'Select Minimum Rating', value: 0 }}
                style={pickerSelectStyles}
                value={minRating}
              />

                  {/* Time Available Dropdown */}
                <Text style={styles.filterLabel}>Available Time</Text>
              <RNPickerSelect
                onValueChange={(value) => setSelectedTimeAvailable(value)}
                items={[
                  { label: 'All', value: null },
                  { label: 'Morning', value: 'morning' },
                  { label: 'Afternoon', value: 'afternoon' },
                  { label: 'Evening', value: 'evening' },
                ]}
                placeholder={{ label: 'Select Time Available', value: null }}
                style={pickerSelectStyles}
                value={selectedTimeAvailable}
              />
                  {/* Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={handleApplyFilters}>
                      <Text style={styles.buttonText}>Apply Filters</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={handleClearFilters}>
                      <Text style={styles.buttonText}>Clear Filters</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={toggleFilterModal}>
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
  
  buttonContainer: {
    flexDirection: 'column',
    alignItems: 'center', // Center align buttons horizontally
    justifyContent: 'center',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#7129F2',
    padding: 10,
    borderRadius: 100,
    alignItems: 'center',
    marginVertical: 5, // Space between buttons
    width: '80%', // Adjust width to fit the modal
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