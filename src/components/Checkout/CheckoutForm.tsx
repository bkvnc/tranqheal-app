import React, { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymongoService } from '../../service/paymongoService';
import type { Plan, UserData, Organization } from '../../hooks/types';
import type { SourceCreateParams } from '../../hooks/types';
import { isValidEmail, isContentNotEmpty, isContentLengthValid } from '../utils/validationUtils';
import {sendNotification} from '../../hooks/useNotification';
import {auth, db} from '../../config/firebase';
import { setDoc, serverTimestamp, doc, getDoc, updateDoc,query, where, collection, getDocs } from 'firebase/firestore';
import { NotificationTypes, NotificationType } from '../../hooks/notificationTypes';

interface CheckoutFormProps {
  plan: Plan;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

const CheckoutForm: FC<CheckoutFormProps> = ({ plan, onSuccess, onError }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const [organization, setOrganization ] = useState<Organization[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'gcash'>('card');
  const [formData, setFormData] = useState({
    cardNumber: '',
    expMonth: '',
    expYear: '',
    cvc: '',
    name: '',
    email: '',
    phone: '',  
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'PH'
    }
  });

  const [errors, setErrors] = useState({
    cardNumber: '',
    expMonth: '',
    expYear: '',
    cvc: '',
    name: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: ''
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      address: {
        ...prevFormData.address,
        [name]: value
      }
    }));
  };

  const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentMethod(e.target.value as 'card' | 'gcash');
  };

  const validateForm = () => {
    let valid = true;
    let newErrors = { ...errors };

    if (!isContentNotEmpty(formData.name)) {
      newErrors.name = 'Name is required.';
      valid = false;
    } else {
      newErrors.name = '';
    }

    if (!isValidEmail(formData.email)) {
      newErrors.email = 'Invalid email format.';
      valid = false;
    } else {
      newErrors.email = '';
    }

    if (!isContentLengthValid(formData.phone, 7, 15)) {
      newErrors.phone = 'Phone number should be between 7 to 15 digits.';
      valid = false;
    } else {
      newErrors.phone = '';
    }

    if (paymentMethod === 'card') {
      if (!isContentLengthValid(formData.cardNumber, 13, 19)) {
        newErrors.cardNumber = 'Card number should be between 13 to 19 digits.';
        valid = false;
      } else {
        newErrors.cardNumber = '';
      }

      if (!isContentLengthValid(formData.cvc, 3, 4)) {
        newErrors.cvc = 'CVC should be 3 or 4 digits.';
        valid = false;
      } else {
        newErrors.cvc = '';
      }

      if (!isContentLengthValid(formData.expMonth, 2, 2) || Number(formData.expMonth) < 1 || Number(formData.expMonth) > 12) {
        newErrors.expMonth = 'Enter a valid month (01-12).';
        valid = false;
      } else {
        newErrors.expMonth = '';
      }

      if (!isContentLengthValid(formData.expYear, 2, 2)) {
        newErrors.expYear = 'Enter a valid year (e.g., 23).';
        valid = false;
      } else {
        newErrors.expYear = '';
      }
    }

    setErrors(newErrors);
    return valid;
  };


  const handleCardPayment = async () => {
    
    const paymentIntent = await PaymongoService.createPaymentIntent(plan.price);
    const paymentMethodData = await PaymongoService.createPaymentMethod(
      {
        number: formData.cardNumber.replace(/\s/g, ''),
        exp_month: parseInt(formData.expMonth),
        exp_year: parseInt(formData.expYear),
        cvc: formData.cvc
      },
      {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      }
    );

    const result = await PaymongoService.attachPaymentMethod(paymentIntent.id, paymentMethodData.id);



    if (result.attributes.status === 'succeeded') {
      
      onSuccess(result.id);
      navigate('http://localhost:5173/subscription/success');
      await saveSubscription(result.id, plan);
    } else { 
      onError('Payment failed. Please try again.');
    }
  };

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


useEffect(() => {
  const fetchOrganizations = async () => {
    const user = auth.currentUser;
    if (user && userData) {
      const organizationsCollectionRef = collection(db, 'forums');
      const organizationsQuery = query(organizationsCollectionRef, where("authorName", "==", userData.organizationName));
      const organizationsSnapshot = await getDocs(organizationsQuery);
      const organizationsData = organizationsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
      } as Organization));
      setOrganization(organizationsData);
  }
};

if (userData) {
  fetchOrganizations();
}
}, [userData]);

  async function saveSubscription(paymentIntentId: string, plan: Plan) {
    const user = auth.currentUser;
    if (!user) {
      console.error("User not authenticated");
      return;
  }

  const organizationsRef = collection(db,"organizations");
  const q = query(organizationsRef, where("organizationName", "==", userData.organizationName));
  const orgDocRef = doc(db, 'organizations', user.uid);
 
  const organizationDocs = await getDocs (q);

  if (!organizationDocs.empty) {
    const orgDoc = organizationDocs.docs[0];
    const orgData = orgDoc.data()
    const organizationName  = orgData.organizationName;
    setOrganizationName(organizationName);
  }



    const subscriptionData = {
        paymentIntentId,
        userId: user.uid,
        paymentMethodId: paymentMethod,
        organizationName: userData?.organizationName,
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        startDate: serverTimestamp(),
        endDate: getExpiryDate(plan.billingCycle),
        status: 'active',
    };
  try{
      await setDoc(doc(db, 'subscriptions', user.uid), subscriptionData);
      await updateDoc(orgDocRef, { subscriptionId: user.uid, subscriptionStatus: 'Subscribed' });
      
      const message = `You are now subscribed to ${plan.name}!` as NotificationType;
      await sendNotification(user.uid, NotificationTypes.SUB_SUCCESS as NotificationType, message);
      
  }catch(error) {
    console.error("Error saving subscription data:", error);
  }
}

function getExpiryDate(durationInDays: number) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durationInDays);
    return expiryDate;
}

const handleRedirectPayment = async () => {
  if (paymentMethod === 'gcash') {
    const sourceParams: SourceCreateParams = {
      type: paymentMethod,
      amount: plan.price * 100,
      currency: 'PHP',
      redirect: {
        success: 'http://localhost:5173/subscription/success',
        failed: 'http://localhost:5173/subscription/failed'
      },
      billing: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      }
    };

    const source = await PaymongoService.createSource(sourceParams);
    if (source && source.attributes.redirect.checkout_url) {
      await saveSubscription(source.id, plan);
      window.location.href = source.attributes.redirect.checkout_url;

     

    } else {
      onError('Payment failed. Unable to create source.');
    }
  } else {
    onError('Invalid payment method selected.');
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (paymentMethod === 'card') {
        await handleCardPayment();
      } else {
        await handleRedirectPayment();
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4 bg-white rounded-lg shadow-lg p-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold dark:text-black">Payment Details</h2>
        
        <div className="space-y-2">
          {['card', 'gcash'].map(method => (
            <label key={method} >
              <input
                type="radio"
                value={method}
                checked={paymentMethod === method}
                onChange={handlePaymentMethodChange}
                className='ml-2'  
              />
              {method.charAt(0).toUpperCase() + method.slice(1)}
            </label>
          ))}

          {paymentMethod === 'gcash' && (
           
            <svg width="250pt" height="116pt" viewBox="0 0 1792 422" version="1.1" xmlns="http://www.w3.org/2000/svg">
            <path fill="#007cff" stroke="#007cff" stroke-width="0.09375" opacity="1.00" d=" M 148.8 12.6 C 173.9 4.4 200.6 1.0 227.0 2.7 C 265.7 4.8 303.5 18.5 335.0 41.0 C 338.4 43.5 342.1 45.8 345.0 49.0 C 350.0 54.7 352.0 62.8 350.2 70.2 C 348.4 78.2 342.1 85.0 334.3 87.4 C 326.7 89.8 318.0 88.2 311.9 83.1 C 288.4 65.0 259.8 53.6 230.3 50.8 C 219.5 49.6 208.5 49.6 197.7 50.8 C 166.6 53.9 136.5 66.4 112.3 86.3 C 85.0 108.6 65.1 140.0 57.3 174.4 C 50.1 205.6 52.3 239.0 63.9 268.9 C 76.1 300.7 98.8 328.2 127.4 346.6 C 148.8 360.3 173.5 368.8 198.7 371.2 C 208.5 372.4 218.5 372.4 228.2 371.3 C 258.7 368.7 288.2 357.0 312.4 338.3 C 318.5 333.5 327.2 332.1 334.6 334.6 C 344.8 338.1 352.1 349.0 350.8 359.8 C 350.2 366.1 346.9 372.1 341.9 375.9 C 322.7 390.9 300.9 402.4 277.7 409.8 C 247.8 419.4 215.6 421.9 184.5 417.6 C 150.0 412.8 116.8 399.0 89.0 378.0 C 62.0 357.8 40.0 330.9 25.5 300.4 C 11.3 270.5 4.4 237.1 5.6 204.0 C 6.7 163.3 20.2 123.1 44.0 90.0 C 69.6 54.0 106.7 26.3 148.8 12.6 Z" />
            <path fill="#001934" stroke="#001934" stroke-width="0.09375" opacity="0.40" d=" M 197.7 50.8 C 208.5 49.6 219.5 49.6 230.3 50.8 C 219.4 50.5 208.6 50.5 197.7 50.8 Z" />
            <path fill="#6fbaf7" stroke="#6fbaf7" stroke-width="0.09375" opacity="1.00" d=" M 441.4 69.4 C 451.8 66.3 464.0 71.2 469.0 81.0 C 493.0 127.9 503.5 181.5 499.2 234.0 C 496.2 271.4 485.9 308.3 468.6 341.6 C 462.3 353.5 445.4 357.3 434.5 349.5 C 424.4 343.0 421.1 328.5 427.1 318.0 C 460.5 252.4 460.8 171.1 427.8 105.3 C 424.8 99.9 423.2 93.5 424.7 87.4 C 426.4 78.9 433.1 71.7 441.4 69.4 Z" />
            <path fill="#002cb8" stroke="#002cb8" stroke-width="0.09375" opacity="1.00" d=" M 1601.8 75.8 C 1602.9 71.4 1607.3 68.1 1612.0 68.3 C 1621.0 68.3 1630.0 68.2 1639.0 68.3 C 1644.2 68.1 1649.0 72.7 1649.0 77.9 C 1649.2 104.3 1648.9 130.7 1649.1 157.0 C 1662.2 145.2 1679.2 138.4 1696.6 136.7 C 1716.3 134.7 1737.1 138.1 1753.8 149.2 C 1774.7 162.8 1786.2 187.5 1788.1 211.8 C 1788.7 235.2 1788.3 258.6 1788.4 282.0 C 1788.3 299.0 1788.6 316.1 1788.2 333.1 C 1786.9 337.4 1782.5 340.2 1778.1 340.0 C 1769.4 340.0 1760.6 340.1 1751.9 340.0 C 1747.2 340.2 1742.8 336.7 1741.8 332.2 C 1741.9 301.8 1741.8 271.4 1741.8 241.0 C 1741.8 234.9 1742.0 228.8 1741.4 222.7 C 1740.2 207.8 1734.6 192.0 1722.0 182.9 C 1711.8 175.3 1698.2 173.6 1685.9 175.7 C 1676.3 177.4 1667.3 182.5 1661.1 190.1 C 1652.5 200.7 1649.2 214.6 1649.1 228.0 C 1649.0 262.0 1649.1 296.1 1649.0 330.1 C 1649.1 335.1 1644.9 339.6 1639.9 339.9 C 1632.9 340.2 1626.0 339.9 1619.0 340.0 C 1615.7 340.0 1612.5 340.2 1609.3 339.7 C 1605.6 338.9 1602.6 335.8 1601.8 332.2 C 1601.8 246.7 1601.8 161.3 1601.8 75.8 Z" />
            <path fill="#000b31" stroke="#000b31" stroke-width="0.09375" opacity="0.52" d=" M 1601.2 79.9 C 1601.3 78.6 1601.5 77.2 1601.8 75.8 C 1601.8 161.3 1601.8 246.7 1601.8 332.2 C 1600.9 327.8 1601.3 323.4 1601.3 319.0 C 1601.2 239.3 1601.4 159.6 1601.2 79.9 Z" />
            <path fill="#002cb8" stroke="#002cb8" stroke-width="0.09375" opacity="1.00" d=" M 145.6 97.5 C 188.0 71.9 245.3 72.6 286.5 100.5 C 296.7 108.0 298.8 124.0 290.9 133.9 C 283.8 143.6 269.1 146.5 259.0 140.0 C 243.0 129.8 223.6 125.4 204.8 127.6 C 186.0 129.6 168.0 138.3 154.8 151.8 C 141.6 164.9 133.0 182.5 130.9 201.0 C 129.0 216.0 131.5 231.5 137.7 245.3 C 145.9 263.5 160.8 278.6 179.0 287.0 C 197.6 295.8 219.4 297.2 239.0 291.1 C 265.2 283.1 286.9 261.4 294.4 235.1 C 275.6 235.2 256.8 235.1 238.0 235.1 C 229.0 235.1 220.3 229.5 216.6 221.4 C 212.0 212.1 214.4 200.0 222.2 193.2 C 226.2 189.6 231.5 187.2 236.9 187.0 C 265.3 186.8 293.6 186.9 322.0 186.9 C 331.3 186.6 340.3 192.4 344.0 200.9 C 347.2 207.5 346.2 215.0 345.8 222.1 C 343.3 252.9 329.4 282.6 307.4 304.4 C 286.3 325.6 257.8 339.3 228.0 342.3 C 198.7 345.5 168.4 338.4 143.5 322.5 C 118.4 306.6 98.8 281.9 89.2 253.7 C 79.4 225.2 79.9 193.3 90.1 165.0 C 100.1 137.0 120.1 112.8 145.6 97.5 Z" />
            <path fill="#002cb8" stroke="#002cb8" stroke-width="0.09375" opacity="1.00" d=" M 722.8 80.5 C 743.4 78.2 764.6 79.9 784.2 86.7 C 807.6 94.8 828.8 109.5 843.6 129.4 C 846.8 133.1 848.3 138.6 846.1 143.2 C 843.5 149.2 836.6 151.1 831.5 154.5 C 825.7 157.4 820.1 163.0 813.0 161.3 C 807.5 160.6 804.8 155.3 801.4 151.5 C 788.3 137.0 769.5 128.2 750.1 126.2 C 734.7 124.7 718.8 126.4 704.4 132.4 C 687.5 139.5 673.4 152.6 664.6 168.6 C 655.9 184.5 653.1 203.1 654.8 221.0 C 656.0 235.2 660.8 249.2 669.1 260.9 C 680.5 277.0 697.5 289.1 716.7 294.2 C 730.3 297.6 744.8 298.8 758.6 295.3 C 776.1 291.1 792.8 282.4 805.2 269.1 C 814.0 259.7 820.0 247.7 822.5 235.1 C 822.6 234.6 822.8 233.5 822.9 233.0 C 798.5 233.1 774.1 233.0 749.8 233.1 C 744.5 232.1 739.9 227.5 739.6 222.0 C 739.3 217.0 739.6 212.0 739.5 207.0 C 739.5 203.4 739.1 199.4 741.2 196.2 C 743.6 192.1 748.3 189.9 752.9 190.2 C 786.3 190.2 819.7 190.2 853.1 190.2 C 862.0 189.9 869.9 198.1 869.2 207.0 C 868.8 219.6 869.1 232.5 866.0 244.8 C 862.3 260.5 856.0 275.6 847.0 289.0 C 839.5 300.3 829.4 309.6 818.3 317.3 C 803.8 327.2 787.6 334.5 770.6 338.7 C 747.8 344.5 723.6 343.1 701.0 337.0 C 669.9 328.5 642.8 307.4 625.9 280.1 C 607.7 250.9 603.2 214.5 610.2 181.2 C 617.0 148.4 638.1 119.4 665.8 100.8 C 682.7 89.5 702.5 82.7 722.8 80.5 Z" />
            <path fill="#002cb8" stroke="#002cb8" stroke-width="0.09375" opacity="1.00" d=" M 1014.3 80.2 C 1032.5 78.5 1051.2 79.8 1068.7 85.3 C 1095.3 93.5 1119.6 110.6 1135.0 134.0 C 1138.0 138.4 1136.6 145.2 1131.9 147.9 C 1125.3 151.9 1118.4 155.7 1111.7 159.7 C 1108.7 161.4 1105.6 163.6 1102.0 163.1 C 1098.6 163.0 1095.9 160.6 1094.1 157.9 C 1083.5 142.1 1066.2 131.4 1047.8 127.5 C 1032.8 124.5 1017.0 125.2 1002.3 129.3 C 986.0 133.9 971.5 144.0 961.4 157.4 C 951.7 169.9 946.2 185.3 944.9 201.0 C 943.2 218.9 945.8 237.6 954.4 253.6 C 962.7 269.1 976.0 281.9 992.1 288.9 C 1007.1 295.5 1023.9 297.2 1040.0 295.6 C 1059.5 293.5 1078.4 284.1 1090.8 268.8 C 1093.2 265.9 1094.8 262.2 1098.0 260.1 C 1101.2 258.1 1105.5 258.4 1108.7 260.4 C 1116.3 264.8 1124.0 269.1 1131.6 273.5 C 1135.5 275.6 1137.5 280.6 1136.3 284.9 C 1135.1 288.2 1132.7 290.9 1130.7 293.7 C 1107.4 324.7 1068.6 342.8 1030.0 342.3 C 999.9 342.8 969.2 333.5 945.7 314.3 C 932.0 303.2 920.4 289.5 912.1 273.9 C 903.4 257.6 898.7 239.4 897.6 220.9 C 896.3 201.0 898.7 180.6 905.8 161.8 C 916.2 134.6 936.5 111.3 961.7 96.7 C 977.7 87.4 995.9 82.0 1014.3 80.2 Z" />
            <path fill="#6fbaf7" stroke="#6fbaf7" stroke-width="0.09375" opacity="1.00" d=" M 376.4 110.6 C 386.7 107.9 398.4 113.2 403.2 122.7 C 429.2 177.7 429.2 244.3 403.2 299.3 C 399.9 305.8 393.3 310.6 386.0 311.8 C 377.5 313.3 368.4 309.7 363.1 302.9 C 357.6 295.8 356.6 285.6 360.6 277.6 C 380.0 235.5 379.7 185.0 360.1 143.0 C 354.2 130.1 362.6 113.6 376.4 110.6 Z" />
            <path fill="#002cb8" stroke="#002cb8" stroke-width="0.09375" opacity="1.00" d=" M 1235.6 134.8 C 1254.5 131.0 1274.9 132.1 1292.3 140.8 C 1305.3 147.2 1316.3 158.3 1321.0 172.2 C 1321.6 163.2 1320.9 154.1 1321.3 145.0 C 1321.4 140.1 1326.1 136.0 1331.0 136.0 C 1340.4 135.9 1349.7 135.9 1359.1 136.0 C 1364.4 135.9 1369.1 140.6 1368.9 146.0 C 1368.9 205.3 1368.9 264.6 1368.9 324.0 C 1368.9 326.6 1369.0 329.3 1368.7 332.0 C 1368.0 336.6 1363.6 340.0 1359.0 340.0 C 1351.3 340.1 1343.7 339.9 1336.0 340.0 C 1333.4 340.0 1330.8 340.2 1328.4 339.6 C 1324.5 338.5 1321.5 335.0 1321.3 331.0 C 1321.0 324.9 1321.4 318.8 1321.1 312.8 C 1315.9 317.4 1311.1 322.4 1305.4 326.4 C 1291.2 337.0 1273.7 343.2 1256.0 343.2 C 1236.5 343.4 1217.0 337.3 1201.3 325.7 C 1186.0 314.6 1174.5 298.7 1167.7 281.2 C 1159.5 260.3 1157.8 237.2 1161.5 215.2 C 1165.0 194.7 1174.3 174.9 1189.0 160.0 C 1201.6 147.2 1218.1 138.4 1235.6 134.8 M 1255.4 175.5 C 1241.1 177.6 1228.0 185.9 1219.9 197.9 C 1205.1 219.4 1204.5 249.3 1217.0 272.0 C 1223.8 284.8 1235.6 295.3 1249.8 299.1 C 1267.9 304.3 1288.6 299.3 1302.2 286.2 C 1314.1 275.2 1320.2 259.0 1321.0 243.0 C 1322.2 224.5 1317.2 204.6 1303.8 191.2 C 1291.5 178.4 1272.8 172.7 1255.4 175.5 Z" />
            <path fill="#002cb8" stroke="#002cb8" stroke-width="0.09375" opacity="1.00" d=" M 1472.3 133.3 C 1493.3 131.4 1515.5 134.1 1533.6 145.5 C 1549.8 155.5 1560.5 173.2 1562.8 192.0 C 1563.4 197.5 1558.6 202.9 1553.1 202.7 C 1544.4 202.8 1535.6 202.7 1527.0 202.8 C 1524.0 202.9 1520.8 202.5 1518.6 200.4 C 1515.5 197.9 1515.3 193.7 1513.7 190.3 C 1510.7 183.3 1504.3 178.2 1497.1 175.9 C 1489.5 173.5 1481.4 173.4 1473.6 174.4 C 1467.2 175.3 1460.6 177.3 1456.2 182.3 C 1451.4 187.6 1451.2 196.6 1455.9 202.0 C 1460.8 207.7 1468.1 210.5 1475.0 213.0 C 1494.7 219.6 1515.5 223.1 1534.1 232.8 C 1544.9 238.4 1554.9 246.6 1560.4 257.6 C 1569.1 274.9 1567.6 296.7 1556.6 312.6 C 1547.3 326.4 1532.2 335.1 1516.4 339.4 C 1497.1 344.6 1476.3 344.5 1457.1 339.1 C 1442.4 334.9 1428.5 327.1 1418.2 315.8 C 1410.1 307.0 1404.3 295.9 1402.4 284.0 C 1401.4 278.4 1406.3 272.8 1412.0 272.8 C 1421.7 272.7 1431.4 272.8 1441.0 272.8 C 1445.6 272.6 1449.9 275.7 1451.1 280.1 C 1452.6 285.2 1455.6 289.9 1459.7 293.3 C 1468.0 300.3 1479.3 302.8 1490.0 302.1 C 1498.3 301.7 1507.0 300.0 1513.5 294.5 C 1519.1 289.8 1521.2 281.0 1517.2 274.7 C 1513.7 269.4 1507.5 266.6 1501.7 264.2 C 1484.9 257.9 1467.1 255.0 1450.3 248.7 C 1438.0 244.2 1425.8 238.0 1417.0 228.0 C 1404.2 213.6 1401.5 191.9 1408.2 174.2 C 1413.8 159.6 1426.1 148.5 1440.0 142.0 C 1450.1 137.1 1461.2 134.4 1472.3 133.3 Z" />
            <path fill="#001966" stroke="#001966" stroke-width="0.09375" opacity="0.75" d=" M 1788.1 211.8 C 1789.5 220.8 1788.5 229.9 1788.8 239.0 C 1788.8 266.7 1788.8 294.3 1788.8 322.0 C 1788.8 325.7 1789.2 329.5 1788.2 333.1 C 1788.6 316.1 1788.3 299.0 1788.4 282.0 C 1788.3 258.6 1788.7 235.2 1788.1 211.8 Z" />
            <path fill="#000a2b" stroke="#000a2b" stroke-width="0.09375" opacity="0.48" d=" M 1741.4 222.7 C 1742.0 228.8 1741.8 234.9 1741.8 241.0 C 1741.8 271.4 1741.9 301.8 1741.8 332.2 C 1740.8 327.2 1741.4 322.1 1741.3 317.0 C 1741.3 285.6 1741.2 254.2 1741.4 222.7 Z" />
            <path fill="#00030e" stroke="#00030e" stroke-width="0.09375" opacity="0.27" d=" M 749.8 233.1 C 774.1 233.0 798.5 233.1 822.9 233.0 C 822.8 233.5 822.6 234.6 822.5 235.1 C 820.5 234.0 818.2 233.6 816.0 233.6 C 795.7 233.8 775.3 233.5 755.0 233.8 C 753.2 233.8 751.5 233.4 749.8 233.1 Z" />
            <path fill="#001e3e" stroke="#001e3e" stroke-width="0.09375" opacity="0.46" d=" M 198.7 371.2 C 208.6 371.4 218.4 371.4 228.2 371.3 C 218.5 372.4 208.5 372.4 198.7 371.2 Z" />
            </svg>
        
          )}
         
        </div>

        

        {paymentMethod === 'card' && (
          <div className="space-y-2">
            <input
              type="text"
              name="cardNumber"
              placeholder="Card Number"
              value={formData.cardNumber}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                name="expMonth"
                placeholder="MM"
                value={formData.expMonth}
                onChange={handleInputChange}
                className="p-2 border rounded"
                required
              />
              <input
                type="text"
                name="expYear"
                placeholder="YY"
                value={formData.expYear}
                onChange={handleInputChange}
                className="p-2 border rounded"
                required
              />
              <input
                type="text"
                name="cvc"
                placeholder="CVC"
                value={formData.cvc}
                onChange={handleInputChange}
                className="p-2 border rounded"
                required
              />
            </div>
            
          </div>

          
        )}

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Billing Information</h3>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
          
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-[#9F4FDD] hover:text-white py-2 px-4 rounded-lg hover:bg-[#9F4FDD] transition-colors disabled:bg-blue-300"
      >
        {loading ? 'Processing...' : `Pay ₱${plan.price.toLocaleString()}`}
      </button>
    </form>
  );
};

export default CheckoutForm;
