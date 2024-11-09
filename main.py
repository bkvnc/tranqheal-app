import os
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from firebase_admin import credentials, firestore, initialize_app

service_account_info = json.loads(os.getenv("FIREBASE_SERVICE_ACCOUNT"))

cred = credentials.Certificate(service_account_info)
initialize_app(cred)

db = firestore.client()

app = FastAPI()

# Define Pydantic models for input data
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

# Main matching endpoint
@app.post("/match-professionals/")
def match_professionals(assessment: AssessmentData):
    professionals_ref = db.collection("professionals")
    professionals_docs = professionals_ref.stream()
    
    # Extract professionals' data and calculate match scores
    scored_professionals = []
    for doc in professionals_docs:
        data = doc.to_dict()
        first_name = data.get("firstName", "")
        middle_name = data.get("middleName", "").strip()
        last_name = data.get("lastName", "")
        full_name = f"{first_name} {middle_name + ' ' if middle_name else ''}{last_name}"
        profile_image = data.get("profileImage", None)
        
        professional_info = {
            "id": doc.id,
            "name": full_name if full_name.strip() else "Unknown",
            "age": data.get("age", "Unknown"),
            "availability": data.get("availability", {}),
            "gender": data.get("gender", "Unknown"),
            "specialization": data.get("specialization", {}),
            "rating": data.get("rating", 0),
            "profileImage": profile_image
        }

        # Calculate match score
        score = calculate_match_score(professional_info, assessment)

        if score > 0:  # Only consider professionals with a positive match score
            professional_info['matchScore'] = score
            scored_professionals.append(professional_info)

    # Sort professionals by match score in descending order
    scored_professionals = sorted(scored_professionals, key=lambda x: x['matchScore'], reverse=True)
    
    if not scored_professionals:
        raise HTTPException(status_code=404, detail="No professionals match the user preferences and needs.")

    return {"matches": scored_professionals}


def calculate_match_score(professional, assessment):
    score = 0
    preferences = assessment.preferences
    scores = assessment.selfAssessmentScores
    
    # Age scoring (5 points for close match, 2 points for farther match)
    preferred_age = int(preferences.preferredProfAge)
    professional_age = int(professional['age'])
    if preferred_age - 5 <= professional_age <= preferred_age + 5:
        score += 5
    elif preferred_age - 10 <= professional_age <= preferred_age + 10:
        score += 2

    # Gender scoring (3 points for exact match)
    if professional['gender'].lower() == preferences.preferredProfGender:
        score += 3

    # Availability scoring (3 points if preferred time matches)
    if professional['availability'].get(preferences.preferredProfAvailability, False):
        score += 3

    # Specialization scoring (4 points for each matching need)
    need_specializations = {
        "anxiety": scores.gad7Interpretation != "Minimal or no anxiety",
        "depress": scores.phq9Interpretation != "Minimal or no depression",
        "stress": scores.pssInterpretation != "Low stress"
    }
    for specialization, needed in need_specializations.items():
        if needed and professional['specialization'].get(specialization, False):
            score += 4

    return score

@app.get("/")
def read_root():
    return {"message": "TranqHeal's API is up and running"}
