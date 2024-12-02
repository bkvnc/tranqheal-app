import os
import json
import random
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from heapq import nsmallest 
from pydantic import BaseModel
from firebase_admin import credentials, firestore, initialize_app
from dotenv import load_dotenv

load_dotenv()
service_account_info = json.loads(os.getenv("FIREBASE_SERVICE_ACCOUNT"))
cred = credentials.Certificate(service_account_info)
initialize_app(cred)
db = firestore.client()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enhanced normalize function with handling for missing values
def normalize_feature(value, min_value, max_value):
    if value is None:
        return 0  # Default for missing values
    return (value - min_value) / (max_value - min_value)

class UserPreferences(BaseModel):
    preferredProfAge: str 
    preferredProfGender: str  
    preferredProfAvailability: str 

class SelfAssessmentScores(BaseModel):
    gad7Interpretation: str
    phq9Interpretation: str  
    pssInterpretation: str

class AssessmentData(BaseModel):
    preferences: UserPreferences
    selfAssessmentScores: SelfAssessmentScores

class MoodRequest(BaseModel):
    mood: str

# Main matching endpoint
@app.post("/match-professionals/")
def match_professionals(assessment: AssessmentData, k: int = 5):
    professionals_ref = db.collection("professionals")
    professionals_docs = professionals_ref.stream()
    
    min_age, max_age = 18, 80  # Age range for normalization
    preferences = assessment.preferences
    scores = assessment.selfAssessmentScores
    
    # User feature vector
    user_vector = np.array([
        normalize_feature(int(preferences.preferredProfAge), min_age, max_age),
        1 if preferences.preferredProfGender.lower() == "male" else 0,
        1 if preferences.preferredProfAvailability else 0,
        1 if scores.gad7Interpretation != "Minimal or no anxiety" else 0,
        1 if scores.phq9Interpretation != "Minimal or no depression" else 0,
        1 if scores.pssInterpretation != "Low stress" else 0,
    ])
    
    # Weights for features
    feature_weights = np.array([0.4, 0.2, 0.2, 0.6, 0.6, 0.6])  # Adjust these weights as needed
    
    professional_distances = []
    for doc in professionals_docs:
        data = doc.to_dict()
        
        # Professional feature vector
        professional_vector = np.array([
            normalize_feature(int(data.get("age", min_age)), min_age, max_age),
            1 if data.get("gender", "").lower() == "male" else 0,
            1 if data.get("availability", {}).get(preferences.preferredProfAvailability, False) else 0,
            1 if data.get("specialization", {}).get("anxiety", False) else 0,
            1 if data.get("specialization", {}).get("depression", False) else 0,
            1 if data.get("specialization", {}).get("stress", False) else 0,
        ])
        
        # Compute weighted distance
        distance = np.sqrt(np.sum(((user_vector - professional_vector) * feature_weights) ** 2))
        
        professional_info = {
            "id": doc.id,
            "name": f"{data.get('firstName', '')} {data.get('lastName', '')}",
            "distance": distance,
            "rating": data.get("rating", 0),
            "profileImage": data.get("profileImage", None)
        }
        
        professional_distances.append(professional_info)
    
    # Find K nearest neighbors
    k_nearest_neighbors = nsmallest(k, professional_distances, key=lambda x: x["distance"])
    
    if not k_nearest_neighbors:
        raise HTTPException(status_code=404, detail="No professionals match the user preferences and needs.")
    
    return {"matches": k_nearest_neighbors}

@app.post("/get-mood-suggestions/")
def get_mood_suggestions(mood_request: MoodRequest):
    mood = mood_request.mood
    mood_suggestions_ref = db.collection("moodSuggestions")

    possible_suggestions = []

    for quadrant in ["redQuadrant", "blueQuadrant", "positiveQuadrant"]:
        mood_data = mood_suggestions_ref.document(quadrant).get()
        if mood_data.exists:
            data = mood_data.to_dict()

            # Check if the mood is present in the 'moods' field (individual moods)
            if mood in data.get("moods", {}):
                possible_suggestions.extend(data["moods"][mood])

            # If not in 'moods', check the 'categories' for relevant category
            for category, moods in data.get("categories", {}).items():
                if mood in moods:
                    if category in data.get("suggestions", {}):
                        possible_suggestions.extend(data["suggestions"][category])

    if not possible_suggestions:
        raise HTTPException(status_code=404, detail=f"No suggestions found for mood: {mood}")

    # Randomly select one suggestion
    selected_suggestion = random.choice(possible_suggestions)

    return {"mood": mood, "suggestion": selected_suggestion}

@app.get("/")
def read_root():
    return {"message": "TranqHeal's API is up and running"}
