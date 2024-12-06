import os
import json
import random
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from heapq import nsmallest
from pydantic import BaseModel, Field
from firebase_admin import credentials, firestore, initialize_app
from dotenv import load_dotenv

load_dotenv()
service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT")
with open(service_account_path, 'r') as file:
    service_account_info = json.load(file)
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

# Utility: Normalize feature with fallback for missing values
def normalize_feature(value, min_value, max_value):
    if value is None:
        return 0
    return (value - min_value) / (max_value - min_value)

# Calculate dynamic threshold
def calculate_dynamic_threshold(current_score, historical_avg, baseline_threshold):
    """
    Adjust the threshold based on the user's historical averages and current scores.
    """
    if current_score < historical_avg:
        # User is improving; raise the threshold slightly
        return baseline_threshold + (historical_avg - current_score) * 0.1
    elif current_score > historical_avg:
        # User is worsening; lower the threshold slightly
        return baseline_threshold - (current_score - historical_avg) * 0.1
    else:
        # Maintain the baseline
        return baseline_threshold

# Fetch self-assessment history for a user
def get_self_assessment_history(user_id: str):
    history_ref = db.collection("users").document(user_id).collection("selfAssessments")
    history_docs = history_ref.stream()

    anxiety_scores = []
    depression_scores = []
    stress_scores = []

    for doc in history_docs:
        data = doc.to_dict()
        if data.get("gad7Total"):
            anxiety_scores.append(data["gad7Total"])
        if data.get("phq9Total"):
            depression_scores.append(data["phq9Total"])
        if data.get("pssTotal"):
            stress_scores.append(data["pssTotal"])

    def calculate_average(scores):
        return sum(scores) / len(scores) if scores else 0

    return (
        calculate_average(anxiety_scores),
        calculate_average(depression_scores),
        calculate_average(stress_scores),
    )

# Models
class UserPreferences(BaseModel):
    preferredProfAge: str
    preferredProfGender: str
    preferredProfAvailability: str

class SelfAssessmentScores(BaseModel):
    gad7: int
    phq9: int
    pss: int

class AssessmentData(BaseModel):
    userId: str
    preferences: UserPreferences
    selfAssessmentScores: SelfAssessmentScores

class MoodRequest(BaseModel):
    mood: str

# Matching endpoint
@app.post("/match-professionals/")
def match_professionals(assessment: AssessmentData, k: int = 5):
    user_id = assessment.userId

    # Fetch historical averages
    history_anxiety_avg, history_depression_avg, history_stress_avg = get_self_assessment_history(user_id)

    # User's current self-assessment scores
    scores = assessment.selfAssessmentScores

    # Baseline thresholds for specialization
    baseline_thresholds = {
        "anxiety": 10,
        "depression": 12,
        "stress": 14
    }

    # Calculate dynamic thresholds
    adjusted_thresholds = {
        "anxiety": calculate_dynamic_threshold(scores.gad7, history_anxiety_avg, baseline_thresholds["anxiety"]),
        "depression": calculate_dynamic_threshold(scores.phq9, history_depression_avg, baseline_thresholds["depression"]),
        "stress": calculate_dynamic_threshold(scores.pss, history_stress_avg, baseline_thresholds["stress"])
    }

    # Calculate user specialization flags
    user_specialization_flags = np.array([
        1 if scores.gad7 >= adjusted_thresholds["anxiety"] else 0,
        1 if scores.phq9 >= adjusted_thresholds["depression"] else 0,
        1 if scores.pss >= adjusted_thresholds["stress"] else 0
    ])

    # User vector with specialization flags
    user_vector = np.array([
        normalize_feature(int(assessment.preferences.preferredProfAge), 18, 80),
        1 if assessment.preferences.preferredProfGender.lower() == "male" else 0,
        1 if assessment.preferences.preferredProfAvailability else 0,
        normalize_feature(scores.gad7, 1, 25),
        normalize_feature(scores.phq9, 1, 25),
        normalize_feature(scores.pss, 1, 25),
        *user_specialization_flags
    ])

    professionals_ref = db.collection("professionals")
    professionals_docs = professionals_ref.stream()

    # Weighting factors
    feature_weights = np.array([0.25, 0.2, 0.1, 0.4, 0.4, 0.4, 0.25, 0.25, 0.25])

    professional_distances = []
    for doc in professionals_docs:
        data = doc.to_dict()

        # Professional vector with specialization flags
        professional_vector = np.array([
            normalize_feature(int(data.get("age", 18)), 18, 80),
            1 if data.get("gender", "").lower() == "male" else 0,
            1 if data.get("availability", {}).get(assessment.preferences.preferredProfAvailability, False) else 0,
            normalize_feature(data.get("selfAssessment", {}).get("anxiety", 1), 1, 25),
            normalize_feature(data.get("selfAssessment", {}).get("depression", 1), 1, 25),
            normalize_feature(data.get("selfAssessment", {}).get("stress", 1), 1, 25),
            1 if data.get("specialization", {}).get("anxiety", False) else 0,
            1 if data.get("specialization", {}).get("depression", False) else 0,
            1 if data.get("specialization", {}).get("stress", False) else 0,
        ])

        # Calculate weighted distance
        distance = np.sqrt(np.sum(((user_vector - professional_vector) * feature_weights) ** 2))

        professional_info = {
            "id": doc.id,
            "name": f"{data.get('firstName', '')} {data.get('lastName', '')}",
            "distance": distance,
            "rating": data.get("rating", 0),
            "profileImage": data.get("profileImage", None)
        }
        professional_distances.append(professional_info)

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
