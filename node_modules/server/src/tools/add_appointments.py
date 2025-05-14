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
    users_collection = db.users
    appointments_collection = db.appointments
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

# Get all doctors
try:
    doctors = list(users_collection.find({"role": "doctor"}))
    doctor_count = len(doctors)
    if doctor_count == 0:
        print("No doctors found in the database. Cannot create appointments.")
        sys.exit(1)
    else:
        print(f"Found {doctor_count} doctors in the database.")
except Exception as e:
    print(f"Error finding doctors: {e}")
    sys.exit(1)

# Get all patients
try:
    patients = list(users_collection.find({"role": "patient"}))
    patient_count = len(patients)
    if patient_count == 0:
        print("No patients found in the database. Cannot create appointments.")
        sys.exit(1)
    else:
        print(f"Found {patient_count} patients in the database.")
except Exception as e:
    print(f"Error finding patients: {e}")
    sys.exit(1)

# List of appointment reasons
appointment_reasons = [
    "Annual physical examination",
    "Follow-up appointment",
    "Consultation for new symptoms",
    "Medication review",
    "Chronic condition management",
    "Lab result discussion",
    "Specialist referral",
    "Preventive care",
    "Immunization",
    "Mental health consultation",
    "Pain management",
    "Minor procedure",
    "Wellness check",
    "Skin condition evaluation",
    "Cardiovascular assessment",
    "Digestive issues",
    "Respiratory problems",
    "Joint pain evaluation",
    "Neurological assessment",
    "Pre-surgery consultation"
]

# Possible appointment statuses from model
appointment_statuses = [
    "pending",
    "confirmed",
    "cancelled",
    "completed",
    "rescheduled"
]

# Generate a time slot (hours and minutes)
def generate_time_slot():
    # Business hours: 8 AM to 5 PM
    hour = random.randint(8, 16)  # 8 AM to 4 PM (the appointment will last 1 hour)
    # Only use quarter-hour intervals
    minute = random.choice([0, 15, 30, 45])
    
    start_time = f"{hour:02d}:{minute:02d}"
    
    # End time is 30, 45, or 60 minutes after start time
    duration_minutes = random.choice([30, 45, 60])
    
    end_hour = hour
    end_minute = minute + duration_minutes
    
    if end_minute >= 60:
        end_hour += end_minute // 60
        end_minute = end_minute % 60
    
    end_time = f"{end_hour:02d}:{end_minute:02d}"
    
    return start_time, end_time

# Generate a random date within the current year
def generate_date():
    current_year = datetime.now().year
    current_month = datetime.now().month
    current_day = datetime.now().day
    
    # Determine if the appointment is in the past or future
    is_past = random.random() < 0.4  # 40% chance for past appointments
    
    if is_past:
        # Generate a past date within the current year
        month = random.randint(1, current_month)
        if month == current_month:
            day = random.randint(1, current_day - 1) if current_day > 1 else 1
        else:
            # Get the number of days in the randomly selected month
            if month in [4, 6, 9, 11]:
                day = random.randint(1, 30)
            elif month == 2:
                # Simple leap year check
                if current_year % 4 == 0 and (current_year % 100 != 0 or current_year % 400 == 0):
                    day = random.randint(1, 29)
                else:
                    day = random.randint(1, 28)
            else:
                day = random.randint(1, 31)
    else:
        # Generate a future date within the current year
        month = random.randint(current_month, 12)
        if month == current_month:
            # Get the number of days in the current month
            if current_month in [4, 6, 9, 11]:
                max_day = 30
            elif current_month == 2:
                # Simple leap year check
                if current_year % 4 == 0 and (current_year % 100 != 0 or current_year % 400 == 0):
                    max_day = 29
                else:
                    max_day = 28
            else:
                max_day = 31
            day = random.randint(current_day, max_day)
        else:
            # Get the number of days for the randomly selected month
            if month in [4, 6, 9, 11]:
                day = random.randint(1, 30)
            elif month == 2:
                # Simple leap year check
                if current_year % 4 == 0 and (current_year % 100 != 0 or current_year % 400 == 0):
                    day = random.randint(1, 29)
                else:
                    day = random.randint(1, 28)
            else:
                day = random.randint(1, 31)
    
    return datetime(current_year, month, day)

# Generate appropriate status based on date
def generate_status(appointment_date):
    current_date = datetime.now()
    
    if appointment_date < current_date:
        # Past appointments are most likely completed, but can be cancelled
        return random.choices(
            ["completed", "cancelled"],
            weights=[0.85, 0.15],  # 85% completed, 15% cancelled
            k=1
        )[0]
    else:
        # Future appointments are pending, confirmed, or rescheduled
        return random.choices(
            ["pending", "confirmed", "rescheduled"],
            weights=[0.3, 0.6, 0.1],  # 30% pending, 60% confirmed, 10% rescheduled
            k=1
        )[0]

# Generate realistic patient notes for completed appointments
def generate_notes(status):
    if status == "completed":
        symptom_notes = [
            "Patient reported improvement from previous treatment",
            "Patient experiencing mild symptoms",
            "Symptoms have subsided since last visit",
            "Patient reports no new symptoms",
            "Patient experiencing some side effects from medication",
            "All vitals normal, patient in good health",
            "Patient responding well to treatment plan",
            "Patient showing signs of improvement",
            "Recommended lifestyle changes for better management",
            "Discussed test results with patient"
        ]
        return random.choice(symptom_notes)
    else:
        # Non-completed appointments typically don't have notes
        return None

# Generate appointment data
def generate_appointments(num_appointments):
    appointments = []
    
    # Create a queue of doctor-time pairs to avoid double booking
    doctor_appointments = {}
    
    for _ in range(num_appointments):
        # Select random doctor and patient
        doctor = random.choice(doctors)
        patient = random.choice(patients)
        
        # Generate appointment date
        appointment_date = generate_date()
        date_str = appointment_date.strftime("%Y-%m-%d")
        
        # Check if doctor is already booked at that time
        doctor_id_str = str(doctor["_id"])
        if doctor_id_str not in doctor_appointments:
            doctor_appointments[doctor_id_str] = {}
        
        # Try to find an unbooked time for this doctor on this day
        max_attempts = 5
        attempt = 0
        time_found = False
        
        while attempt < max_attempts and not time_found:
            # Generate time slot
            start_time, end_time = generate_time_slot()
            
            # Check if this time slot is already booked
            if date_str not in doctor_appointments[doctor_id_str]:
                doctor_appointments[doctor_id_str][date_str] = []
                time_found = True
            elif start_time not in doctor_appointments[doctor_id_str][date_str]:
                time_found = True
            
            if time_found:
                # Add this time to the booked list
                doctor_appointments[doctor_id_str][date_str].append(start_time)
            
            attempt += 1
        
        if not time_found:
            # If we couldn't find a time slot after max attempts, skip this appointment
            continue
        
        # Generate status based on date
        status = generate_status(appointment_date)
        
        # Generate reason for appointment
        reason = random.choice(appointment_reasons)
        
        # Generate virtual appointment flag (30% chance)
        is_virtual = random.random() < 0.3
        
        # Generate meeting link for virtual appointments
        meeting_link = None
        if is_virtual and status in ["confirmed", "rescheduled"]:
            meeting_link = f"https://healthbridge-meet.com/{random.randint(1000000, 9999999)}"
        
        # Generate notes for completed appointments
        notes = generate_notes(status)
        
        # Create appointment object
        appointment = {
            "patient": patient["_id"],
            "doctor": doctor["_id"],
            "date": appointment_date,
            "startTime": start_time,
            "endTime": end_time,
            "status": status,
            "reason": reason,
            "isVirtual": is_virtual,
            "createdBy": admin_id,
            "createdAt": datetime.now() - timedelta(days=random.randint(1, 30)),  # Created 1-30 days ago
            "updatedAt": datetime.now() - timedelta(days=random.randint(0, 7))    # Updated 0-7 days ago
        }
        
        # Add optional fields if they exist
        if notes:
            appointment["notes"] = notes
        
        if meeting_link:
            appointment["meetingLink"] = meeting_link
            
        appointments.append(appointment)
    
    return appointments

# Check for existing appointments
try:
    existing_count = appointments_collection.count_documents({})
    if existing_count > 0:
        confirm = input(f"Found {existing_count} existing appointments. Add more? (y/n): ")
        if confirm.lower() != 'y':
            print("Operation cancelled by user.")
            sys.exit(0)
except Exception as e:
    print(f"Error checking existing appointments: {e}")

# Ask how many appointments to create
try:
    num_appointments = int(input("How many appointments would you like to create? (recommended: 100-200): ") or "150")
except ValueError:
    print("Invalid input. Defaulting to 150 appointments.")
    num_appointments = 150

# Generate and insert appointments
appointments = generate_appointments(num_appointments)

try:
    result = appointments_collection.insert_many(appointments)
    print(f"Successfully added {len(result.inserted_ids)} appointments to the database.")
    
    # Count appointments by status
    status_counts = {}
    for appointment in appointments:
        status = appointment["status"]
        if status in status_counts:
            status_counts[status] += 1
        else:
            status_counts[status] = 1
    
    print("\nAppointment Status Distribution:")
    for status, count in status_counts.items():
        print(f"  {status.capitalize()}: {count} ({count/len(appointments)*100:.1f}%)")
    
    # Count virtual vs in-person
    virtual_count = sum(1 for a in appointments if a["isVirtual"])
    in_person_count = len(appointments) - virtual_count
    
    print(f"\nVirtual appointments: {virtual_count} ({virtual_count/len(appointments)*100:.1f}%)")
    print(f"In-person appointments: {in_person_count} ({in_person_count/len(appointments)*100:.1f}%)")
    
except Exception as e:
    print(f"Error adding appointments: {e}")
    sys.exit(1)

print("\nDone!") 