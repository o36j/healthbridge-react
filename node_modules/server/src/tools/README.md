# Medication Seeder Tool

This tool adds 20 medications to the HealthBridge database.

## Prerequisites

- Python 3.6 or higher
- MongoDB connection string
- At least one user in the database (preferably an admin user)

## Installation

Install the required Python packages:

```bash
pip install -r requirements.txt
```

## Usage

### Method 1: Direct Python execution

```bash
# On Windows
.\seed_medications.ps1

# On Linux/macOS
./seed_medications.sh

# Or directly with Python
python add_medications.py
```

### Method 2: Using NPM script

From the server directory, run:

```bash
npm run seed:medications:py
```

If a `.env` file with your MongoDB connection string doesn't exist, the script will prompt you to enter one and create the file for you.

Alternatively, you can manually create a `.env` file in the server directory with your MongoDB connection string:

```
MONGODB_URI=mongodb://username:password@host:port/dbname
```

## What the script does

The script will:
- Connect to your MongoDB database
- Find an admin user (or any user if admin is not available) to set as the creator
- If no users exist, the script will offer to create a placeholder admin user
- Provide an option to delete existing medications before adding new ones
- Add medications that don't already exist in the database (to avoid duplicates)
- Print the names of added medications

## Added Medications

The script adds 20 medications with detailed information:

1. Escitalopram - SSRI antidepressant for depression and anxiety
2. Rosuvastatin - Statin for cholesterol management
3. Montelukast - Leukotriene receptor antagonist for asthma and allergies
4. Pantoprazole - Proton pump inhibitor for acid reflux
5. Duloxetine - SNRI for depression, anxiety, and chronic pain
6. Venlafaxine - SNRI for depression and anxiety
7. Clopidogrel - Antiplatelet for preventing blood clots
8. Candesartan - ARB for hypertension and heart failure
9. Azithromycin - Macrolide antibiotic for bacterial infections
10. Trazodone - Antidepressant often used for insomnia
11. Bupropion - Antidepressant and smoking cessation aid
12. Telmisartan - ARB for hypertension
13. Methylphenidate - CNS stimulant for ADHD and narcolepsy
14. Clonazepam - Benzodiazepine for seizures and anxiety
15. Memantine - NMDA receptor antagonist for Alzheimer's
16. Doxycycline - Tetracycline antibiotic
17. Aripiprazole - Atypical antipsychotic
18. Tamsulosin - Alpha-blocker for BPH symptoms
19. Levofloxacin - Fluoroquinolone antibiotic
20. Acyclovir - Antiviral for herpes infections

Each medication includes:
- Name and description
- Warnings and side effects
- Dosage form and strength
- Manufacturer information
- Creation metadata (timestamps and creator) 