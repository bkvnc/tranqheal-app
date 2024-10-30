import * as functions from "firebase-functions";
import * as axios from 'axios';
import { getFirestore } from "firebase-admin/firestore"; // Import Firestore

// Initialize Firestore
const db = getFirestore();

// Define the Firebase Cloud Function to create a payment intent
export const createPaymentIntent = functions.https.onCall(async (request) => {
  const { planId } = request.data; // Expecting planId from the client

  // Validate planId
  if (!planId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing subscription plan ID."
    );
  }

  try {
    // Fetch the subscription plan details from Firestore
    const planDoc = await db.collection("subscriptionPlans").doc(planId).get();

    if (!planDoc.exists) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid subscription plan ID."
      );
    }

    const plan = planDoc.data();

    if (!plan) {
      throw new functions.https.HttpsError(
        "internal",
        "Failed to retrieve subscription plan details."
      );
    }

    const paymongoSecretKey = functions.config().paymongo.secret_key;

    const response = await axios.post(
      "https://api.paymongo.com/v1/payment_intents",
      {
        data: {
          attributes: {
            amount: plan.price, // Get price from Firestore
            currency: "PHP", // Hardcoded currency
            payment_method_allowed: ["card"],
            payment_method_options: {
              card: { request_three_d_secure: "any" },
            },
          },
        },
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(paymongoSecretKey).toString("base64")}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data; // Return the response from PayMongo
  } catch (error) {
    console.error("PayMongo API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new functions.https.HttpsError(
      "internal",
      "Unable to create payment intent",
      errorMessage
    );
  }
});
