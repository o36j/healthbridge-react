#!/usr/bin/env python3
import os
import sys
import pymongo
from datetime import datetime
from bson import ObjectId
from dotenv import load_dotenv
import re

# Check for .env file and create if it doesn't exist
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env')
if not os.path.exists(env_path):
    print(f"Warning: .env file not found at {env_path}")
    mongo_uri = input("Please enter your MongoDB connection string: ")
    with open(env_path, 'w') as f:
        f.write(f"MONGODB_URI={mongo_uri}\n")
    print(f"Created .env file at {env_path}")

# Load environment variables from .env file
load_dotenv(env_path)

# Get MongoDB URI from environment variable
mongo_uri = os.getenv('MONGODB_URI')
if not mongo_uri:
    print("Error: MONGODB_URI environment variable not found.")
    mongo_uri = input("Please enter your MongoDB connection string: ")
    with open(env_path, 'a') as f:
        f.write(f"MONGODB_URI={mongo_uri}\n")
    print(f"Updated .env file with MongoDB URI")

# Extract database name from URI or use default
db_name = "test"
uri_db_match = re.search(r'/([^/\?]+)(\?|$)', mongo_uri)
if uri_db_match:
    db_name = uri_db_match.group(1)

# Setup MongoDB connection
try:
    client = pymongo.MongoClient(mongo_uri)
    
    # Use database from URI or default
    db = client[db_name]
    medications_collection = db.medications
    users_collection = db.users
    print(f"Connected to MongoDB database '{db_name}' successfully!")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    sys.exit(1)

# We need to find an admin user to set as createdBy
try:
    admin_user = users_collection.find_one({"role": "admin"})
    if not admin_user:
        print("No admin user found. Looking for any user...")
        any_user = users_collection.find_one({})
        if not any_user:
            print("No users found in the database.")
            create_user = input("Would you like to create a placeholder admin user? (y/n): ")
            if create_user.lower() == 'y':
                admin_id = ObjectId()
                admin_user = {
                    "_id": admin_id,
                    "email": "admin@healthbridge.com",
                    "password": "placeholder",  # This would be hashed in a real scenario
                    "firstName": "Admin",
                    "lastName": "User",
                    "role": "admin",
                    "createdAt": datetime.now(),
                    "updatedAt": datetime.now()
                }
                users_collection.insert_one(admin_user)
                print(f"Created placeholder admin user with ID: {admin_id}")
            else:
                print("Cannot proceed without a user. Exiting.")
                sys.exit(1)
        else:
            admin_id = any_user["_id"]
            print(f"Using user ID: {admin_id} as creator")
    else:
        admin_id = admin_user["_id"]
        print(f"Using admin user ID: {admin_id} as creator")
except Exception as e:
    print(f"Error finding or creating admin user: {e}")
    sys.exit(1)

# List of 20 new medications with relevant details
medications = [
    {
        "name": "Escitalopram",
        "description": "Selective serotonin reuptake inhibitor (SSRI) used to treat depression and anxiety disorders",
        "warnings": ["May cause suicidal thoughts in young adults", "Do not use with MAO inhibitors", "May cause withdrawal symptoms if stopped abruptly"],
        "sideEffects": ["Nausea", "Insomnia", "Drowsiness", "Sexual dysfunction", "Dry mouth"],
        "dosageForm": "Tablet",
        "strength": "5mg, 10mg, 20mg",
        "manufacturer": "Forest Laboratories"
    },
    {
        "name": "Rosuvastatin",
        "description": "Statin medication used to lower cholesterol levels and prevent cardiovascular disease",
        "warnings": ["May cause muscle damage", "Avoid grapefruit juice", "May affect liver function"],
        "sideEffects": ["Muscle pain", "Headache", "Nausea", "Elevated liver enzymes"],
        "dosageForm": "Tablet",
        "strength": "5mg, 10mg, 20mg, 40mg",
        "manufacturer": "AstraZeneca"
    },
    {
        "name": "Montelukast",
        "description": "Leukotriene receptor antagonist used to treat asthma and seasonal allergies",
        "warnings": ["May cause psychological reactions", "Not for acute asthma attacks", "May cause suicidal thoughts"],
        "sideEffects": ["Headache", "Nausea", "Respiratory infection", "Behavioral changes"],
        "dosageForm": "Tablet, Chewable tablet",
        "strength": "4mg, 5mg, 10mg",
        "manufacturer": "Merck"
    },
    {
        "name": "Pantoprazole",
        "description": "Proton pump inhibitor used to treat acid reflux, ulcers, and other gastric conditions",
        "warnings": ["Long-term use may increase risk of bone fractures", "May decrease magnesium levels"],
        "sideEffects": ["Headache", "Diarrhea", "Nausea", "Abdominal pain"],
        "dosageForm": "Tablet, Injection",
        "strength": "20mg, 40mg",
        "manufacturer": "Pfizer"
    },
    {
        "name": "Duloxetine",
        "description": "Serotonin-norepinephrine reuptake inhibitor (SNRI) used to treat depression, anxiety, and chronic pain",
        "warnings": ["May increase suicidal thoughts", "Do not use with MAO inhibitors", "May cause liver damage"],
        "sideEffects": ["Nausea", "Dry mouth", "Constipation", "Dizziness", "Fatigue"],
        "dosageForm": "Delayed-release capsule",
        "strength": "20mg, 30mg, 60mg",
        "manufacturer": "Eli Lilly"
    },
    {
        "name": "Venlafaxine",
        "description": "Serotonin-norepinephrine reuptake inhibitor (SNRI) used to treat depression and anxiety disorders",
        "warnings": ["May increase blood pressure", "May cause withdrawal symptoms", "May cause suicidal thoughts"],
        "sideEffects": ["Nausea", "Headache", "Dry mouth", "Dizziness", "Insomnia"],
        "dosageForm": "Extended-release capsule, Tablet",
        "strength": "37.5mg, 75mg, 150mg, 225mg",
        "manufacturer": "Wyeth"
    },
    {
        "name": "Clopidogrel",
        "description": "Antiplatelet drug used to prevent blood clots in patients with heart disease or stroke",
        "warnings": ["May increase bleeding risk", "Genetic variations may affect effectiveness", "Interactions with proton pump inhibitors"],
        "sideEffects": ["Bleeding", "Bruising", "Abdominal pain", "Headache"],
        "dosageForm": "Tablet",
        "strength": "75mg, 300mg",
        "manufacturer": "Sanofi-Aventis"
    },
    {
        "name": "Candesartan",
        "description": "Angiotensin II receptor blocker used to treat hypertension and heart failure",
        "warnings": ["May cause birth defects", "May cause kidney problems", "Avoid potassium supplements"],
        "sideEffects": ["Dizziness", "Back pain", "Upper respiratory infection", "Headache"],
        "dosageForm": "Tablet",
        "strength": "4mg, 8mg, 16mg, 32mg",
        "manufacturer": "AstraZeneca"
    },
    {
        "name": "Azithromycin",
        "description": "Macrolide antibiotic used to treat various bacterial infections",
        "warnings": ["May cause heart rhythm abnormalities", "May cause liver damage", "May interact with other medications"],
        "sideEffects": ["Nausea", "Diarrhea", "Abdominal pain", "Headache"],
        "dosageForm": "Tablet, Suspension",
        "strength": "250mg, 500mg, 600mg",
        "manufacturer": "Pfizer"
    },
    {
        "name": "Trazodone",
        "description": "Serotonin antagonist and reuptake inhibitor used to treat depression and insomnia",
        "warnings": ["May cause priapism", "May cause orthostatic hypotension", "May cause sedation"],
        "sideEffects": ["Drowsiness", "Dizziness", "Dry mouth", "Blurred vision", "Headache"],
        "dosageForm": "Tablet",
        "strength": "50mg, 100mg, 150mg, 300mg",
        "manufacturer": "Various manufacturers"
    },
    {
        "name": "Bupropion",
        "description": "Antidepressant used to treat depression and aid in smoking cessation",
        "warnings": ["May cause seizures", "May cause high blood pressure", "May cause agitation"],
        "sideEffects": ["Dry mouth", "Insomnia", "Headache", "Nausea", "Dizziness"],
        "dosageForm": "Extended-release tablet",
        "strength": "100mg, 150mg, 200mg, 300mg, 450mg",
        "manufacturer": "GlaxoSmithKline"
    },
    {
        "name": "Telmisartan",
        "description": "Angiotensin II receptor blocker used to treat hypertension and reduce cardiovascular risk",
        "warnings": ["May cause birth defects", "May cause kidney problems", "Avoid potassium supplements"],
        "sideEffects": ["Back pain", "Dizziness", "Sinus pain", "Diarrhea"],
        "dosageForm": "Tablet",
        "strength": "20mg, 40mg, 80mg",
        "manufacturer": "Boehringer Ingelheim"
    },
    {
        "name": "Methylphenidate",
        "description": "Central nervous system stimulant used to treat ADHD and narcolepsy",
        "warnings": ["May cause heart problems", "May cause psychosis", "Potential for abuse and dependence"],
        "sideEffects": ["Decreased appetite", "Insomnia", "Nervousness", "Headache", "Increased heart rate"],
        "dosageForm": "Tablet, Extended-release tablet, Capsule",
        "strength": "5mg, 10mg, 18mg, 20mg, 27mg, 36mg, 54mg",
        "manufacturer": "Novartis"
    },
    {
        "name": "Clonazepam",
        "description": "Benzodiazepine used to treat seizures, panic disorder, and anxiety",
        "warnings": ["May cause physical dependence", "May cause drowsiness", "Risk of abuse and addiction"],
        "sideEffects": ["Drowsiness", "Dizziness", "Cognitive impairment", "Depression", "Fatigue"],
        "dosageForm": "Tablet, Orally disintegrating tablet",
        "strength": "0.125mg, 0.25mg, 0.5mg, 1mg, 2mg",
        "manufacturer": "Roche"
    },
    {
        "name": "Memantine",
        "description": "NMDA receptor antagonist used to treat moderate to severe Alzheimer's disease",
        "warnings": ["May cause dizziness", "Caution in patients with kidney disease", "May interact with other CNS medications"],
        "sideEffects": ["Dizziness", "Headache", "Confusion", "Constipation", "Hypertension"],
        "dosageForm": "Tablet, Solution",
        "strength": "5mg, 10mg, 28mg",
        "manufacturer": "Forest Laboratories"
    },
    {
        "name": "Doxycycline",
        "description": "Tetracycline antibiotic used to treat various bacterial infections and certain parasite infections",
        "warnings": ["May cause photosensitivity", "Not for use in children under 8", "May decrease effectiveness of oral contraceptives"],
        "sideEffects": ["Nausea", "Diarrhea", "Sun sensitivity", "Esophageal irritation", "Headache"],
        "dosageForm": "Capsule, Tablet, Suspension",
        "strength": "50mg, 75mg, 100mg, 150mg, 200mg",
        "manufacturer": "Various manufacturers"
    },
    {
        "name": "Aripiprazole",
        "description": "Atypical antipsychotic used to treat schizophrenia, bipolar disorder, and depression",
        "warnings": ["May cause tardive dyskinesia", "May increase risk of stroke in elderly", "May cause metabolic changes"],
        "sideEffects": ["Weight gain", "Restlessness", "Dizziness", "Insomnia", "Nausea"],
        "dosageForm": "Tablet, Solution, Injection",
        "strength": "2mg, 5mg, 10mg, 15mg, 20mg, 30mg",
        "manufacturer": "Otsuka"
    },
    {
        "name": "Tamsulosin",
        "description": "Alpha-blocker used to treat symptoms of benign prostatic hyperplasia (BPH)",
        "warnings": ["May cause orthostatic hypotension", "May cause priapism", "May affect cataract surgery"],
        "sideEffects": ["Dizziness", "Headache", "Decreased ejaculation", "Nasal congestion", "Weakness"],
        "dosageForm": "Capsule",
        "strength": "0.4mg",
        "manufacturer": "Boehringer Ingelheim"
    },
    {
        "name": "Levofloxacin",
        "description": "Fluoroquinolone antibiotic used to treat bacterial infections",
        "warnings": ["May damage tendons", "May cause peripheral neuropathy", "May cause QT interval prolongation"],
        "sideEffects": ["Nausea", "Diarrhea", "Headache", "Dizziness", "Insomnia"],
        "dosageForm": "Tablet, Solution, Injection",
        "strength": "250mg, 500mg, 750mg",
        "manufacturer": "Janssen"
    },
    {
        "name": "Acyclovir",
        "description": "Antiviral medication used to treat herpes virus infections",
        "warnings": ["May cause kidney damage", "Requires adequate hydration", "May cause neurological effects"],
        "sideEffects": ["Nausea", "Headache", "Dizziness", "Diarrhea", "Fatigue"],
        "dosageForm": "Tablet, Capsule, Suspension, Cream, Injection",
        "strength": "200mg, 400mg, 800mg",
        "manufacturer": "GlaxoSmithKline"
    }
]

# Delete existing medications if they exist
try:
    # Ask for confirmation before deleting existing medications
    existing_count = medications_collection.count_documents({})
    if existing_count > 0:
        confirm = input(f"Found {existing_count} existing medications. Delete them all and add new ones? (y/n): ")
        if confirm.lower() == 'y':
            medications_collection.delete_many({})
            print(f"Deleted {existing_count} existing medications.")
        else:
            print("Will only add medications that don't already exist.")
except Exception as e:
    print(f"Error checking existing medications: {e}")

# Add timestamps and creator information to each medication
for medication in medications:
    medication["createdBy"] = admin_id
    medication["createdAt"] = datetime.now()
    medication["updatedAt"] = datetime.now()

# Insert medications into the database
try:
    # Check for existing medications to avoid duplicates
    existing_medications = set(med["name"] for med in medications_collection.find({}, {"name": 1}))
    
    # Filter out medications that already exist
    new_medications = [med for med in medications if med["name"] not in existing_medications]
    
    if not new_medications:
        print("All medications already exist in the database. No new medications were added.")
    else:
        result = medications_collection.insert_many(new_medications)
        print(f"Successfully added {len(result.inserted_ids)} medications to the database.")
        
        # Print the names of medications that were added
        for i, med_id in enumerate(result.inserted_ids):
            print(f"  {i+1}. {new_medications[i]['name']}")
except Exception as e:
    print(f"Error adding medications: {e}")
    sys.exit(1)

print("Done!") 