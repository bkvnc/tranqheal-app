import React, { useEffect, useState } from 'react';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Camera, Upload, AlertCircle } from 'lucide-react';

interface UserData {
  organizationName: string;
  profilePicture?: string;
  backgroundPicture?: string;
}

interface AlertMessage {
  type: 'success' | 'error';
  message: string;
}

const Profile: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [backgroundPicture, setBackgroundPicture] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<AlertMessage | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'organizations', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        } else {
          console.log('No such document!');
        }
      }
    };

    fetchUserData();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'background') => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (type === 'profile') {
          setProfilePicture(base64String);
        } else {
          setBackgroundPicture(base64String);
        }
        setAlertMessage({ type: 'success', message: `${type.charAt(0).toUpperCase() + type.slice(1)} picture selected. Click "Upload" to save changes.` });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async (type: 'profile' | 'background') => {
    const user = auth.currentUser;
    if (!user) {
      setAlertMessage({ type: 'error', message: 'User not authenticated. Please log in and try again.' });
      return;
    }

    const imageData = type === 'profile' ? profilePicture : backgroundPicture;
    if (!imageData) {
      setAlertMessage({ type: 'error', message: `No ${type} picture selected. Please choose an image first.` });
      return;
    }

    setIsUploading(true);
    try {
      const userDocRef = doc(db, 'organizations', user.uid);
      await updateDoc(userDocRef, {
        [type === 'profile' ? 'profilePicture' : 'backgroundPicture']: imageData,
      });

      setUserData((prevData) => ({
        ...prevData!,
        [type === 'profile' ? 'profilePicture' : 'backgroundPicture']: imageData,
      }));

      if (type === 'profile') {
        setProfilePicture(null);
      } else {
        setBackgroundPicture(null);
      }

      setAlertMessage({ type: 'success', message: `${type.charAt(0).toUpperCase() + type.slice(1)} picture uploaded successfully! The page will refresh in 3 seconds.` });
      
      // Set a timeout to refresh the page after 3 seconds
      setTimeout(() => {
        window.location.reload();
      }, 3000);

    } catch (error) {
      console.error('Error uploading image:', error);
      setAlertMessage({ type: 'error', message: `Failed to upload ${type} picture. Please try again.` });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <div className="relative h-64">
          <img
            src={userData?.backgroundPicture || '/path/to/default/cover.png'}
            alt="profile cover"
            className="w-full h-full object-cover"
          />
          <label
            htmlFor="background"
            className="absolute bottom-4 right-4 bg-white dark:bg-gray-700 text-gray-700 dark:text-white py-2 px-4 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition duration-300 cursor-pointer"
          >
            <Camera className="inline-block mr-2" size={18} />
            <span>Change Cover</span>
            <input
              type="file"
              name="background"
              id="background"
              className="hidden"
              onChange={(e) => handleFileChange(e, 'background')}
              accept="image/*"
            />
          </label>
        </div>
        
        <div className="relative px-6 py-10">
          <div className="absolute -top-20 left-1/2 transform -translate-x-1/2">
            <div className="relative">
              <img 
                src={userData?.profilePicture || '/path/to/default/profile.png'}
                alt="profile"
                className="w-40 h-40 rounded-full border-4 border-white dark:border-gray-700 shadow-lg object-cover"
              />
              <label
                htmlFor="profile"
                className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg hover:bg-opacity-90 transition duration-300 cursor-pointer"
              >
                <Camera size={20} />
                <input
                  type="file"
                  name="profile"
                  id="profile"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'profile')}
                  accept="image/*"
                />
              </label>
            </div>
          </div>

          <div className="text-center mt-16">
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">
              {userData ? userData.organizationName : 'Loading...'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Organization</p>
          </div>

          {alertMessage && (
            <div className={`mt-4 p-4 border rounded-lg flex items-center space-x-2 ${
              alertMessage.type === 'success' 
                ? 'bg-green-100 dark:bg-green-900 border-green-400 text-green-700 dark:text-green-400' 
                : 'bg-red-100 dark:bg-red-900 border-red-400 text-red-700 dark:text-red-400'
            }`}>
              <AlertCircle className={`h-5 w-5 ${alertMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
              <span className="font-medium">{alertMessage.message}</span>
            </div>
          )}

          {(profilePicture || backgroundPicture) && (
            <div className="mt-6 text-center">
              {profilePicture && (
                <button
                  onClick={() => handleImageUpload('profile')}
                  disabled={isUploading}
                  className="bg-primary text-white px-6 py-2 rounded-full shadow-md hover:bg-opacity-90 transition duration-300 flex items-center justify-center mx-auto mb-2"
                >
                  {isUploading ? (
                    <span className="animate-spin mr-2">&#9696;</span>
                  ) : (
                    <Upload className="mr-2" size={18} />
                  )}
                  {isUploading ? 'Uploading...' : 'Upload Profile Picture'}
                </button>
              )}
              {backgroundPicture && (
                <button
                  onClick={() => handleImageUpload('background')}
                  disabled={isUploading}
                  className="bg-primary text-white px-6 py-2 rounded-full shadow-md hover:bg-opacity-90 transition duration-300 flex items-center justify-center mx-auto"
                >
                  {isUploading ? (
                    <span className="animate-spin mr-2">&#9696;</span>
                  ) : (
                    <Upload className="mr-2" size={18} />
                  )}
                  {isUploading ? 'Uploading...' : 'Upload Background Picture'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
