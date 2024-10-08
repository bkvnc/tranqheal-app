import { getStorage, ref, getDownloadURL } from 'firebase/storage';

export const getDefaultProfileImage = async () => {
  const storage = getStorage();
  const defaultImageRef = ref(storage, '/defaultImages/defaultAva.png');

  try {
    const url = await getDownloadURL(defaultImageRef);
    return url;
  } catch (error) {
    console.error('Error fetching default profile image:', error);
    return null; // or handle the error as needed
  }
};
