#!/usr/bin/env python3
import os
import sys
import pymongo
from datetime import datetime, timedelta
from bson import ObjectId
from dotenv import load_dotenv
import re
import random

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
    appointments_collection = db.appointments
    patient_history_collection = db.patienthistories
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

# Get completed appointments to use as a basis for patient records
try:
    completed_appointments = list(appointments_collection.find({"status": "completed"}))
    completed_count = len(completed_appointments)
    if completed_count == 0:
        print("No completed appointments found in the database. Cannot create patient records.")
        create_dummy = input("Would you like to use all appointments instead? (y/n): ")
        if create_dummy.lower() == 'y':
            completed_appointments = list(appointments_collection.find({}))
            completed_count = len(completed_appointments)
            if completed_count == 0:
                print("No appointments found. Cannot proceed.")
                sys.exit(1)
            print(f"Using {completed_count} appointments as a basis for patient records.")
        else:
            print("Cannot proceed without completed appointments. Exiting.")
            sys.exit(1)
    else:
        print(f"Found {completed_count} completed appointments to use as a basis for patient records.")
except Exception as e:
    print(f"Error finding completed appointments: {e}")
    sys.exit(1)

# Get all medications
try:
    medications = list(medications_collection.find({}))
    medication_count = len(medications)
    if medication_count == 0:
        print("No medications found in the database.")
        create_medications = input("Would you like to create some dummy medications? (y/n): ")
        if create_medications.lower() == 'y':
            # Create dummy medications
            dummy_medications = [
                {
                    "name": "Acetaminophen",
                    "description": "Pain reliever and fever reducer",
                    "warnings": ["May cause liver damage in high doses", "Avoid alcohol consumption"],
                    "sideEffects": ["Nausea", "Stomach pain", "Headache"],
                    "dosageForm": "Tablet",
                    "strength": "500mg",
                    "manufacturer": "Various",
                    "createdBy": admin_id,
                    "createdAt": datetime.now(),
                    "updatedAt": datetime.now()
                },
                {
                    "name": "Amoxicillin",
                    "description": "Penicillin antibiotic used to treat bacterial infections",
                    "warnings": ["May cause allergic reactions", "Take full course as prescribed"],
                    "sideEffects": ["Diarrhea", "Rash", "Nausea"],
                    "dosageForm": "Capsule",
                    "strength": "250mg, 500mg",
                    "manufacturer": "Various",
                    "createdBy": admin_id,
                    "createdAt": datetime.now(),
                    "updatedAt": datetime.now()
                },
                {
                    "name": "Lisinopril",
                    "description": "ACE inhibitor used to treat high blood pressure and heart failure",
                    "warnings": ["May cause dizziness", "Avoid pregnancy", "Monitor kidney function"],
                    "sideEffects": ["Dry cough", "Dizziness", "Headache"],
                    "dosageForm": "Tablet",
                    "strength": "5mg, 10mg, 20mg",
                    "manufacturer": "Various",
                    "createdBy": admin_id,
                    "createdAt": datetime.now(),
                    "updatedAt": datetime.now()
                },
                {
                    "name": "Metformin",
                    "description": "Oral diabetes medicine to control blood sugar levels",
                    "warnings": ["May cause lactic acidosis", "Avoid with kidney disease"],
                    "sideEffects": ["Diarrhea", "Nausea", "Stomach pain"],
                    "dosageForm": "Tablet",
                    "strength": "500mg, 850mg, 1000mg",
                    "manufacturer": "Various",
                    "createdBy": admin_id,
                    "createdAt": datetime.now(),
                    "updatedAt": datetime.now()
                },
                {
                    "name": "Atorvastatin",
                    "description": "Statin medication used to lower blood cholesterol",
                    "warnings": ["May cause muscle pain", "Avoid grapefruit juice"],
                    "sideEffects": ["Muscle pain", "Joint pain", "Digestive issues"],
                    "dosageForm": "Tablet",
                    "strength": "10mg, 20mg, 40mg, 80mg",
                    "manufacturer": "Various",
                    "createdBy": admin_id,
                    "createdAt": datetime.now(),
                    "updatedAt": datetime.now()
                }
            ]
            
            medications_collection.insert_many(dummy_medications)
            medications = dummy_medications
            medication_count = len(medications)
            print(f"Created {medication_count} dummy medications.")
        else:
            print("Will attempt to create patient records without medications.")
    else:
        print(f"Found {medication_count} medications in the database.")
except Exception as e:
    print(f"Error finding medications: {e}")
    sys.exit(1)

# Common diagnoses by specialty
diagnoses_by_specialty = {
    "Family Medicine": [
        "Upper respiratory infection", "Hypertension", "Type 2 diabetes", 
        "Gastroenteritis", "Anxiety disorder", "Urinary tract infection", 
        "Allergic rhinitis", "Osteoarthritis", "Hyperlipidemia", "Sinusitis"
    ],
    "Internal Medicine": [
        "Hypertension", "Type 2 diabetes", "Chronic obstructive pulmonary disease", 
        "Congestive heart failure", "Hypothyroidism", "Pneumonia", 
        "Acute kidney injury", "Anemia", "Atrial fibrillation", "Chronic kidney disease"
    ],
    "Pediatrics": [
        "Acute otitis media", "Upper respiratory infection", "Pharyngitis", 
        "Asthma exacerbation", "Viral gastroenteritis", "Bronchiolitis", 
        "Eczema", "Attention deficit hyperactivity disorder", "Growth delay", "Allergic rhinitis"
    ],
    "Cardiology": [
        "Coronary artery disease", "Heart failure with reduced ejection fraction", 
        "Atrial fibrillation", "Ventricular tachycardia", "Hypertension", 
        "Aortic stenosis", "Mitral valve regurgitation", "Pericarditis", 
        "Cardiomyopathy", "Hyperlipidemia"
    ],
    "Orthopedics": [
        "Osteoarthritis", "Rotator cuff tear", "Anterior cruciate ligament tear", 
        "Lumbar disc herniation", "Carpal tunnel syndrome", "Plantar fasciitis", 
        "Osteoporosis", "Tennis elbow", "Meniscus tear", "Fracture follow-up"
    ],
    "Dermatology": [
        "Acne vulgaris", "Atopic dermatitis", "Psoriasis", "Seborrheic dermatitis", 
        "Basal cell carcinoma", "Rosacea", "Contact dermatitis", "Urticaria", 
        "Tinea pedis", "Alopecia areata"
    ],
    "Neurology": [
        "Migraine", "Epilepsy", "Multiple sclerosis", "Parkinson's disease", 
        "Myasthenia gravis", "Stroke follow-up", "Peripheral neuropathy", 
        "Essential tremor", "Alzheimer's disease", "Tension headache"
    ],
    "Psychiatry": [
        "Major depressive disorder", "Generalized anxiety disorder", "Bipolar disorder", 
        "Post-traumatic stress disorder", "Attention deficit hyperactivity disorder", 
        "Schizophrenia", "Obsessive-compulsive disorder", "Panic disorder", 
        "Substance use disorder", "Insomnia"
    ],
    # Default diagnoses for other specialties
    "default": [
        "Routine follow-up", "Preventive health check", "Management of chronic condition", 
        "Medication review", "Post-procedure check", "Ongoing care for multiple issues", 
        "Health maintenance", "Consultation for new symptoms", "Second opinion", 
        "Pre-surgical evaluation"
    ]
}

# Common symptoms by diagnosis
symptoms_by_diagnosis = {
    "Upper respiratory infection": ["Cough", "Nasal congestion", "Sore throat", "Fever", "Headache"],
    "Hypertension": ["Headache", "Dizziness", "Shortness of breath", "Visual changes", "Chest pain"],
    "Type 2 diabetes": ["Increased thirst", "Frequent urination", "Fatigue", "Blurred vision", "Slow-healing wounds"],
    "Gastroenteritis": ["Diarrhea", "Nausea", "Vomiting", "Abdominal pain", "Fever"],
    "Anxiety disorder": ["Restlessness", "Fatigue", "Difficulty concentrating", "Irritability", "Sleep disturbance"],
    "Urinary tract infection": ["Painful urination", "Frequency", "Urgency", "Lower abdominal pain", "Cloudy urine"],
    "Allergic rhinitis": ["Sneezing", "Itchy nose", "Runny nose", "Nasal congestion", "Watery eyes"],
    "Osteoarthritis": ["Joint pain", "Joint stiffness", "Reduced range of motion", "Swelling", "Crepitus"],
    "Hyperlipidemia": ["Generally asymptomatic", "Family history of cardiovascular disease"],
    "Sinusitis": ["Facial pain", "Nasal congestion", "Headache", "Post-nasal drip", "Reduced smell"],
    # Default symptoms for other diagnoses
    "default": ["Fatigue", "Pain", "Discomfort", "Mobility issues", "Reported symptoms during evaluation"]
}

# Generate common vital signs with some variance
def generate_vitals():
    # Generate slightly different vital signs
    blood_pressure_sys = random.randint(110, 150)
    blood_pressure_dia = random.randint(65, 95)
    heart_rate = random.randint(60, 100)
    respiratory_rate = random.randint(12, 20)
    temperature = round(random.uniform(36.5, 37.5), 1)  # In Celsius
    height = round(random.uniform(150, 190), 1)  # In cm
    weight = round(random.uniform(50, 100), 1)  # In kg
    oxygen_saturation = random.randint(95, 100)
    
    vitals = {
        "bloodPressure": f"{blood_pressure_sys}/{blood_pressure_dia}",
        "heartRate": heart_rate,
        "respiratoryRate": respiratory_rate,
        "temperature": temperature,
        "height": height,
        "weight": weight,
        "oxygenSaturation": oxygen_saturation
    }
    
    return vitals

# Generate realistic prescriptions based on diagnosis
def generate_prescriptions(diagnosis, medications):
    if not medications:
        return []
    
    # Number of prescriptions to generate (1-3)
    num_prescriptions = random.randint(1, 3)
    
    # Select random medications
    selected_medications = random.sample(medications, min(num_prescriptions, len(medications)))
    
    prescriptions = []
    for med in selected_medications:
        # Parse strength to get available dosages
        if "strength" in med and med["strength"]:
            strengths = med["strength"].replace(" ", "").split(",")
            dosage = random.choice(strengths) if strengths else "Standard dose"
        else:
            dosage = "Standard dose"
        
        # Generate random frequency
        frequencies = ["Once daily", "Twice daily", "Three times daily", "Four times daily", 
                      "Every morning", "Every evening", "Every 12 hours", "Every 8 hours",
                      "As needed", "With meals"]
        frequency = random.choice(frequencies)
        
        # Generate random duration
        durations = ["7 days", "10 days", "14 days", "30 days", "3 months", "6 months", 
                    "Indefinitely", "Until next appointment", "As directed"]
        duration = random.choice(durations)
        
        # Notes on how to take the medication
        notes_options = [
            f"Take {frequency.lower()} with food",
            f"Take {frequency.lower()} on an empty stomach",
            f"Take {frequency.lower()} with plenty of water",
            f"Avoid alcohol while taking this medication",
            f"May cause drowsiness",
            f"Do not drive or operate machinery until you know how this medication affects you",
            None  # Sometimes no notes
        ]
        notes = random.choice(notes_options)
        
        # Create prescription
        prescription = {
            "medicationId": med["_id"] if "_id" in med else None,
            "medication": med["name"],
            "dosage": dosage,
            "frequency": frequency,
            "duration": duration,
            "showWarningsToPatient": random.choice([True, False])
        }
        
        # Add optional fields if they exist
        if notes:
            prescription["notes"] = notes
            
        if "warnings" in med and med["warnings"]:
            prescription["warnings"] = med["warnings"]
            
        if "sideEffects" in med and med["sideEffects"]:
            prescription["sideEffects"] = med["sideEffects"]
            
        prescriptions.append(prescription)
    
    return prescriptions

# Generate patient notes based on diagnosis
def generate_notes(diagnosis, symptoms):
    note_templates = [
        f"Patient presents with {', '.join(symptoms[:2])}. After examination, diagnosed with {diagnosis}. {random.choice(['Treatment plan discussed.', 'Patient education provided.', 'Follow-up recommended.'])}",
        f"Evaluation for {diagnosis}. Patient reports {', '.join(symptoms[:3])}. {random.choice(['Responding well to current treatment.', 'New treatment approach discussed.', 'Monitoring for improvement.'])}",
        f"Follow-up for {diagnosis}. Patient continues to experience {random.choice(symptoms)}. {random.choice(['Adjusted treatment regimen.', 'Continuing current treatment plan.', 'Additional testing ordered.'])}",
        f"{diagnosis} confirmed. Symptoms include {', '.join(symptoms[:3])}. {random.choice(['Patient advised on self-care measures.', 'Reviewed medication adherence.', 'Discussed lifestyle modifications.'])}",
        f"Assessment for {diagnosis}. Patient experiencing {', '.join(symptoms[:2])} for {random.choice(['several days', 'about a week', 'approximately two weeks', 'over a month'])}. {random.choice(['Treatment initiated.', 'Medication prescribed.', 'Referral provided.'])}"
    ]
    
    return random.choice(note_templates)

# Generate follow-up date
def generate_followup_date(visit_date):
    # 70% chance of having a follow-up date
    if random.random() < 0.7:
        # Follow-up in 1-6 months
        months = random.randint(1, 6)
        followup_date = visit_date + timedelta(days=30 * months)
        return followup_date
    else:
        return None

# Generate patient records
def generate_patient_records(completed_appointments, medications, process_all=False):
    patient_records = []
    appointment_count = len(completed_appointments)
    
    # Ask how many records to create if not processing all
    if not process_all:
        try:
            num_to_process = int(input(f"Found {appointment_count} appointments. How many would you like to create records for? (recommended: 10-50, max: {appointment_count}): ") or "25")
            num_to_process = min(num_to_process, appointment_count)
        except ValueError:
            print(f"Invalid input. Defaulting to 25 records (or all available if less).")
            num_to_process = min(25, appointment_count)
    else:
        num_to_process = appointment_count
    
    # Get random sample of appointments if not processing all
    if not process_all and num_to_process < appointment_count:
        appointments_to_process = random.sample(completed_appointments, num_to_process)
    else:
        appointments_to_process = completed_appointments
    
    print(f"Generating {len(appointments_to_process)} patient records...")
    
    for appointment in appointments_to_process:
        try:
            # Get patient and doctor details
            patient_id = appointment["patient"]
            doctor_id = appointment["doctor"]
            
            # Get doctor's specialty to determine diagnosis
            doctor = users_collection.find_one({"_id": doctor_id})
            specialty = doctor.get("specialization", "default") if doctor else "default"
            department = doctor.get("department", "default") if doctor else "default"
            
            # Choose appropriate diagnoses based on specialty
            diagnoses = diagnoses_by_specialty.get(specialty, diagnoses_by_specialty.get(department, diagnoses_by_specialty["default"]))
            
            # Select a random diagnosis
            diagnosis = random.choice(diagnoses)
            
            # Get symptoms based on diagnosis
            symptoms = symptoms_by_diagnosis.get(diagnosis, symptoms_by_diagnosis["default"])
            # Shuffle and select 2-5 symptoms
            random.shuffle(symptoms)
            selected_symptoms = symptoms[:random.randint(2, min(5, len(symptoms)))]
            
            # Use appointment date as visit date
            visit_date = appointment["date"]
            
            # Generate vitals
            vitals = generate_vitals()
            
            # Generate detailed notes
            notes = generate_notes(diagnosis, selected_symptoms)
            
            # Generate prescriptions
            prescriptions = generate_prescriptions(diagnosis, medications)
            
            # Generate follow-up date
            followup_date = generate_followup_date(visit_date)
            
            # Create patient record
            patient_record = {
                "patient": patient_id,
                "doctor": doctor_id,
                "visitDate": visit_date,
                "diagnosis": diagnosis,
                "symptoms": selected_symptoms,
                "notes": notes,
                "vitals": vitals,
                "prescriptions": prescriptions,
                "createdBy": admin_id,
                "createdAt": appointment.get("createdAt", datetime.now()),
                "updatedAt": appointment.get("updatedAt", datetime.now())
            }
            
            # Add follow-up date if it exists
            if followup_date:
                patient_record["followUpDate"] = followup_date
                
            patient_records.append(patient_record)
            
        except Exception as e:
            print(f"Error generating record for appointment: {e}")
            continue
    
    return patient_records

# Check for existing patient history records
try:
    existing_count = patient_history_collection.count_documents({})
    if existing_count > 0:
        confirm = input(f"Found {existing_count} existing patient history records. Add more? (y/n): ")
        if confirm.lower() != 'y':
            print("Operation cancelled by user.")
            sys.exit(0)
except Exception as e:
    print(f"Error checking existing patient records: {e}")

# Ask if the user wants to process all completed appointments
process_all = False
if len(completed_appointments) > 50:
    process_all_input = input(f"Found {len(completed_appointments)} completed appointments. Process all of them? (y/n): ")
    process_all = process_all_input.lower() == 'y'

# Generate and insert patient records
patient_records = generate_patient_records(completed_appointments, medications, process_all)

try:
    if not patient_records:
        print("No patient records were generated.")
        sys.exit(1)
        
    result = patient_history_collection.insert_many(patient_records)
    print(f"Successfully added {len(result.inserted_ids)} patient history records to the database.")
    
    # Count prescriptions
    total_prescriptions = sum(len(record.get("prescriptions", [])) for record in patient_records)
    avg_prescriptions = total_prescriptions / len(patient_records) if patient_records else 0
    
    print(f"\nTotal prescriptions added: {total_prescriptions}")
    print(f"Average prescriptions per record: {avg_prescriptions:.1f}")
    
    # Count by diagnosis
    diagnosis_counts = {}
    for record in patient_records:
        diagnosis = record["diagnosis"]
        if diagnosis in diagnosis_counts:
            diagnosis_counts[diagnosis] += 1
        else:
            diagnosis_counts[diagnosis] = 1
    
    print("\nTop diagnoses:")
    sorted_diagnoses = sorted(diagnosis_counts.items(), key=lambda x: x[1], reverse=True)
    for diagnosis, count in sorted_diagnoses[:5]:  # Show top 5
        print(f"  {diagnosis}: {count} ({count/len(patient_records)*100:.1f}%)")
    
except Exception as e:
    print(f"Error adding patient records: {e}")
    sys.exit(1)

print("\nDone!") 