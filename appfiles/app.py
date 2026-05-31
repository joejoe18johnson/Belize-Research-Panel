

# ---------- Survey Assignment Helpers ----------
SURVEY_ASSIGNMENTS_FILE = "survey_assignments.csv"

def load_survey_assignments():
    if Path(SURVEY_ASSIGNMENTS_FILE).exists():
        try:
            return pd.read_csv(SURVEY_ASSIGNMENTS_FILE)
        except Exception:
            return pd.DataFrame()
    return pd.DataFrame()


def save_survey_assignments(df):
    df.to_csv(SURVEY_ASSIGNMENTS_FILE, index=False)


def generate_assignment_id():
    timestamp = pd.Timestamp.now().strftime("%Y%m%d%H%M%S")
    short_id = str(uuid.uuid4())[:6].upper()
    return f"ASSIGN-{timestamp}-{short_id}"
# ---------- End Survey Assignment Helpers ----------



# ---------- Sample Batch Member Persistence ----------
SAMPLE_BATCH_MEMBERS_FILE = "sample_batch_members.csv"

def load_sample_batch_members():
    if Path(SAMPLE_BATCH_MEMBERS_FILE).exists():
        try:
            return pd.read_csv(SAMPLE_BATCH_MEMBERS_FILE)
        except Exception:
            return pd.DataFrame()
    return pd.DataFrame()


def save_sample_batch_members(df):
    df.to_csv(SAMPLE_BATCH_MEMBERS_FILE, index=False)
# ---------- End Sample Batch Member Persistence ----------


# ---------- Distribution Engine Helpers ----------
DISTRIBUTION_FILE = "distribution_log.csv"

DISTRIBUTION_MODES = [
    "WhatsApp",
    "Email",
    "SMS",
    "Social Media",
    "Mixed Contact Strategy"
]

def load_distribution_log():
    if Path(DISTRIBUTION_FILE).exists():
        try:
            return pd.read_csv(DISTRIBUTION_FILE)
        except Exception:
            return pd.DataFrame()
    return pd.DataFrame()

def save_distribution_log(df):
    df.to_csv(DISTRIBUTION_FILE, index=False)

def generate_distribution_id():
    timestamp = pd.Timestamp.now().strftime("%Y%m%d%H%M%S")
    short_id = str(uuid.uuid4())[:6].upper()
    return f"DIST-{timestamp}-{short_id}"
# ---------- End Distribution Engine Helpers ----------

# app.py
# Belize Research Panel
# Registration + Sample Selection Engine + Admin Dashboard

import streamlit as st
import pandas as pd
from pathlib import Path
import os
import re
import uuid
import hashlib
from datetime import datetime, date

st.set_page_config(page_title="Belize Research Panel", page_icon="📊", layout="wide")

DATA_FILE = "panelists.csv"

COLUMNS = [
    "registration_date",
    "first_name",
    "last_name",
    "dob",
    "age",
    "citizenship_status",
    "voting_status",
    "voter_status",
    "place_of_residence",
    "district",
    "city_town_village",
    "country_if_abroad",
    "constituency",
    "registered_ctv_area",
    "sex",
    "education",
    "ethnicity",
    "political_interests",
    "market_interests",
    "civic_interests",
    "email",
    "phone_whatsapp",
    "facebook",
    "instagram",
    "tiktok",
    "other_contact",
    "street_address",
    "photo_id_type",
    "photo_id_last4",
    "username",
    "password_salt",
    "password_hash",
    "verification_status",
    "consent_research",
    "consent_contact",
    "consent_privacy",
    "status",
    "notes"
]


def sort_dropdown_options(options):
    """Alphabetical sort, with Other at the end, but before Prefer not to say."""
    cleaned = []
    for option in options:
        if option is None:
            continue
        value = str(option).strip()
        if value:
            cleaned.append(value)

    unique = sorted(set(cleaned), key=lambda x: x.lower())

    prefer_labels = ["Prefer not to say"]
    other_labels = ["Other"]

    regular = [x for x in unique if x not in set(other_labels + prefer_labels)]
    other = [x for x in other_labels if x in unique]
    prefer = [x for x in prefer_labels if x in unique]

    return regular + other + prefer

CITIZENSHIP_STATUS = [
    "Citizen of Belize",
    "Citizen of a Commonwealth country living in Belize",
    "Foreign national not living in Belize",
    "Other resident of Belize"
]

VOTING_STATUS = ["Yes", "No"]

BELIZE_DISTRICTS = ['Belize District',
 'Cayo District',
 'Corozal District',
 'Orange Walk District',
 'Stann Creek District',
 'Toledo District']

PLACE_OPTIONS = BELIZE_DISTRICTS + ["Abroad"]

CONSTITUENCIES = ['Albert',
 'Belize Rural Central',
 'Belize Rural North',
 'Belize Rural South',
 'Belmopan',
 'Caribbean Shores',
 'Cayo Central',
 'Cayo North',
 'Cayo North East',
 'Cayo South',
 'Cayo West',
 'Collet',
 'Corozal Bay',
 'Corozal North',
 'Corozal South East',
 'Corozal South West',
 'Dangriga',
 'Fort George',
 'Freetown',
 'Lake Independence',
 'Mesopotamia',
 'Orange Walk Central',
 'Orange Walk East',
 'Orange Walk North',
 'Orange Walk South',
 'Pickstock',
 'Port Loyola',
 'Queen Square',
 'Stann Creek West',
 'Toledo East',
 'Toledo West']

# CTV_LIST is retained for backward compatibility with older code; it stores constituencies.
CTV_LIST = CONSTITUENCIES

ALL_CTV_LIST = ['Agua Viva',
 'Aguacate',
 'Alta Vista',
 'Arenal',
 'Armenia',
 'August Pine Ridge',
 'Barranco',
 'Bella Vista',
 'Benque Viejo',
 'Bermudian Landing',
 'Big Falls',
 'Billy White',
 'Biscayne',
 'Blackman Eddy',
 'Bladen',
 'Blue Creek',
 'Bomba',
 'Boom Creek',
 'Boston',
 "Bradley's Bank",
 'Buena Vista',
 'Bullet Tree',
 'Burrell Boom',
 'Calcutta',
 'Caledonia',
 'Calla Creek',
 'Camalote',
 'Carmelita',
 'Carolina',
 'Cattle Landing',
 'Caye Caulker',
 'Central Farm',
 'Chan Chen',
 'Chan Pine Ridge',
 'Chunox',
 'Concepcion',
 'Conejo Creek',
 'Consejo',
 'Copper Bank',
 'Corazon Creek',
 'Cotton Tree',
 'Crique Jute',
 'Crique Sarco',
 'Cristo Rey',
 'Crooked Tree',
 'Dangriga',
 'Dolores',
 'Double Head Cabbage',
 'Douglas',
 'Duck Run 1',
 'Duck Run 2',
 'Duck Run 3',
 'Eldridgeville',
 'Esperanza',
 'Forest Home',
 "Frank's Eddy",
 'Gales Point',
 'Gardenia',
 'Georgetown',
 'Georgeville',
 'Grace Bank',
 'Gracie Rock',
 'Guinea Grass',
 'Hattieville',
 'Hicatee Creek',
 'Hope Creek',
 'Hopkins',
 'Independence',
 'Indian Church',
 'Indian Creek',
 'Isabella Bank',
 'Jacintoville',
 'Jalacte',
 'La Gracia',
 'Ladyville',
 'Lemonal',
 'Libertad',
 "Lord's Bank",
 'Los Lagos',
 'Los Tambos',
 'Louisville',
 'Lower Barton Creek',
 'Lucky Strike',
 'Machaquilha',
 'Mahogany Heights',
 'Maskall',
 'Maya Centre',
 'Maya Mopan',
 'Medina Bank',
 'Midway',
 'Monkey River',
 'Mullins River',
 'Nuevo San Juan',
 'Ontario',
 'Orange Walk Town',
 'Paraiso',
 'Patchakan',
 'Pine Hill',
 'Placencia',
 'Pomona',
 'Progresso',
 'Pueblo Viejo',
 'Punta Gorda',
 'Punta Negra',
 'Ranchito',
 'Rancho Dolores',
 'Red Bank',
 'Rhaburn Ridge',
 'Riversdale',
 'Roaring Creek',
 'San Andres',
 'San Antonio',
 'San Antonio RH',
 'San Benito Poite',
 'San Estevan',
 'San Felipe',
 'San Ignacio',
 'San Isidro',
 'San Joaquin',
 'San Jose',
 'San Jose Palmar',
 'San Juan',
 'San Lazaro',
 'San Marcos',
 'San Miguel',
 'San Narciso',
 'San Pablo',
 'San Pedro',
 'San Pedro A.C.',
 'San Pedro Colombia',
 'San Roman',
 'San Victor',
 'Sand Hill',
 'Santa Ana',
 'Santa Clara',
 'Santa Cruz',
 'Santa Elena',
 'Santa Familia',
 'Santa Marta',
 'Santa Rosa',
 'Santana',
 'Sarawee',
 'Sarteneja',
 'Scotland Half Moon',
 'Seine Bight',
 'Shipyard',
 'Silk Grass',
 'Silver Creek',
 'Sittee River',
 'South Stann Creek',
 'Spanish Lookout',
 'St. Ann',
 'St. Margaret',
 "St. Matthew's",
 'Steadfast',
 'Succotz',
 'Sunday Wood',
 'Teakettle',
 'Tower Hill',
 'Trial Farm',
 'Trinidad',
 'Trio',
 'Unitedville',
 'Valley Community',
 'Valley of Peace',
 'Western Paradise',
 'Willows Bank',
 'Xaibe',
 'Yalbac',
 'Yo Creek']

DISTRICT_CONSTITUENCY_CTV = {'Belize District': {'Albert': [],
                     'Belize Rural Central': ['Gales Point',
                                              'Gracie Rock',
                                              'Hattieville',
                                              'Ladyville',
                                              "Lord's Bank",
                                              'Los Lagos',
                                              'Mahogany Heights',
                                              'Western Paradise'],
                     'Belize Rural North': ['Bermudian Landing',
                                            'Biscayne',
                                            'Bomba',
                                            'Boston',
                                            'Burrell Boom',
                                            'Crooked Tree',
                                            'Double Head Cabbage',
                                            'Gardenia',
                                            'Grace Bank',
                                            'Isabella Bank',
                                            'Lemonal',
                                            'Lucky Strike',
                                            'Maskall',
                                            'Rancho Dolores',
                                            'Rhaburn Ridge',
                                            'Sand Hill',
                                            'Santana',
                                            'Scotland Half Moon',
                                            'St. Ann',
                                            'Willows Bank'],
                     'Belize Rural South': ['Caye Caulker', 'San Pedro A.C.'],
                     'Caribbean Shores': [],
                     'Collet': [],
                     'Fort George': [],
                     'Freetown': [],
                     'Lake Independence': [],
                     'Mesopotamia': [],
                     'Pickstock': [],
                     'Port Loyola': [],
                     'Queen Square': []},
 'Cayo District': {'Belmopan': [],
                   'Cayo Central': ["Bradley's Bank",
                                    'Buena Vista',
                                    'Central Farm',
                                    'Cristo Rey',
                                    'Georgeville',
                                    'La Gracia',
                                    'Lower Barton Creek',
                                    'San Antonio',
                                    'San Marcos',
                                    'Santa Elena',
                                    'Yalbac'],
                   'Cayo North': ['Bullet Tree', 'San Ignacio'],
                   'Cayo North East': ['Billy White',
                                       'Duck Run 1',
                                       'Duck Run 2',
                                       'Duck Run 3',
                                       'Esperanza',
                                       'Los Tambos',
                                       'Santa Familia',
                                       'Spanish Lookout'],
                   'Cayo South': ['Agua Viva',
                                  'Armenia',
                                  'Blackman Eddy',
                                  'Camalote',
                                  'Cotton Tree',
                                  "Frank's Eddy",
                                  'Ontario',
                                  'Roaring Creek',
                                  'St. Margaret',
                                  "St. Matthew's",
                                  'Teakettle',
                                  'Unitedville',
                                  'Valley of Peace'],
                   'Cayo West': ['Arenal', 'Benque Viejo', 'Calla Creek', 'Succotz']},
 'Corozal District': {'Corozal Bay': [],
                      'Corozal North': ['Chan Chen',
                                        'Consejo',
                                        'Cristo Rey',
                                        'Paraiso',
                                        'Patchakan',
                                        'San Andres',
                                        'San Antonio',
                                        'San Pedro',
                                        'Xaibe'],
                      'Corozal South East': ['Calcutta',
                                             'Caledonia',
                                             'Carolina',
                                             'Chunox',
                                             'Copper Bank',
                                             'Progresso',
                                             'Ranchito',
                                             'San Joaquin',
                                             'Sarteneja'],
                      'Corozal South West': ['Buena Vista',
                                             'Concepcion',
                                             'Libertad',
                                             'Louisville',
                                             'San Narciso',
                                             'San Roman',
                                             'San Victor',
                                             'Santa Clara']},
 'Orange Walk District': {'Orange Walk Central': ['Orange Walk Town', 'San Estevan'],
                          'Orange Walk East': ['Carmelita', 'Chan Pine Ridge', 'San Jose Palmar', 'Santa Marta', 'Tower Hill'],
                          'Orange Walk North': ['Douglas',
                                                'Nuevo San Juan',
                                                'San Antonio RH',
                                                'San Jose',
                                                'San Pablo',
                                                'Santa Cruz',
                                                'Trial Farm'],
                          'Orange Walk South': ['August Pine Ridge',
                                                'Blue Creek',
                                                'Guinea Grass',
                                                'Indian Church',
                                                'San Felipe',
                                                'San Lazaro',
                                                'Shipyard',
                                                'Trinidad',
                                                'Yo Creek']},
 'Stann Creek District': {'Dangriga': ['Dangriga', 'Hope Creek', 'Sarawee'],
                          'Stann Creek West': ['Alta Vista',
                                               'Georgetown',
                                               'Hopkins',
                                               'Independence',
                                               'Maya Centre',
                                               'Maya Mopan',
                                               'Mullins River',
                                               'Placencia',
                                               'Pomona',
                                               'Red Bank',
                                               'Riversdale',
                                               'San Juan',
                                               'San Roman',
                                               'Santa Cruz',
                                               'Santa Rosa',
                                               'Seine Bight',
                                               'Silk Grass',
                                               'Sittee River',
                                               'South Stann Creek',
                                               'Steadfast',
                                               'Valley Community']},
 'Toledo District': {'Toledo East': ['Barranco',
                                     'Bella Vista',
                                     'Bladen',
                                     'Boom Creek',
                                     'Cattle Landing',
                                     'Conejo Creek',
                                     'Corazon Creek',
                                     'Crique Sarco',
                                     'Dolores',
                                     'Eldridgeville',
                                     'Forest Home',
                                     'Machaquilha',
                                     'Midway',
                                     'Monkey River',
                                     'Punta Gorda',
                                     'Punta Negra',
                                     'San Isidro',
                                     'San Pablo',
                                     'Santa Ana',
                                     'Sunday Wood',
                                     'Trio'],
                     'Toledo West': ['Aguacate',
                                     'Big Falls',
                                     'Blue Creek',
                                     'Crique Jute',
                                     'Hicatee Creek',
                                     'Indian Creek',
                                     'Jacintoville',
                                     'Jalacte',
                                     'Medina Bank',
                                     'Pine Hill',
                                     'Pueblo Viejo',
                                     'San Antonio',
                                     'San Benito Poite',
                                     'San Jose',
                                     'San Marcos',
                                     'San Miguel',
                                     'San Pedro Colombia',
                                     'Santa Elena',
                                     'Silver Creek']}}

CONSTITUENCY_CTV = {'Albert': [],
 'Belize Rural Central': ['Gales Point',
                          'Gracie Rock',
                          'Hattieville',
                          'Ladyville',
                          "Lord's Bank",
                          'Los Lagos',
                          'Mahogany Heights',
                          'Western Paradise'],
 'Belize Rural North': ['Bermudian Landing',
                        'Biscayne',
                        'Bomba',
                        'Boston',
                        'Burrell Boom',
                        'Crooked Tree',
                        'Double Head Cabbage',
                        'Gardenia',
                        'Grace Bank',
                        'Isabella Bank',
                        'Lemonal',
                        'Lucky Strike',
                        'Maskall',
                        'Rancho Dolores',
                        'Rhaburn Ridge',
                        'Sand Hill',
                        'Santana',
                        'Scotland Half Moon',
                        'St. Ann',
                        'Willows Bank'],
 'Belize Rural South': ['Caye Caulker', 'San Pedro A.C.'],
 'Belmopan': [],
 'Caribbean Shores': [],
 'Cayo Central': ["Bradley's Bank",
                  'Buena Vista',
                  'Central Farm',
                  'Cristo Rey',
                  'Georgeville',
                  'La Gracia',
                  'Lower Barton Creek',
                  'San Antonio',
                  'San Marcos',
                  'Santa Elena',
                  'Yalbac'],
 'Cayo North': ['Bullet Tree', 'San Ignacio'],
 'Cayo North East': ['Billy White',
                     'Duck Run 1',
                     'Duck Run 2',
                     'Duck Run 3',
                     'Esperanza',
                     'Los Tambos',
                     'Santa Familia',
                     'Spanish Lookout'],
 'Cayo South': ['Agua Viva',
                'Armenia',
                'Blackman Eddy',
                'Camalote',
                'Cotton Tree',
                "Frank's Eddy",
                'Ontario',
                'Roaring Creek',
                'St. Margaret',
                "St. Matthew's",
                'Teakettle',
                'Unitedville',
                'Valley of Peace'],
 'Cayo West': ['Arenal', 'Benque Viejo', 'Calla Creek', 'Succotz'],
 'Collet': [],
 'Corozal Bay': [],
 'Corozal North': ['Chan Chen', 'Consejo', 'Cristo Rey', 'Paraiso', 'Patchakan', 'San Andres', 'San Antonio', 'San Pedro', 'Xaibe'],
 'Corozal South East': ['Calcutta', 'Caledonia', 'Carolina', 'Chunox', 'Copper Bank', 'Progresso', 'Ranchito', 'San Joaquin', 'Sarteneja'],
 'Corozal South West': ['Buena Vista', 'Concepcion', 'Libertad', 'Louisville', 'San Narciso', 'San Roman', 'San Victor', 'Santa Clara'],
 'Dangriga': ['Dangriga', 'Hope Creek', 'Sarawee'],
 'Fort George': [],
 'Freetown': [],
 'Lake Independence': [],
 'Mesopotamia': [],
 'Orange Walk Central': ['Orange Walk Town', 'San Estevan'],
 'Orange Walk East': ['Carmelita', 'Chan Pine Ridge', 'San Jose Palmar', 'Santa Marta', 'Tower Hill'],
 'Orange Walk North': ['Douglas', 'Nuevo San Juan', 'San Antonio RH', 'San Jose', 'San Pablo', 'Santa Cruz', 'Trial Farm'],
 'Orange Walk South': ['August Pine Ridge',
                       'Blue Creek',
                       'Guinea Grass',
                       'Indian Church',
                       'San Felipe',
                       'San Lazaro',
                       'Shipyard',
                       'Trinidad',
                       'Yo Creek'],
 'Pickstock': [],
 'Port Loyola': [],
 'Queen Square': [],
 'Stann Creek West': ['Alta Vista',
                      'Georgetown',
                      'Hopkins',
                      'Independence',
                      'Maya Centre',
                      'Maya Mopan',
                      'Mullins River',
                      'Placencia',
                      'Pomona',
                      'Red Bank',
                      'Riversdale',
                      'San Juan',
                      'San Roman',
                      'Santa Cruz',
                      'Santa Rosa',
                      'Seine Bight',
                      'Silk Grass',
                      'Sittee River',
                      'South Stann Creek',
                      'Steadfast',
                      'Valley Community'],
 'Toledo East': ['Barranco',
                 'Bella Vista',
                 'Bladen',
                 'Boom Creek',
                 'Cattle Landing',
                 'Conejo Creek',
                 'Corazon Creek',
                 'Crique Sarco',
                 'Dolores',
                 'Eldridgeville',
                 'Forest Home',
                 'Machaquilha',
                 'Midway',
                 'Monkey River',
                 'Punta Gorda',
                 'Punta Negra',
                 'San Isidro',
                 'San Pablo',
                 'Santa Ana',
                 'Sunday Wood',
                 'Trio'],
 'Toledo West': ['Aguacate',
                 'Big Falls',
                 'Blue Creek',
                 'Crique Jute',
                 'Hicatee Creek',
                 'Indian Creek',
                 'Jacintoville',
                 'Jalacte',
                 'Medina Bank',
                 'Pine Hill',
                 'Pueblo Viejo',
                 'San Antonio',
                 'San Benito Poite',
                 'San Jose',
                 'San Marcos',
                 'San Miguel',
                 'San Pedro Colombia',
                 'Santa Elena',
                 'Silver Creek']}

CONSTITUENCY_TO_DISTRICT = {'Albert': 'Belize District',
 'Belize Rural Central': 'Belize District',
 'Belize Rural North': 'Belize District',
 'Belize Rural South': 'Belize District',
 'Belmopan': 'Cayo District',
 'Caribbean Shores': 'Belize District',
 'Cayo Central': 'Cayo District',
 'Cayo North': 'Cayo District',
 'Cayo North East': 'Cayo District',
 'Cayo South': 'Cayo District',
 'Cayo West': 'Cayo District',
 'Collet': 'Belize District',
 'Corozal Bay': 'Corozal District',
 'Corozal North': 'Corozal District',
 'Corozal South East': 'Corozal District',
 'Corozal South West': 'Corozal District',
 'Dangriga': 'Stann Creek District',
 'Fort George': 'Belize District',
 'Freetown': 'Belize District',
 'Lake Independence': 'Belize District',
 'Mesopotamia': 'Belize District',
 'Orange Walk Central': 'Orange Walk District',
 'Orange Walk East': 'Orange Walk District',
 'Orange Walk North': 'Orange Walk District',
 'Orange Walk South': 'Orange Walk District',
 'Pickstock': 'Belize District',
 'Port Loyola': 'Belize District',
 'Queen Square': 'Belize District',
 'Stann Creek West': 'Stann Creek District',
 'Toledo East': 'Toledo District',
 'Toledo West': 'Toledo District'}

CITY_TOWN_VILLAGE = {'Belize District': ['Bermudian Landing',
                     'Biscayne',
                     'Bomba',
                     'Boston',
                     'Burrell Boom',
                     'Caye Caulker',
                     'Crooked Tree',
                     'Double Head Cabbage',
                     'Gales Point',
                     'Gardenia',
                     'Grace Bank',
                     'Gracie Rock',
                     'Hattieville',
                     'Isabella Bank',
                     'Ladyville',
                     'Lemonal',
                     "Lord's Bank",
                     'Los Lagos',
                     'Lucky Strike',
                     'Mahogany Heights',
                     'Maskall',
                     'Rancho Dolores',
                     'Rhaburn Ridge',
                     'San Pedro A.C.',
                     'Sand Hill',
                     'Santana',
                     'Scotland Half Moon',
                     'St. Ann',
                     'Western Paradise',
                     'Willows Bank',
                     'Other'],
 'Cayo District': ['Agua Viva',
                   'Arenal',
                   'Armenia',
                   'Benque Viejo',
                   'Billy White',
                   'Blackman Eddy',
                   "Bradley's Bank",
                   'Buena Vista',
                   'Bullet Tree',
                   'Calla Creek',
                   'Camalote',
                   'Central Farm',
                   'Cotton Tree',
                   'Cristo Rey',
                   'Duck Run 1',
                   'Duck Run 2',
                   'Duck Run 3',
                   'Esperanza',
                   "Frank's Eddy",
                   'Georgeville',
                   'La Gracia',
                   'Los Tambos',
                   'Lower Barton Creek',
                   'Ontario',
                   'Roaring Creek',
                   'San Antonio',
                   'San Ignacio',
                   'San Marcos',
                   'Santa Elena',
                   'Santa Familia',
                   'Spanish Lookout',
                   'St. Margaret',
                   "St. Matthew's",
                   'Succotz',
                   'Teakettle',
                   'Unitedville',
                   'Valley of Peace',
                   'Yalbac',
                   'Other'],
 'Corozal District': ['Buena Vista',
                      'Calcutta',
                      'Caledonia',
                      'Carolina',
                      'Chan Chen',
                      'Chunox',
                      'Concepcion',
                      'Consejo',
                      'Copper Bank',
                      'Cristo Rey',
                      'Libertad',
                      'Louisville',
                      'Paraiso',
                      'Patchakan',
                      'Progresso',
                      'Ranchito',
                      'San Andres',
                      'San Antonio',
                      'San Joaquin',
                      'San Narciso',
                      'San Pedro',
                      'San Roman',
                      'San Victor',
                      'Santa Clara',
                      'Sarteneja',
                      'Xaibe',
                      'Other'],
 'Orange Walk District': ['August Pine Ridge',
                          'Blue Creek',
                          'Carmelita',
                          'Chan Pine Ridge',
                          'Douglas',
                          'Guinea Grass',
                          'Indian Church',
                          'Nuevo San Juan',
                          'Orange Walk Town',
                          'San Antonio RH',
                          'San Estevan',
                          'San Felipe',
                          'San Jose',
                          'San Jose Palmar',
                          'San Lazaro',
                          'San Pablo',
                          'Santa Cruz',
                          'Santa Marta',
                          'Shipyard',
                          'Tower Hill',
                          'Trial Farm',
                          'Trinidad',
                          'Yo Creek',
                          'Other'],
 'Stann Creek District': ['Alta Vista',
                          'Dangriga',
                          'Georgetown',
                          'Hope Creek',
                          'Hopkins',
                          'Independence',
                          'Maya Centre',
                          'Maya Mopan',
                          'Mullins River',
                          'Placencia',
                          'Pomona',
                          'Red Bank',
                          'Riversdale',
                          'San Juan',
                          'San Roman',
                          'Santa Cruz',
                          'Santa Rosa',
                          'Sarawee',
                          'Seine Bight',
                          'Silk Grass',
                          'Sittee River',
                          'South Stann Creek',
                          'Steadfast',
                          'Valley Community',
                          'Other'],
 'Toledo District': ['Aguacate',
                     'Barranco',
                     'Bella Vista',
                     'Big Falls',
                     'Bladen',
                     'Blue Creek',
                     'Boom Creek',
                     'Cattle Landing',
                     'Conejo Creek',
                     'Corazon Creek',
                     'Crique Jute',
                     'Crique Sarco',
                     'Dolores',
                     'Eldridgeville',
                     'Forest Home',
                     'Hicatee Creek',
                     'Indian Creek',
                     'Jacintoville',
                     'Jalacte',
                     'Machaquilha',
                     'Medina Bank',
                     'Midway',
                     'Monkey River',
                     'Pine Hill',
                     'Pueblo Viejo',
                     'Punta Gorda',
                     'Punta Negra',
                     'San Antonio',
                     'San Benito Poite',
                     'San Isidro',
                     'San Jose',
                     'San Marcos',
                     'San Miguel',
                     'San Pablo',
                     'San Pedro Colombia',
                     'Santa Ana',
                     'Santa Elena',
                     'Silver Creek',
                     'Sunday Wood',
                     'Trio',
                     'Other']}

COUNTRIES = sort_dropdown_options(["United States", "Canada", "United Kingdom", "Mexico", "Guatemala", "Other"])

OTHER_CONTACT_PLATFORM_OPTIONS = [
    "Second email address",
    "Telegram",
    "Signal",
    "LinkedIn",
    "WeChat",
    "Snapchat",
    "Messenger",
    "Viber",
    "X / Twitter",
    "Other"
]

SEX_OPTIONS = ["Female", "Male"]
EDUCATION_LEVELS = [
    "None",
    "Primary",
    "Secondary",
    "Technical / Vocational",
    "Associate Degree",
    "University"
]
ETHNICITY_OPTIONS = sort_dropdown_options(["Mestizo", "Creole", "Garifuna", "Maya", "East Indian", "Latino(a)", "Other", "Prefer not to say"])

POLITICAL_INTERESTS = sorted([
    "Politics & Elections", "Political Parties", "Election Campaigns",
    "Leadership Approval", "Voting Behaviour", "Constituency Issues"
])

MARKET_INTERESTS = sorted([
    "Supermarkets & Groceries", "Restaurants & Food", "Telecommunications",
    "Banking", "Insurance", "Vehicles", "Real Estate", "Travel",
    "Household Goods", "Electronics", "Utilities", "Online Shopping"
])

CIVIC_INTERESTS = sorted([
    "Community Issues", "Crime & Public Safety", "Education", "Healthcare",
    "Cost of Living", "Jobs & Employment", "Youth Issues", "Women & Gender Issues",
    "Agriculture", "Tourism", "Climate Change & Environment", "Housing & Land",
    "Transportation", "Sports", "Entertainment", "Technology", "Public Services",
    "National Development"
])

PHOTO_ID_TYPES = sort_dropdown_options([
    "Social Security Card", "Passport", "Driver's Licence", "Voter ID",
    "Other Government-issued ID", "None / Prefer not to say"
])

VERIFICATION_STATUS = ["Pending", "Verified", "Possible Duplicate", "Rejected", "Needs Follow-up"]
PANELIST_STATUS = ["Active", "Inactive", "Do not contact", "Duplicate", "Withdrawn"]


def clean_text(x):
    if x is None:
        return ""
    return str(x).strip()


def title_case_name(name):
    name = clean_text(name)
    if not name:
        return ""
    return " ".join(part.capitalize() for part in name.split())


def count_contact_methods(email, phone, facebook, instagram, tiktok, other_contact):
    return sum([
        bool(clean_text(email)),
        bool(clean_text(phone)),
        bool(clean_text(facebook)),
        bool(clean_text(instagram)),
        bool(clean_text(tiktok)),
        bool(clean_text(other_contact))
    ])


def calculate_age(dob_value):
    today = date.today()
    return today.year - dob_value.year - ((today.month, today.day) < (dob_value.month, dob_value.day))


def calculate_sample_size(population_size, margin_error_pct, confidence_level, proportion=0.5):
    z_values = {"90%": 1.645, "95%": 1.96, "99%": 2.576}
    z = z_values.get(confidence_level, 1.96)
    e = margin_error_pct / 100
    p = proportion
    if population_size <= 0 or e <= 0:
        return 0
    n0 = (z ** 2 * p * (1 - p)) / (e ** 2)
    n = n0 / (1 + ((n0 - 1) / population_size))
    return int(round(n + 0.5))


def valid_email(email):
    email = clean_text(email)
    if email == "":
        return True
    pattern = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
    return re.match(pattern, email) is not None


def valid_username(username):
    return re.match(r"^[A-Za-z0-9_.-]{4,20}$", clean_text(username)) is not None


def password_strength(password, username="", first_name="", last_name=""):
    password = clean_text(password)
    username = clean_text(username).lower()
    first_name = clean_text(first_name).lower()
    last_name = clean_text(last_name).lower()
    lower_password = password.lower()

    very_common = {
        "password", "password1", "password123", "123456", "12345678",
        "qwerty", "abc123", "admin123", "letmein", "welcome"
    }

    if len(password) < 8:
        return "Weak", "Password must be at least 8 characters long."

    if lower_password in very_common:
        return "Weak", "Password is too common. Please choose a less predictable password."

    if username and username in lower_password:
        return "Weak", "Password should not contain your username."

    if first_name and first_name in lower_password:
        return "Weak", "Password should not contain your first name."

    if last_name and last_name in lower_password:
        return "Weak", "Password should not contain your last name."

    score = 0
    if len(password) >= 10:
        score += 1
    if re.search(r"[A-Z]", password):
        score += 1
    if re.search(r"[a-z]", password):
        score += 1
    if re.search(r"[0-9]", password):
        score += 1
    if re.search(r"[^A-Za-z0-9]", password):
        score += 1

    if score >= 4:
        return "Strong", "Password strength: Strong."
    if score >= 3:
        return "Moderate", "Password strength: Moderate. Longer passphrases are recommended."
    return "Weak", "Password is acceptable length but could be stronger. Use a longer phrase, number, or symbol."


def format_phone_number(phone):
    digits = "".join(ch for ch in str(phone) if ch.isdigit())
    if len(digits) == 10:
        return f"{digits[:3]}-{digits[3:6]}-{digits[6:]}"
    return clean_text(phone)


def hash_password(password, salt=None):
    if salt is None:
        salt = uuid.uuid4().hex
    password_hash = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return salt, password_hash


def verify_password(password, salt, stored_hash):
    _, check_hash = hash_password(password, salt)
    return check_hash == stored_hash


def load_data():
    if os.path.exists(DATA_FILE):
        df = pd.read_csv(DATA_FILE, dtype=str).fillna("")
        df = df.loc[:, ~df.columns.duplicated()]
        for col in COLUMNS:
            if col not in df.columns:
                df[col] = ""
        extra_cols = [c for c in df.columns if c not in COLUMNS]
        return df[COLUMNS + extra_cols]
    return pd.DataFrame(columns=COLUMNS, dtype=str)


def save_data(df):
    df = df.loc[:, ~df.columns.duplicated()]
    for col in COLUMNS:
        if col not in df.columns:
            df[col] = ""
    df = df[COLUMNS]
    df.to_csv(DATA_FILE, index=False)


def username_exists(df, username, exclude_index=None):
    if df.empty:
        return False
    temp = df.copy()
    if exclude_index is not None and exclude_index in temp.index:
        temp = temp.drop(index=exclude_index)
    return temp["username"].astype(str).str.lower().str.strip().eq(clean_text(username).lower()).any()


def duplicate_check(df, email, phone_whatsapp, first_name, last_name, dob, photo_id_type, photo_id_last4=""):
    hard_duplicate = False
    possible_duplicate = False

    if df.empty:
        return hard_duplicate, possible_duplicate

    first_norm = clean_text(first_name).lower()
    last_norm = clean_text(last_name).lower()
    dob_norm = str(dob).strip()
    email_norm = clean_text(email).lower()
    phone_norm = clean_text(phone_whatsapp)
    id_type_norm = clean_text(photo_id_type).lower()
    id_last4_norm = clean_text(photo_id_last4)

    if email_norm and "email" in df.columns:
        email_match = df["email"].astype(str).str.lower().str.strip().eq(email_norm)
        if email_match.any():
            hard_duplicate = True

    if phone_norm and "phone_whatsapp" in df.columns:
        phone_match = df["phone_whatsapp"].astype(str).str.strip().eq(phone_norm)
        if phone_match.any():
            hard_duplicate = True

    if {"first_name", "last_name", "dob"}.issubset(df.columns):
        same_name_dob = (
            df["first_name"].astype(str).str.lower().str.strip().eq(first_norm) &
            df["last_name"].astype(str).str.lower().str.strip().eq(last_norm) &
            df["dob"].astype(str).str.strip().eq(dob_norm)
        )
        if same_name_dob.any():
            hard_duplicate = True

    if id_type_norm and id_last4_norm:
        if {"photo_id_type", "photo_id_last4"}.issubset(df.columns):
            same_id = (
                df["photo_id_type"].astype(str).str.lower().str.strip().eq(id_type_norm) &
                df["photo_id_last4"].astype(str).str.strip().eq(id_last4_norm)
            )
            if same_id.any():
                hard_duplicate = True

    return hard_duplicate, possible_duplicate


def safe_index(options, value, default=0):
    try:
        return options.index(value)
    except Exception:
        return default


def to_numeric_age(series):
    return pd.to_numeric(series, errors="coerce")


st.title("📊 Belize Research Panel")
st.write("Registration, sample selection, and panel management for public opinion polling, market research, and governance studies.")

df = load_data()

# ------------------------------------------------------------
# FINAL CLEANUP & CONSOLIDATION NOTES
# ------------------------------------------------------------
# MVP stabilization priorities:
# 1. Verify all sidebar modules load correctly
# 2. Confirm registration saves consistently to panelists.csv
# 3. Confirm admin dashboard edit/filter/duplicate review works
# 4. Confirm sample selection engine calculations remain stable
# 5. Clearly label MVP placeholders vs production-ready modules
# 6. Prepare requirements.txt and deployment notes
# 7. Prepare ZIP-ready folder structure for developer handoff
# 8. Prepare PostgreSQL migration plan
# ------------------------------------------------------------

page = st.sidebar.radio("Navigation", ["MVP Status & Handoff Checklist", "MVP Packaging & Developer Handoff", "Panelist Registration", "Panelist Login", "Rewards & Loyalty", "Survey Distribution", "Advanced Analytics", "Fraud Prevention",
        "External Data Import & Matching", "Client & Project Management", "Financial & Revenue", "Client Reporting Portal", "Communication & Notifications", "Data Protection & Compliance", "Fieldwork Management", "User Roles & Permissions", "Backup & Recovery", "System Settings", "API & Integrations", "Deployment & Production", "Sample Selection Engine", "Admin Dashboard", "Distribution Engine"])



def is_registered_voter_series(df):
    if df.empty:
        return pd.Series(False, index=df.index)

    result = pd.Series(False, index=df.index)

    if "voting_status" in df.columns:
        result = result | df["voting_status"].astype(str).str.strip().str.lower().isin([
            "yes", "registered to vote in belize", "registered voter"
        ])

    if "voter_status" in df.columns:
        result = result | df["voter_status"].astype(str).str.strip().str.lower().isin([
            "registered voter", "yes", "registered"
        ])

    return result


def safe_options(df, column):
    if df.empty or column not in df.columns:
        return []
    vals = df[column].fillna("").astype(str).str.strip().unique().tolist()
    vals = [v for v in vals if v]
    return sorted(vals, key=lambda x: x.lower())

COMMONWEALTH_RESIDENCE_PROOF_TYPES = [
    "Belize bank statement",
    "Belize Social Security card",
    "Belize voter registration",
    "Employment letter / work permit",
    "Other proof of residence",
    "Rental / lease agreement",
    "Utility bill"
]

US_DIASPORA_REGIONS = [
    "US – Florida",
    "US – Midwest",
    "US – Northeast",
    "US – South",
    "US – Texas",
    "US – West",
    "US – Other / Not sure"
]


def show_clean_table(df, **kwargs):
    try:
        st.dataframe(df.reset_index(drop=True), hide_index=True, **kwargs)
    except TypeError:
        st.dataframe(df.reset_index(drop=True), **kwargs)


def get_registered_ctv_options_for_constituency(constituency):
    """Return CTV/village options only for constituencies with real CTV/village options."""
    if not clean_text(constituency):
        return []

    values = CONSTITUENCY_CTV.get(constituency, [])
    values = [clean_text(value) for value in values if clean_text(value)]
    real_values = [value for value in values if value not in ["Other", "Prefer not to say"]]

    if not real_values:
        return []

    if "Other" not in values:
        values.append("Other")

    return sort_dropdown_options(values)



def get_constituency_options_from_hierarchy(df=None):
    """Return constituency options from hierarchy first, falling back to existing data."""
    options = []

    if "CONSTITUENCY_TO_CTV" in globals() and isinstance(CONSTITUENCY_TO_CTV, dict):
        options.extend(CONSTITUENCY_TO_CTV.keys())
    if "CTV_BY_CONSTITUENCY" in globals() and isinstance(CTV_BY_CONSTITUENCY, dict):
        options.extend(CTV_BY_CONSTITUENCY.keys())
    if "CONSTITUENCY_CTV" in globals() and isinstance(CONSTITUENCY_CTV, dict):
        options.extend(CONSTITUENCY_CTV.keys())
    if "CONSTITUENCY_CTV_MAP" in globals() and isinstance(CONSTITUENCY_CTV_MAP, dict):
        options.extend(CONSTITUENCY_CTV_MAP.keys())
    if "DISTRICT_CONSTITUENCY_CTV" in globals() and isinstance(DISTRICT_CONSTITUENCY_CTV, dict):
        for district, constituencies in DISTRICT_CONSTITUENCY_CTV.items():
            if isinstance(constituencies, dict):
                options.extend(constituencies.keys())

    if not options and df is not None and not df.empty and "constituency" in df.columns:
        options.extend(df["constituency"].dropna().astype(str).tolist())

    options = [clean_text(option) for option in options if clean_text(option)]
    return sorted(set(options), key=lambda option: option.lower())




def looks_like_email(value):
    value = clean_text(value)
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", value))

def normalize_contact_handle(value):
    value = clean_text(value)
    if not value:
        return ""

    # Keep URLs lowercase and trim spaces.
    if value.lower().startswith(("http://", "https://", "www.")):
        return value.lower()

    # Standardize handles without changing meaningful symbols.
    value = value.strip()
    value = value.replace(" ", "")
    return value.lower()


def normalize_contact_platform(value):
    value = clean_text(value)
    if not value:
        return ""

    common = {
        "whatsapp": "WhatsApp",
        "telegram": "Telegram",
        "signal": "Signal",
        "linkedin": "LinkedIn",
        "wechat": "WeChat",
        "snapchat": "Snapchat",
        "x": "X",
        "twitter": "X / Twitter",
        "twitter/x": "X / Twitter",
        "x/twitter": "X / Twitter",
        "messenger": "Messenger",
        "facebook messenger": "Messenger",
        "viber": "Viber",
        "email": "Email",
        "sms": "SMS"
    }

    key = value.lower().strip()
    return common.get(key, value.title())



def has_registered_ctv_question(constituency):
    """Return True only when the selected constituency has real CTV/village options."""
    if not clean_text(constituency):
        return False

    values = CONSTITUENCY_CTV.get(constituency, [])
    values = [clean_text(value) for value in values if clean_text(value)]
    real_values = [value for value in values if value not in ["Other", "Prefer not to say"]]

    return len(real_values) > 0

if page == "MVP Status & Handoff Checklist":
    st.header("MVP Status & Handoff Checklist")

    st.subheader("Core Working Modules")

    checklist = {
        "Panelist Registration": "Working MVP",
        "Panelist Login": "Working MVP",
        "Admin Dashboard": "Working MVP",
        "Fraud Prevention": "Working MVP / improving",
        "Sample Selection Engine": "MVP / to refine later",
        "Rewards & Loyalty": "Concept module",
        "Survey Distribution": "Concept module",
        "Advanced Analytics": "Concept module",
        "Client & Project Management": "Concept module",
        "Financial & Revenue": "Concept module",
        "Client Reporting Portal": "Concept module",
        "Communication & Notifications": "Concept module",
        "Data Protection & Compliance": "Concept module",
        "Fieldwork Management": "Concept module",
        "User Roles & Permissions": "Concept module",
        "Backup & Recovery": "Concept module",
        "System Settings": "Concept module",
        "API & Integrations": "Concept module",
        "Deployment & Production": "Concept module"
    }

    checklist_df = pd.DataFrame(
        [{"Module": k, "Status": v} for k, v in checklist.items()]
    )
    st.dataframe(checklist_df, use_container_width=True)

    st.divider()

    st.subheader("Before Developer Handoff")

    st.markdown("""
### Immediate Stabilization Tasks

- Confirm registration saves every field correctly to `panelists.csv`
- Confirm duplicate blocking works for email, phone, name + DOB, and ID fragment
- Confirm Admin Dashboard edit, filter, duplicate review, and export all work
- Confirm Panelist Login displays correct profile information
- Confirm sample size calculator uses filtered panel count correctly
- Decide which concept modules should become working modules first
- Prepare `requirements.txt`
- Prepare clean folder structure
- Replace CSV storage with PostgreSQL or another production database
- Move admin password and secrets out of source code
""")

    st.divider()

    st.subheader("Recommended Next Production Priorities")

    st.markdown("""
1. Stabilize Registration + Admin Dashboard
2. Convert CSV database to PostgreSQL
3. Add secure authentication and roles
4. Build survey distribution properly
5. Build rewards tracking properly
6. Add automated backups
7. Prepare pilot launch
""")


elif page == "Panelist Registration":

    if st.session_state.get("registration_success"):
        st.success("Registration submitted successfully.")
        if st.session_state.get("registration_verification_status"):
            st.write(f"Verification Status: {st.session_state.get('registration_verification_status')}")

        st.stop()
    registration_mode = st.radio(
        "Registration mode",
        ["Self-registration", "Registration by authorised person"],
        horizontal=True
    )
    st.header("Panelist Registration")

    authorised_verification_code = ""

    st.subheader("1. Date of Birth")
    dob = st.date_input("Date of birth *", min_value=date(1920, 1, 1), max_value=date.today(), value=None)
    if dob is None:
        st.info("Please enter your date of birth to continue.")
        st.stop()
    age = calculate_age(dob)
    if age < 18:
        st.error("You are not eligible to register. Participants must be 18 years or older.")
        st.stop()
    st.success(f"Age confirmed: {age} years")

    st.subheader("2. Citizenship / Residency")
    citizenship_status = st.selectbox("Citizenship / residency status *", CITIZENSHIP_STATUS, index=None, placeholder="Select status")
    if citizenship_status is None:
        st.stop()
    if citizenship_status == "Foreign national not living in Belize":
        st.error("You are not eligible to register.")
        st.stop()

    st.subheader("3. Voter Registration")
    if citizenship_status in ["Citizen of Belize", "Citizen of a Commonwealth country living in Belize"]:
        voting_status = st.selectbox("Are you registered to vote in Belize? *", VOTING_STATUS, index=None, placeholder="Select voter status")
        if voting_status is None:
            st.stop()
        voter_status = "Registered voter" if voting_status == "Yes" else "Not applicable"
    else:
        voting_status = "Not registered to vote in Belize"
        voter_status = "Not applicable"

    registered_voter = citizenship_status in ["Citizen of Belize", "Citizen of a Commonwealth country living in Belize"] and voting_status == "Yes"

    st.subheader("4. Name")
    col_name1, col_name2 = st.columns(2)
    with col_name1:
        first_name = st.text_input("First name *")
    with col_name2:
        last_name = st.text_input("Last name(s) *")

    st.subheader("5. Demographic Information")
    col_demo1, col_demo2 = st.columns(2)
    with col_demo1:
        sex = st.selectbox("Sex *", SEX_OPTIONS, index=None, placeholder="Select sex")
    with col_demo2:
        education = st.selectbox("Highest level of education *", EDUCATION_LEVELS, index=None, placeholder="Select education")
    ethnicity = st.selectbox("Ethnicity *", ETHNICITY_OPTIONS, index=None, placeholder="Select ethnicity")

    st.subheader("6. Residence Details")
    residence_options = PLACE_OPTIONS
    if citizenship_status in ["Other resident of Belize", "Citizen of a Commonwealth country living in Belize"]:
        residence_options = BELIZE_DISTRICTS
    place_of_residence = st.selectbox("Where do you currently live? *", residence_options, index=None, placeholder="Select location")

    district = ""
    city_town_village = ""
    city_town_village_other = ""
    country_if_abroad = ""
    constituency = ""
    registered_ctv_area = ""

    if place_of_residence:
        if place_of_residence == "Abroad":
            country_if_abroad = st.selectbox("Country of residence *", COUNTRIES, index=None, placeholder="Select country")

            us_diaspora_region = ""
            if country_if_abroad in ["United States", "USA", "United States of America"]:
                us_diaspora_region = st.selectbox(
                    "US region *",
                    US_DIASPORA_REGIONS,
                    index=None,
                    placeholder="Select US region"
                )
        else:
            district = place_of_residence
            city_town_village = st.selectbox(f"Current city / town / village in {place_of_residence} *", CITY_TOWN_VILLAGE[place_of_residence], index=None, placeholder="Select city, town, or village")
            if city_town_village == "Other":
                city_town_village_other = st.text_input(f"Please specify city / town / village in {place_of_residence}")

    city_town_village_final = city_town_village_other if city_town_village == "Other" else city_town_village

    if registered_voter:
        st.subheader("7. Constituency Registration")

        constituency_options = get_constituency_options_from_hierarchy(df if "df" in locals() else None)
        if not constituency_options:
            constituency_options = sorted(CONSTITUENCIES, key=lambda x: x.lower()) if "CONSTITUENCIES" in globals() else []

        constituency = st.selectbox(
            "In which constituency are you registered to vote? *",
            constituency_options,
            index=None,
            placeholder="Select constituency"
        )

        registered_ctv_options = get_registered_ctv_options_for_constituency(constituency)

        if registered_ctv_options:
            registered_ctv_area = st.selectbox(
                f'Where in the "{constituency}" constituency were you living at the time you registered to vote there? *',
                registered_ctv_options,
                index=None,
                placeholder="Select city, town, or village"
            )
        else:
            registered_ctv_area = ""

    if registered_voter:
        st.subheader("8. Political / Election Poll Interests")
        political_interests = st.multiselect("Select all that apply", POLITICAL_INTERESTS)
    else:
        political_interests = []

    if place_of_residence != "Abroad":
        st.subheader("9. Market Research Interests")
        market_interests = st.multiselect("Select all that apply", MARKET_INTERESTS)
    else:
        market_interests = []
        st.info("Persons living abroad are eligible for political/election polls and diaspora-focused research where applicable.")

    st.subheader("10. Civic / Public / Social Issues")
    civic_interests = st.multiselect("Select all that apply", CIVIC_INTERESTS)

    st.subheader("11. Preferred Ways to Contact You")
    st.caption(
        "Please enter contact details carefully. At least two contact methods are encouraged so we can still reach you if one channel changes, is inactive, or fails during fieldwork."
    )
    col_contact1, col_contact2 = st.columns(2)
    with col_contact1:
        email = st.text_input("Email address")
        phone_whatsapp_raw = st.text_input("Phone / WhatsApp number")
        phone_whatsapp = format_phone_number(phone_whatsapp_raw) if phone_whatsapp_raw else ""
    with col_contact2:
        facebook = st.text_input("Facebook name or profile link")
        instagram = st.text_input("Instagram handle")
        tiktok = st.text_input("TikTok handle")

        other_contact_platform = st.selectbox(
            "Other contact platform / application",
            OTHER_CONTACT_PLATFORM_OPTIONS,
            index=None,
            placeholder="Select other contact type"
        )

        other_contact_custom_platform = ""
        if other_contact_platform == "Other":
            other_contact_custom_platform = st.text_input(
                "Please specify other contact platform / application",
                placeholder="Example: Telegram, Signal, LinkedIn, WeChat"
            )

        if other_contact_platform == "Second email address":
            other_contact = st.text_input(
                "Second email address",
                placeholder="Enter second email address"
            )
        else:
            other_contact = st.text_input(
                "Other contact detail",
                placeholder="Enter username, handle, phone, link, or ID for the platform above"
            )

        other_contact_platform_final = other_contact_custom_platform if other_contact_platform == "Other" else other_contact_platform

    contact_method_count = count_contact_methods(email, phone_whatsapp, facebook, instagram, tiktok, other_contact if clean_text(other_contact_platform_final if 'other_contact_platform_final' in locals() else other_contact_platform) else "")
    has_contact = contact_method_count > 0
    street_address = ""
    if clean_text(other_contact) and not clean_text(other_contact_platform_final if 'other_contact_platform_final' in locals() else other_contact_platform):
        st.warning("Please specify the platform/application for the other contact method.")

    if (other_contact_platform_final if 'other_contact_platform_final' in locals() else other_contact_platform) == "Second email address" and clean_text(other_contact) and not looks_like_email(other_contact):
        st.warning("Please enter a valid second email address.")

    if clean_text(other_contact_platform_final if 'other_contact_platform_final' in locals() else other_contact_platform) and not clean_text(other_contact):
        st.warning("Please provide the contact detail for the other platform/application.")

    if not has_contact:
        street_address = st.text_area("Street address / physical contact address *")

    st.subheader("12. Confirm Contact Details")
    st.markdown("<span style='color:#1f77b4; font-weight:600;'>Please review your contact details:</span>", unsafe_allow_html=True)
    st.markdown(f"<span style='color:#1f77b4;'>Email: {email if email else 'Not provided'}</span>", unsafe_allow_html=True)
    st.markdown(f"<span style='color:#1f77b4;'>Phone / WhatsApp: {phone_whatsapp if phone_whatsapp else 'Not provided'}</span>", unsafe_allow_html=True)
    st.markdown(f"<span style='color:#1f77b4;'>Facebook: {facebook if facebook else 'Not provided'}</span>", unsafe_allow_html=True)
    st.markdown(f"<span style='color:#1f77b4;'>Instagram: {instagram if instagram else 'Not provided'}</span>", unsafe_allow_html=True)
    st.markdown(f"<span style='color:#1f77b4;'>TikTok: {tiktok if tiktok else 'Not provided'}</span>", unsafe_allow_html=True)
    st.markdown(f"<span style='color:#000000;'>Other contact platform:</span> <span style='color:#1f77b4;'>{other_contact_platform if other_contact_platform else 'Not provided'}</span>", unsafe_allow_html=True)
    st.markdown(f"<span style='color:#000000;'>Other contact detail:</span> <span style='color:#1f77b4;'>{other_contact if other_contact else 'Not provided'}</span>", unsafe_allow_html=True)
    st.markdown(f"<span style='color:#1f77b4;'>Street address: {street_address if street_address else 'Not provided'}</span>", unsafe_allow_html=True)
    # duplicate Confirm Contact Details subheader removed
    
    contact_details_confirmed = st.checkbox("I confirm that the contact information shown above is correct. *")

    st.subheader("13. Photo ID")

    photo_id_last4 = ""

    col_id1, col_id2 = st.columns(2)
    with col_id1:
        photo_id_type = st.selectbox("Photo ID type *", [x for x in PHOTO_ID_TYPES if x not in ["None", "Prefer not to say", "None / prefer not to say"]], index=None, placeholder="Select ID type")
    with col_id2:
        photo_id_file = st.file_uploader(
            "Upload photo ID image or PDF" if registration_mode == "Self-registration" else "Upload photo ID image or PDF - optional for authorised registration",
            type=["png", "jpg", "jpeg", "pdf"]
        )

    st.info(
        "Photo ID is used only for identity and eligibility verification. ID numbers may be blurred or covered before upload, as long as the registrant's name, photograph, and eligibility details remain visible."
    )

    if registration_mode == "Registration by authorised person":
        st.caption(
            "Authorised registration mode allows photo upload to be bypassed when an authorised verification or QR process has been used."
        )

        authorised_verification_code = st.text_input(
            "Authorised verification code *",
            placeholder="Enter authorised verification / QR code"
        )

    proof_of_belize_residence_type = ""
    proof_of_belize_residence_file = None

    if citizenship_status == "Citizen of a Commonwealth country living in Belize":
        st.warning(
            "Commonwealth citizens must provide proof that they are currently resident in Belize. "
            "This protects the integrity of the panel."
        )
        proof_of_belize_residence_type = st.selectbox(
            "Proof of residence in Belize *",
            COMMONWEALTH_RESIDENCE_PROOF_TYPES,
            index=None,
            placeholder="Select proof type"
        )
        proof_of_belize_residence_file = st.file_uploader(
            "Upload proof of Belize residence *",
            type=["png", "jpg", "jpeg", "pdf"]
        )


    st.subheader("14. Account Details")
    col_acc1, col_acc2 = st.columns(2)
    with col_acc1:
        username = st.text_input("Choose a username *")
        st.markdown("""
**Password requirements**

- At least 8 characters
- Avoid common passwords such as `password123`
- Do not use your name or username as part of the password
- Longer passphrases are recommended
- A mix of letters, numbers, and symbols is encouraged
""")
        password = st.text_input("Create password *", type="password")
        if password:
            strength_label, strength_message = password_strength(password, username, first_name, last_name)
            if strength_label == "Strong":
                st.success(strength_message)
            elif strength_label == "Moderate":
                st.info(strength_message)
            else:
                st.warning(strength_message)
    with col_acc2:
        login_email = st.text_input("Login email - optional")
        confirm_password = st.text_input("Confirm password *", type="password")

    st.subheader("15. Consent")
    consent_research = st.checkbox("I agree to be considered for surveys, polls, interviews, or research activities. *")
    consent_contact = st.checkbox("I agree to be contacted using the contact details I provided. *")
    consent_privacy = st.checkbox("I understand that my information should be kept confidential and used only for legitimate research-related purposes. *")


    st.subheader("16. Review Full Registration Before Submitting")

    review_data = {
        "Registration mode": registration_mode,
        "Authorised verification code": authorised_verification_code if "authorised_verification_code" in locals() else "",
        "Citizenship / residency status": citizenship_status,
        "Registered to vote in Belize": voting_status,
        "First name": first_name,
        "Last name(s)": last_name,
        "Date of birth": dob,
        "Sex": sex,
        "Highest education": education,
        "Ethnicity": ethnicity,
        "Current residence": place_of_residence,
        "District": district,
        "City / Town / Village": city_town_village_final,
        "Country if abroad": country_if_abroad,
        "Constituency registered to vote": constituency,
        "Registered CTV area": registered_ctv_area,
        "Political interests": ", ".join(political_interests) if isinstance(political_interests, list) else political_interests,
        "Market research interests": ", ".join(market_interests) if isinstance(market_interests, list) else market_interests,
        "Civic / public / social issue interests": ", ".join(civic_interests) if isinstance(civic_interests, list) else civic_interests,
        "Email": email,
        "Phone / WhatsApp": phone_whatsapp,
        "Facebook": facebook,
        "Instagram": instagram,
        "TikTok": tiktok,
        "Other contact platform": other_contact_platform_final if "other_contact_platform_final" in locals() else other_contact_platform,
        "Other contact detail": other_contact,
        "Street address": street_address,
        "Photo ID type": photo_id_type,
        "Proof of Belize residence": proof_of_belize_residence_type if "proof_of_belize_residence_type" in locals() else ""
    }

    review_df = pd.DataFrame(
        [{"Question / Field": key, "Response": value if value not in [None, ""] else "Not provided"} for key, value in review_data.items()]
    )

    try:
        st.dataframe(review_df, hide_index=True, use_container_width=True)
    except TypeError:
        st.dataframe(review_df, use_container_width=True)

    final_review_confirmed = st.checkbox(
        "I have reviewed the full form and confirm that the information is correct. *"
    )

    submitted = st.button("Submit Registration")
    if submitted:
        errors = []
        new_row = {}

        if citizenship_status == "Citizen of a Commonwealth country living in Belize" and place_of_residence == "Abroad":
            errors.append("Commonwealth citizens must be living in Belize to be eligible under this registration category.")
        if citizenship_status == "Citizen of a Commonwealth country living in Belize":
            if not clean_text(proof_of_belize_residence_type):
                errors.append("Please provide proof of residence in Belize for Commonwealth citizens.")
            if proof_of_belize_residence_file is None:
                errors.append("Please upload proof of Belize residence for Commonwealth citizens.")
        if not clean_text(first_name): errors.append("First name is required.")
        if not clean_text(last_name): errors.append("Last name is required.")
        if sex is None: errors.append("Sex is required.")
        if education is None: errors.append("Education level is required.")
        if ethnicity is None: errors.append("Ethnicity is required.")
        if not place_of_residence: errors.append("Residence selection is required.")
        if citizenship_status == "Other resident of Belize" and place_of_residence == "Abroad": errors.append("Other residents of Belize cannot select Abroad as current residence.")
        if place_of_residence == "Abroad" and not country_if_abroad: errors.append("Country of residence is required.")
        if place_of_residence != "Abroad" and not city_town_village: errors.append("City / Town / Village is required.")
        if place_of_residence != "Abroad" and city_town_village == "Other" and not city_town_village_other: errors.append("Please specify city / town / village.")
        if registered_voter and not constituency:
            errors.append("Constituency is required for registered voters.")
        if registered_voter and has_registered_ctv_question(constituency) and not clean_text(registered_ctv_area):
            errors.append("Village / town / city area of voter registration is required for registered voters.")
        if registered_voter and not political_interests: errors.append("Please select at least one political / election poll interest.")
        if place_of_residence != "Abroad" and not market_interests: errors.append("Please select at least one market research interest.")
        if not civic_interests: errors.append("Please select at least one civic / public / social issue.")
        if contact_method_count < 2 and not street_address:
            errors.append("Please provide at least two contact methods. This helps us reach you if one channel changes, is inactive, or fails. If no electronic contact method is available, please provide a street address.")
        if phone_whatsapp:
            phone_digits = "".join(ch for ch in str(phone_whatsapp) if ch.isdigit())
            if len(phone_digits) != 10:
                errors.append("Phone / WhatsApp number must contain exactly 10 digits.")
        if email and not valid_email(email): errors.append("Please enter a valid email address.")
        if (other_contact_platform_final if "other_contact_platform_final" in locals() else other_contact_platform) == "Second email address" and clean_text(other_contact) and not valid_email(other_contact):
            errors.append("Second email address is selected, but the value entered is not a valid email address.")
        if login_email and not valid_email(login_email): errors.append("Please enter a valid login email address.")
        if not final_review_confirmed:
            errors.append("Please review and confirm the full registration form before submitting.")

        if not contact_details_confirmed: errors.append("Please confirm that your contact information is correct.")
        if photo_id_type is None: errors.append("Photo ID type is required.")
        if registration_mode == "Self-registration" and photo_id_file is None:
            errors.append("Photo ID upload is required for self-registration.")
        if registration_mode == "Registration by authorised person":
            if not clean_text(authorised_verification_code if "authorised_verification_code" in locals() else ""):
                errors.append("Please enter the authorised verification code.")
        if not valid_username(username): errors.append("Valid username is required. Use 4–20 letters, numbers, underscores, hyphens, or periods.")
        if username_exists(df, username): errors.append("Username already exists.")
        if not password:
            errors.append("Password is required.")
        if password:
            strength_label, strength_message = password_strength(password, username, first_name, last_name)
            if strength_label == "Weak":
                errors.append(strength_message)
        if password != confirm_password: errors.append("Password and confirm password do not match.")
        if not consent_research: errors.append("Research participation consent is required.")
        if not consent_contact: errors.append("Contact consent is required.")
        if not consent_privacy: errors.append("Privacy acknowledgement is required.")
        hard_duplicate, possible_duplicate = duplicate_check(df, email, phone_whatsapp, first_name, last_name, dob, photo_id_type, "")
        if hard_duplicate:
            errors.append("A duplicate registration appears to exist based on email, phone, name + date of birth, or photo ID details.")

        if errors:
            st.error("Submission could not be completed. Please correct the following:")
            for error in errors:
                st.warning(f"• {error}")
        else:
            salt, password_hash = hash_password(password)
            verification_status = "Possible Duplicate" if possible_duplicate else "Pending"
            new_row = {
                "registration_date": datetime.now().strftime("%d/%m/%Y %H:%M"),
                "registration_mode": registration_mode,
                "first_name": title_case_name(first_name),
                "last_name": title_case_name(last_name),
                "dob": str(dob),
                "age": age,
                "citizenship_status": citizenship_status,
                "voting_status": voting_status,
                "voter_status": voter_status,
                "place_of_residence": place_of_residence,
                "district": district,
                "city_town_village": clean_text(city_town_village_final),
                "country_if_abroad": country_if_abroad,
                "constituency": constituency,
                "registered_ctv_area": clean_text(registered_ctv_area),
                "sex": sex,
                "education": education,
                "ethnicity": ethnicity,
                "political_interests": "; ".join(political_interests),
                "market_interests": "; ".join(market_interests),
                "civic_interests": "; ".join(civic_interests),
                "email": clean_text(login_email) if clean_text(login_email) else clean_text(email),
                "phone_whatsapp": clean_text(phone_whatsapp),
                "facebook": normalize_contact_handle(facebook),
                "instagram": normalize_contact_handle(instagram),
                "tiktok": normalize_contact_handle(tiktok),
                "other_contact": normalize_contact_handle(other_contact),
            "other_contact_platform": normalize_contact_platform(other_contact_platform_final if "other_contact_platform_final" in locals() else other_contact_platform),
                "street_address": clean_text(street_address),
                "photo_id_type": photo_id_type,
                "photo_id_last4": clean_text(photo_id_last4),
                "username": clean_text(username),
                "password_salt": salt,
                "password_hash": password_hash,
                "verification_status": verification_status,
                "consent_research": consent_research,
                "consent_contact": consent_contact,
                "consent_privacy": consent_privacy,
                "status": "Active",
                "notes": ""
            }
            df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
            save_data(df)
            # Rerun to a dedicated confirmation screen. The form is not rendered on that run,
            # which causes Streamlit to drop the previous widget values.
            st.session_state["registration_success"] = True
            st.session_state["registration_verification_status"] = verification_status
            st.rerun()


elif page == "Panelist Login":
    st.header("Panelist Login")

    df = load_data()

    if df.empty:
        st.info("No panelists have registered yet.")
        st.stop()

    login_username = st.text_input("Username")
    login_password = st.text_input("Password", type="password")

    if st.button("Log In"):
        user_match = df[
            df["username"].astype(str).str.lower().str.strip() == clean_text(login_username).lower()
        ]

        if user_match.empty:
            st.error("No account found with that username.")
        else:
            user = user_match.iloc[0]
            stored_salt = str(user.get("password_salt", ""))
            stored_hash = str(user.get("password_hash", ""))

            if verify_password(login_password, stored_salt, stored_hash):
                st.success("Login successful.")

                st.subheader("My Profile")

                col_profile1, col_profile2 = st.columns(2)

                with col_profile1:
                    st.write(f"**Name:** {user.get('first_name', '')} {user.get('last_name', '')}")
                    st.write(f"**Age:** {user.get('age', '')}")
                    st.write(f"**Sex:** {user.get('sex', '')}")
                    st.write(f"**Education:** {user.get('education', '')}")
                    st.write(f"**Ethnicity:** {user.get('ethnicity', '')}")

                with col_profile2:
                    st.write(f"**Citizenship / Residency:** {user.get('citizenship_status', '')}")
                    st.write(f"**Voter Status:** {user.get('voting_status', '')}")
                    st.write(f"**District:** {user.get('district', '')}")
                    st.write(f"**City / Town / Village:** {user.get('city_town_village', '')}")
                    st.write(f"**Constituency:** {user.get('constituency', '')}")

                st.subheader("Contact Details")
                st.write(f"**Email:** {user.get('email', '')}")
                st.write(f"**Phone / WhatsApp:** {user.get('phone_whatsapp', '')}")
                st.write(f"**Facebook:** {user.get('facebook', '')}")
                st.write(f"**Instagram:** {user.get('instagram', '')}")
                st.write(f"**TikTok:** {user.get('tiktok', '')}")
                st.write(f"**Other Contact:** {user.get('other_contact', '')}")

                st.subheader("Interests")
                st.write(f"**Political / Election Interests:** {user.get('political_interests', '')}")
                st.write(f"**Market Research Interests:** {user.get('market_interests', '')}")
                st.write(f"**Civic / Public / Social Interests:** {user.get('civic_interests', '')}")

                st.subheader("Panel Status")
                st.write(f"**Verification Status:** {user.get('verification_status', '')}")
                st.write(f"**Panelist Status:** {user.get('status', '')}")

                st.info("Profile editing by panelists will be added in the next phase. For now, changes can be made by the administrator.")
            else:
                st.error("Incorrect password.")


elif page == "Rewards & Loyalty":
    st.header("Rewards & Loyalty")

    df = load_data()

    if df.empty:
        st.info("No panelists available yet.")
        st.stop()

    st.subheader("Rewards Overview")

    total_panelists = len(df)
    verified_panelists = len(df[df["verification_status"].astype(str) == "Verified"])

    col1, col2, col3 = st.columns(3)
    col1.metric("Total Panelists", total_panelists)
    col2.metric("Verified Panelists", verified_panelists)
    col3.metric("Reward Status", "MVP Phase")

    st.divider()

    st.subheader("Reward Rules")

    st.markdown("""
- Registration completed: **25 points**
- Verified account: **50 points**
- Survey completed: **100 points**
- In-depth interview completed: **250 points**
- Focus group participation: **300 points**
- Special high-priority study: custom reward
""")

    st.divider()

    st.subheader("Redemption Options")

    st.markdown("""
- Mobile top-up
- Gift cards
- Cash payout
- Bank transfer
- Utility credit
""")

    st.divider()

    st.subheader("Fraud Prevention Flags")

    st.markdown("""
The system should flag:

- duplicate registrations
- repeated phone numbers
- repeated email addresses
- suspicious repeated device/IP usage (future phase)
- unusual referral patterns
- rapid repeated survey completions
""")

    st.warning("Full reward point tracking, balances, redemption history, and fraud scoring will be added in the next implementation phase.")


elif page == "Survey Distribution":
    st.header("Survey Distribution Engine")

    df = load_data()

    if df.empty:
        st.info("No panelists available yet.")
        st.stop()

    st.subheader("Create Survey Assignment")

    survey_name = st.text_input("Survey name")

    col1, col2 = st.columns(2)

    with col1:
        delivery_method = st.selectbox(
            "Primary delivery method",
            ["Email", "WhatsApp", "SMS", "Facebook Messenger", "External Survey Link"]
        )

        target_group = st.selectbox(
            "Target group",
            ["All verified panelists", "Registered voters only", "Specific constituency", "Market research target", "Custom filtered sample"]
        )

    with col2:
        reminder_days = st.number_input(
            "Reminder after how many days?",
            min_value=1,
            max_value=30,
            value=3
        )

        incentive_trigger = st.selectbox(
            "Reward after completion",
            ["100 points", "150 points", "200 points", "Custom reward", "No reward"]
        )

    survey_link = st.text_input("Survey link (QuestionPro / Qualtrics / Google Form / etc.)")

    st.subheader("Distribution Rules")

    st.markdown("""
- only verified panelists should receive live surveys
- avoid duplicate invitations
- track invitations sent
- track reminders sent
- track completed responses
- trigger rewards automatically after completion
- allow exclusion of recently contacted panelists
""")

    if st.button("Prepare Survey Distribution"):
        st.success("Survey distribution prepared successfully.")
        st.write(f"Survey: {survey_name if survey_name else 'Unnamed Survey'}")
        st.write(f"Delivery Method: {delivery_method}")
        st.write(f"Target Group: {target_group}")
        st.write(f"Reminder Schedule: {reminder_days} day(s)")
        st.write(f"Completion Reward: {incentive_trigger}")
        st.write(f"Survey Link: {survey_link if survey_link else 'Not yet provided'}")

        st.info("Automated sending, response tracking, and reward triggering will be connected in the next implementation phase.")


elif page == "Advanced Analytics":
    st.header("Advanced Analytics Dashboard")

    df = load_data()

    if df.empty:
        st.info("No panelists available yet.")
        st.stop()

    st.subheader("Panel Health Metrics")

    total_panelists = len(df)
    verified_panelists = len(df[df["verification_status"].astype(str) == "Verified"]) if "verification_status" in df.columns else 0
    pending_panelists = len(df[df["verification_status"].astype(str) == "Pending"]) if "verification_status" in df.columns else 0
    active_panelists = len(df[df["status"].astype(str) == "Active"]) if "status" in df.columns else 0

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total Panelists", total_panelists)
    c2.metric("Verified", verified_panelists)
    c3.metric("Pending", pending_panelists)
    c4.metric("Active", active_panelists)

    st.divider()

    st.subheader("Geographic Coverage")

    geo1, geo2 = st.columns(2)

    with geo1:
        st.markdown("**Panelists by district**")
        if "district" in df.columns:
            district_summary = (
                df[df["district"].astype(str).str.strip() != ""]
                .groupby("district")
                .size()
                .reset_index(name="panelists")
                .sort_values("panelists", ascending=False)
            )

            if not district_summary.empty:
                show_clean_table(district_summary, use_container_width=True)
            else:
                st.info("No district coverage data available yet.")

    with geo2:
        st.markdown("**Geographic coverage by constituency**")
        if "constituency" in df.columns:
            constituency_summary = (
                df[df["constituency"].astype(str).str.strip() != ""]
                .groupby("constituency")
                .size()
                .reset_index(name="panelists")
                .sort_values("panelists", ascending=False)
            )

            if not constituency_summary.empty:
                show_clean_table(constituency_summary, use_container_width=True)
            else:
                st.info("No constituency coverage data available yet.")

    st.divider()

    st.subheader("Political Analytics")

    registered_voter_mask = is_registered_voter_series(df)
    registered_voters = int(registered_voter_mask.sum())

    political_interest_count = len(
        df[df["political_interests"].astype(str).str.strip() != ""]
    ) if "political_interests" in df.columns else 0

    p1, p2 = st.columns(2)
    p1.metric("Registered Voters", registered_voters)
    p2.metric("Political Interest Records", political_interest_count)

    if registered_voters > 0:
        registered_voter_df = df[registered_voter_mask].copy()

        st.markdown("**Registered voters by constituency**")
        if "constituency" in registered_voter_df.columns:
            rv_constituency = (
                registered_voter_df[registered_voter_df["constituency"].astype(str).str.strip() != ""]
                .groupby("constituency")
                .size()
                .reset_index(name="registered_voters")
                .sort_values("registered_voters", ascending=False)
            )
            show_clean_table(rv_constituency, use_container_width=True)

        st.markdown("**Registered voters by district, constituency and village / CTV area**")
        if "registered_ctv_area" in registered_voter_df.columns:
            rv_ctv = (
                registered_voter_df[registered_voter_df["registered_ctv_area"].astype(str).str.strip() != ""]
                .groupby([col for col in ["district", "constituency", "registered_ctv_area"] if col in registered_voter_df.columns])
                .size()
                .reset_index(name="registered_voters")
                .sort_values("registered_voters", ascending=False)
            )
            show_clean_table(rv_ctv, use_container_width=True)

    st.info("Turnout modelling, swing voter identification, and party support tracking will be added in the next analytics phase.")

    st.divider()

    st.subheader("Market Research Analytics")

    market_interest_count = len(
        df[df["market_interests"].astype(str).str.strip() != ""]
    ) if "market_interests" in df.columns else 0

    civic_interest_count = len(
        df[df["civic_interests"].astype(str).str.strip() != ""]
    ) if "civic_interests" in df.columns else 0

    m1, m2 = st.columns(2)
    m1.metric("Market Research Profiles", market_interest_count)
    m2.metric("Civic Issue Profiles", civic_interest_count)

    st.info("Consumer segmentation, brand preference analysis, and service satisfaction analytics will be added later.")

    st.divider()

    st.subheader("Operational Analytics")

    st.markdown("""
### Future Operational Metrics

- CATI productivity
- WhatsApp response rates
- email open rates
- survey completion rates
- panel retention rates
- reward cost vs response yield
- interviewer performance
- project profitability
""")


elif page == "Fraud Prevention":
    st.header("Fraud Prevention & Quality Control")

    df = load_data()

    if df.empty:
        st.info("No panelists available yet.")
        st.stop()

    st.subheader("Duplicate Detection Summary")

    duplicate_email_count = 0
    duplicate_phone_count = 0
    duplicate_name_dob_count = 0

    if "email" in df.columns:
        duplicate_email_count = int(df[df["email"].astype(str).str.strip() != ""]["email"].duplicated().sum())

    if "phone_whatsapp" in df.columns:
        duplicate_phone_count = int(df[df["phone_whatsapp"].astype(str).str.strip() != ""]["phone_whatsapp"].duplicated().sum())

    if {"first_name", "last_name", "dob"}.issubset(df.columns):
        name_dob = (
            df["first_name"].astype(str).str.lower().str.replace(r"\s+", " ", regex=True).str.strip() + "|" +
            df["last_name"].astype(str).str.lower().str.replace(r"\s+", " ", regex=True).str.strip() + "|" +
            df["dob"].astype(str).str.strip()
        )
        name_dob = name_dob[name_dob.str.replace("|", "", regex=False).str.strip() != ""]
        duplicate_name_dob_count = int(name_dob.duplicated(keep=False).sum())

    c1, c2, c3 = st.columns(3)
    c1.metric("Duplicate Emails", duplicate_email_count)
    c2.metric("Duplicate Phones", duplicate_phone_count)
    c3.metric("Same Name + DOB", duplicate_name_dob_count)

    st.divider()

    st.subheader("Duplicate Status Sync")

    if {"first_name", "last_name", "dob"}.issubset(df.columns):
        duplicate_key = (
            df["first_name"].astype(str).str.lower().str.replace(r"\s+", " ", regex=True).str.strip() + "|" +
            df["last_name"].astype(str).str.lower().str.replace(r"\s+", " ", regex=True).str.strip() + "|" +
            df["dob"].astype(str).str.strip()
        )

        duplicate_mask = duplicate_key.duplicated(keep=False) & (duplicate_key.str.replace("|", "", regex=False).str.strip() != "")

        duplicate_records = df[duplicate_mask].copy()

        if not duplicate_records.empty:
            st.warning(f"{len(duplicate_records)} records share the same name and date of birth.")

            display_dupes = duplicate_records[
                [c for c in ["first_name", "last_name", "dob", "username", "email", "phone_whatsapp", "verification_status"] if c in duplicate_records.columns]
            ]
            st.dataframe(display_dupes, use_container_width=True)

            if st.button("Mark Name + DOB Duplicates as Possible Duplicate"):
                df.loc[duplicate_mask, "verification_status"] = "Possible Duplicate"
                save_data(df)
                st.success("Duplicate records marked as Possible Duplicate.")
                st.rerun()
        else:
            st.success("No duplicate name + DOB records found.")

    st.divider()

    st.subheader("Verification Status Overview")

    verification_summary = (
        df.groupby("verification_status")
        .size()
        .reset_index(name="count")
        .sort_values("count", ascending=False)
    )

    st.dataframe(verification_summary, use_container_width=True)

    st.divider()

    st.subheader("Risk Categories")

    st.markdown("""
### Trust Score Categories

- High Confidence
- Medium Risk
- Needs Review
- Likely Duplicate

These will later be calculated automatically using duplicate checks,
response behavior, verification history, and suspicious activity scoring.
""")

    st.divider()

    st.subheader("Admin Quality Actions")

    st.markdown("""
### Available Controls

- mark as verified
- mark as possible duplicate
- reject suspicious records
- mark do not sample
- move to inactive
- request manual verification
- blacklist fraudulent users (future phase)
""")

    st.warning("Advanced fraud scoring using device/IP detection, rapid registrations, suspicious survey completion speed, and referral fraud detection will be added in the next implementation phase.")


elif page == "External Data Import & Matching":
    st.header("External Data Import & Matching")

    st.success("NEW: Import type selection, import purpose, match summary, and post-match action workflow are now included in this module.")

    st.write("Upload external files such as voter rolls, census tables, customer lists, employee lists, or past survey files for comparison, matching, and sampling support.")

    st.subheader("Step 1: External File Setup")

    uploaded_external_file = st.file_uploader("Upload external CSV file", type=["csv"])

    if uploaded_external_file is not None:
        try:
            external_df = pd.read_csv(uploaded_external_file, dtype=str).fillna("")
            st.success("External file uploaded successfully.")
            st.write(f"Rows uploaded: {len(external_df)}")
            st.write(f"Columns detected: {len(external_df.columns)}")
            st.dataframe(external_df.head(25), use_container_width=True)

            st.subheader("Column Mapping")
            external_columns = [""] + list(external_df.columns)

            map_first_name = st.selectbox("External column for first name", external_columns)
            map_last_name = st.selectbox("External column for last name", external_columns)
            map_dob = st.selectbox("External column for date of birth", external_columns)
            map_email = st.selectbox("External column for email", external_columns)
            map_phone = st.selectbox("External column for phone", external_columns)
            map_constituency = st.selectbox("External column for constituency", external_columns)
            map_district = st.selectbox("External column for district", external_columns)

            st.subheader("Import Configuration")

            external_file_type = st.selectbox(
                "External file type",
                [
                    "Voter Roll",
                    "Census / Population File",
                    "Customer List",
                    "Employee List",
                    "Past Survey File",
                    "Other"
                ]
            )

            import_purpose = st.selectbox(
                "Import purpose",
                [
                    "Compare Only",
                    "Verify Existing Panelists",
                    "Create Sample Frame",
                    "Update Population Totals",
                    "Identify Unmatched Records"
                ]
            )

            st.subheader("Matching Options")
            match_name_dob = st.checkbox("Match by name + date of birth", value=True)
            match_email = st.checkbox("Match by email")
            match_phone = st.checkbox("Match by phone")
            match_constituency = st.checkbox("Compare constituency")

            if st.button("Run Preliminary Match"):
                panel_df = load_data()
                result_df = external_df.copy()
                result_df["match_status"] = "Not matched"

                if panel_df.empty:
                    st.warning("No panelist data available to match against.")
                else:
                    if match_name_dob and map_first_name and map_last_name and map_dob:
                        panel_keys = set(
                            panel_df["first_name"].astype(str).str.lower().str.strip() + "|" +
                            panel_df["last_name"].astype(str).str.lower().str.strip() + "|" +
                            panel_df["dob"].astype(str).str.strip()
                        )
                        external_keys = (
                            result_df[map_first_name].astype(str).str.lower().str.strip() + "|" +
                            result_df[map_last_name].astype(str).str.lower().str.strip() + "|" +
                            result_df[map_dob].astype(str).str.strip()
                        )
                        result_df.loc[external_keys.isin(panel_keys), "match_status"] = "Matched by name + DOB"

                    st.subheader("Match Results")
                    st.write(f"**File Type:** {external_file_type}")
                    st.write(f"**Import Purpose:** {import_purpose}")

                    match_summary = result_df["match_status"].value_counts().reset_index()
                    match_summary.columns = ["Match Category", "Count"]
                    st.dataframe(match_summary, use_container_width=True)

                    st.subheader("Detailed Results")
                    st.dataframe(result_df.head(100), use_container_width=True)
                    import_action = st.selectbox(
                        "Post-match action",
                        [
                            "Do Not Import",
                            "Append Selected Records",
                            "Update Existing Records",
                            "Export Unmatched Records"
                        ]
                    )

                    st.write(f"**Selected Action:** {import_action}")

                    st.download_button(
                        "Download Match Results CSV",
                        result_df.to_csv(index=False).encode("utf-8"),
                        "external_match_results.csv",
                        "text/csv"
                    )
        except Exception as e:
            st.error(f"Could not read uploaded file: {e}")
    else:
        st.info("Upload an external CSV file to begin matching.")

    st.divider()
    st.subheader("Step 4: Planned Uses")
    st.markdown("""
- voter roll comparison and voter verification
- customer list sampling
- employee survey sample frames
- official population files for sample-size calculations
- matching past survey respondents
- identifying panel gaps by geography or demographics
- comparing external lists to current panel coverage
""")


elif page == "Client & Project Management":
    st.header("Client & Project Management")

    st.subheader("Client Information")

    client_name = st.text_input("Client name")
    client_type = st.selectbox(
        "Client type",
        [
            "Government Agency",
            "Political Party",
            "Private Company",
            "NGO",
            "International Organization",
            "Donor-Funded Project",
            "Other"
        ]
    )

    st.divider()

    st.subheader("Project Details")

    col1, col2 = st.columns(2)

    with col1:
        project_title = st.text_input("Project title")
        methodology = st.selectbox(
            "Methodology",
            [
                "CATI",
                "Face-to-Face",
                "Online Survey",
                "Mixed Mode",
                "Focus Group",
                "In-Depth Interview",
                "Other"
            ]
        )
        sample_size_project = st.number_input("Target sample size", min_value=1, value=400)
        target_geography = st.text_input("Target geography")

    with col2:
        project_status = st.selectbox(
            "Project status",
            [
                "Proposal Stage",
                "Approved",
                "Fieldwork",
                "Analysis",
                "Reporting",
                "Completed",
                "On Hold"
            ]
        )
        field_start = st.date_input("Fieldwork start date")
        delivery_deadline = st.date_input("Delivery deadline")
        assigned_staff = st.text_input("Assigned staff")

    st.divider()

    st.subheader("Financial Tracking")

    col3, col4 = st.columns(2)

    with col3:
        project_budget = st.number_input("Project budget (BZD)", min_value=0.0, value=0.0, step=100.0)
        invoice_status = st.selectbox(
            "Invoice status",
            ["Not Issued", "Issued", "Partially Paid", "Paid", "Overdue"]
        )

    with col4:
        payment_received = st.number_input("Payment received (BZD)", min_value=0.0, value=0.0, step=100.0)
        profitability_note = st.text_area("Notes / profitability observations")

    if st.button("Save Project Setup"):
        st.success("Project setup prepared successfully.")
        st.write(f"Client: {client_name if client_name else 'Not provided'}")
        st.write(f"Project: {project_title if project_title else 'Untitled Project'}")
        st.write(f"Methodology: {methodology}")
        st.write(f"Sample Size: {sample_size_project}")
        st.write(f"Status: {project_status}")
        st.write(f"Invoice Status: {invoice_status}")

        remaining_balance = max(project_budget - payment_received, 0)
        st.info(f"Outstanding balance: BZD ${remaining_balance:,.2f}")

        st.warning("Persistent project storage, invoicing automation, and profitability dashboards will be added in the next implementation phase.")


elif page == "Financial & Revenue":
    st.header("Financial & Revenue Management")

    st.subheader("Revenue Tracking")

    col1, col2 = st.columns(2)

    with col1:
        proposal_value = st.number_input(
            "Proposal value (BZD)",
            min_value=0.0,
            value=0.0,
            step=100.0
        )

        invoice_issued = st.number_input(
            "Invoices issued (BZD)",
            min_value=0.0,
            value=0.0,
            step=100.0
        )

        payments_received = st.number_input(
            "Payments received (BZD)",
            min_value=0.0,
            value=0.0,
            step=100.0
        )

    with col2:
        overdue_payments = st.number_input(
            "Overdue payments (BZD)",
            min_value=0.0,
            value=0.0,
            step=100.0
        )

        repeat_clients = st.number_input(
            "Repeat clients",
            min_value=0,
            value=0,
            step=1
        )

    st.divider()

    st.subheader("Cost Tracking")

    c1, c2 = st.columns(2)

    with c1:
        interviewer_costs = st.number_input("Interviewer costs", min_value=0.0, value=0.0, step=100.0)
        cati_costs = st.number_input("CATI / calling costs", min_value=0.0, value=0.0, step=100.0)
        incentive_costs = st.number_input("Panel incentive costs", min_value=0.0, value=0.0, step=100.0)

    with c2:
        transport_costs = st.number_input("Transport / field expenses", min_value=0.0, value=0.0, step=100.0)
        consultant_fees = st.number_input("Consultant fees", min_value=0.0, value=0.0, step=100.0)
        admin_overhead = st.number_input("Administrative overhead", min_value=0.0, value=0.0, step=100.0)

    total_costs = (
        interviewer_costs + cati_costs + incentive_costs +
        transport_costs + consultant_fees + admin_overhead
    )

    actual_profit = payments_received - total_costs
    outstanding_balance = max(invoice_issued - payments_received, 0)

    st.divider()

    st.subheader("Profitability Dashboard")

    d1, d2, d3 = st.columns(3)
    d1.metric("Total Costs", f"BZD ${total_costs:,.2f}")
    d2.metric("Outstanding Balance", f"BZD ${outstanding_balance:,.2f}")
    d3.metric("Actual Profit", f"BZD ${actual_profit:,.2f}")

    st.info("Future upgrades will include monthly revenue trends, client profitability ranking, cost per completed interview, ROI by survey type, and automated invoice tracking.")


elif page == "Client Reporting Portal":
    st.header("Client Reporting Portal")

    st.subheader("Client Project Dashboard")

    project_name = st.text_input("Project name")

    col1, col2 = st.columns(2)

    with col1:
        target_interviews = st.number_input(
            "Target interviews",
            min_value=1,
            value=1200,
            step=1
        )

        completed_interviews = st.number_input(
            "Completed interviews",
            min_value=0,
            value=0,
            step=1
        )

        response_rate = st.number_input(
            "Response rate (%)",
            min_value=0.0,
            max_value=100.0,
            value=42.0,
            step=1.0
        )

    with col2:
        top_issue = st.text_input("Top issue / key finding")
        approval_rating = st.number_input(
            "Approval rating (%)",
            min_value=0.0,
            max_value=100.0,
            value=0.0,
            step=1.0
        )
        undecided_voters = st.number_input(
            "Undecided voters (%)",
            min_value=0.0,
            max_value=100.0,
            value=0.0,
            step=1.0
        )

    achieved_pct = round((completed_interviews / target_interviews) * 100, 1) if target_interviews else 0

    st.divider()

    st.subheader("Live Client Snapshot")

    m1, m2, m3 = st.columns(3)
    m1.metric("Sample Achieved", f"{completed_interviews}/{target_interviews}")
    m2.metric("Completion Rate", f"{achieved_pct}%")
    m3.metric("Response Rate", f"{response_rate}%")

    st.write(f"**Top Issue:** {top_issue if top_issue else 'Not yet entered'}")
    st.write(f"**Approval Rating:** {approval_rating}%")
    st.write(f"**Undecided Voters:** {undecided_voters}%")

    st.divider()

    st.subheader("Client Deliverables")

    st.markdown("""
### Available Outputs

- topline summary
- presentation-ready charts
- downloadable PDF report
- constituency comparison tables
- demographic breakdowns
- executive summary for decision-makers
- progress tracker for live fieldwork
""")

    st.info("Secure client login, downloadable branded reports, and live interactive dashboards will be added in the next implementation phase.")


elif page == "Communication & Notifications":
    st.header("Communication & Notification Engine")

    st.subheader("Notification Setup")

    notification_type = st.selectbox(
        "Notification type",
        [
            "Registration Confirmation",
            "Verification Update",
            "Survey Invitation",
            "Survey Reminder",
            "Reward Confirmation",
            "Payout Notice",
            "Withdrawal Confirmation",
            "Client Progress Update",
            "Invoice Notice",
            "Admin Alert"
        ]
    )

    col1, col2 = st.columns(2)

    with col1:
        target_audience = st.selectbox(
            "Target audience",
            [
                "Panelists",
                "Verified Panelists",
                "Registered Voters",
                "Clients",
                "Administrators",
                "Custom Group"
            ]
        )

        delivery_channel = st.selectbox(
            "Primary delivery channel",
            [
                "Email",
                "WhatsApp",
                "SMS",
                "In-App Notice",
                "Facebook Messenger"
            ]
        )

    with col2:
        priority_level = st.selectbox(
            "Priority level",
            ["Low", "Normal", "High", "Urgent"]
        )

        reminder_frequency = st.selectbox(
            "Reminder schedule",
            [
                "No Reminder",
                "After 1 day",
                "After 3 days",
                "After 7 days",
                "Custom"
            ]
        )

    message_subject = st.text_input("Message subject")
    message_body = st.text_area("Message content")

    st.divider()

    st.subheader("Operational Alerts")

    st.markdown("""
### Automatic Admin Alerts

- duplicate / fraud detection flags
- low survey response rates
- overdue client payments
- project deadline risks
- low constituency coverage
- verification backlog
- failed payment / reward processing
""")

    if st.button("Prepare Notification"):
        st.success("Notification prepared successfully.")
        st.write(f"Type: {notification_type}")
        st.write(f"Audience: {target_audience}")
        st.write(f"Channel: {delivery_channel}")
        st.write(f"Priority: {priority_level}")
        st.write(f"Reminder: {reminder_frequency}")
        st.write(f"Subject: {message_subject if message_subject else 'No subject entered'}")

        st.info("Automated sending, delivery tracking, open rates, and notification history will be added in the next implementation phase.")


elif page == "Data Protection & Compliance":
    st.header("Data Protection, Consent & Compliance")

    st.subheader("Consent Management")

    consent_type = st.selectbox(
        "Consent type",
        [
            "Research Participation Consent",
            "Contact Permission",
            "Privacy Notice Acceptance",
            "Withdrawal Request",
            "Full Erasure Request",
            "Do Not Contact Request"
        ]
    )

    col1, col2 = st.columns(2)

    with col1:
        action_status = st.selectbox(
            "Action status",
            ["Active", "Pending Review", "Completed", "Rejected"]
        )

        retention_rule = st.selectbox(
            "Retention rule",
            [
                "Standard Retention",
                "Restricted Retention",
                "Anonymize After Closure",
                "Immediate Review Required"
            ]
        )

    with col2:
        lawful_basis = st.selectbox(
            "Lawful basis",
            [
                "Consent",
                "Contractual Requirement",
                "Legitimate Interest",
                "Legal Obligation"
            ]
        )

        restricted_access = st.selectbox(
            "Sensitive field access",
            ["Admin Only", "Restricted Admin", "Project Team Access"]
        )

    compliance_notes = st.text_area("Compliance notes")

    st.divider()

    st.subheader("Compliance Controls")

    st.markdown("""
### System Controls

- consent history log
- withdrawal tracking
- anonymization / erasure requests
- do-not-contact register
- admin audit trail
- export/download logs
- restricted access to sensitive identifiers
- verification of lawful contact basis
- privacy notice acknowledgement tracking
""")

    st.divider()

    st.subheader("Recommended Status Actions")

    st.markdown("""
### Examples

- Withdrawn → stop contact, retain minimal admin record
- Deceased → exclude from all sampling and rewards
- Full Erasure → remove direct identifiers where legally allowed
- Do Not Contact → preserve record but block all outreach
""")

    if st.button("Save Compliance Action"):
        st.success("Compliance action recorded successfully.")
        st.write(f"Consent Type: {consent_type}")
        st.write(f"Status: {action_status}")
        st.write(f"Retention Rule: {retention_rule}")
        st.write(f"Lawful Basis: {lawful_basis}")
        st.write(f"Access Level: {restricted_access}")

        st.info("Automated audit trails, export logs, anonymization workflows, and formal compliance reporting will be added in the next implementation phase.")


elif page == "Fieldwork Management":
    st.header("Fieldwork Management")

    st.subheader("Interviewer Assignment")

    interviewer_name = st.text_input("Interviewer name")

    col1, col2 = st.columns(2)

    with col1:
        assignment_type = st.selectbox(
            "Assignment type",
            [
                "CATI (Telephone Interviewing)",
                "Face-to-Face Interviewing",
                "Online Follow-up",
                "Supervisor Review"
            ]
        )

        assigned_area = st.text_input("Assigned area / territory")

        daily_target = st.number_input(
            "Daily interview target",
            min_value=1,
            value=20,
            step=1
        )

    with col2:
        completed_interviews = st.number_input(
            "Completed interviews",
            min_value=0,
            value=0,
            step=1
        )

        refusal_count = st.number_input(
            "Refusals",
            min_value=0,
            value=0,
            step=1
        )

        callback_count = st.number_input(
            "Callback list size",
            min_value=0,
            value=0,
            step=1
        )

    productivity_score = round((completed_interviews / daily_target) * 100, 1) if daily_target else 0

    st.divider()

    st.subheader("Supervisor Monitoring")

    s1, s2, s3 = st.columns(3)
    s1.metric("Daily Target", daily_target)
    s2.metric("Completed", completed_interviews)
    s3.metric("Productivity", f"{productivity_score}%")

    st.write(f"**Assigned Area:** {assigned_area if assigned_area else 'Not assigned'}")
    st.write(f"**Refusals:** {refusal_count}")
    st.write(f"**Callbacks Needed:** {callback_count}")

    st.divider()

    st.subheader("Quality Control Checks")

    st.markdown("""
### Supervisor Review Flags

- unusually fast completions
- suspicious repeated responses
- missed quotas
- geographic coverage gaps
- incomplete interviews
- failed callbacks
- unusual refusal patterns
- spot-check verification needed
""")

    st.info("GPS verification, live interviewer tracking, CATI call logs, supervisor spot checks, and automated interviewer performance scoring will be added in the next implementation phase.")


elif page == "User Roles & Permissions":
    st.header("User Roles & Permission Control")

    st.subheader("Create / Manage User Role")

    user_name = st.text_input("Staff / User name")
    user_email = st.text_input("User email")

    col1, col2 = st.columns(2)

    with col1:
        user_role = st.selectbox(
            "Role",
            [
                "Super Admin",
                "Operations Manager",
                "Research Analyst",
                "Field Supervisor",
                "Finance Officer",
                "Client Viewer"
            ]
        )

        access_scope = st.selectbox(
            "Access scope",
            [
                "Full Platform",
                "Assigned Projects Only",
                "Read Only",
                "Restricted Financial Access",
                "Restricted Compliance Access"
            ]
        )

    with col2:
        account_status = st.selectbox(
            "Account status",
            ["Active", "Inactive", "Suspended", "Pending Approval"]
        )

        two_factor = st.selectbox(
            "Two-factor authentication",
            ["Required", "Optional", "Not Enabled Yet"]
        )

    st.divider()

    st.subheader("Role Permissions Summary")

    st.markdown("""
### Permission Examples

- Super Admin → full access to all modules
- Operations Manager → panel + sampling + survey + fieldwork
- Research Analyst → analytics + reporting + client dashboards
- Field Supervisor → interviewer monitoring + QC only
- Finance Officer → billing + invoices + profitability only
- Client Viewer → read-only access to assigned reports
""")

    st.divider()

    st.subheader("Security Controls")

    st.markdown("""
### Recommended Controls

- password policy enforcement
- role-based access restrictions
- audit trail for admin actions
- login history review
- export/download restrictions
- approval workflow for sensitive actions
- forced logout for inactive sessions
""")

    if st.button("Save User Role Setup"):
        st.success("User role configuration prepared successfully.")
        st.write(f"User: {user_name if user_name else 'Not provided'}")
        st.write(f"Role: {user_role}")
        st.write(f"Access Scope: {access_scope}")
        st.write(f"Status: {account_status}")
        st.write(f"2FA Setting: {two_factor}")

        st.info("Persistent staff accounts, approval workflows, access logs, and live permission enforcement will be added in the next implementation phase.")


elif page == "Backup & Recovery":
    st.header("Backup, Recovery & Business Continuity")

    st.subheader("Backup Configuration")

    col1, col2 = st.columns(2)

    with col1:
        backup_frequency = st.selectbox(
            "Database backup frequency",
            [
                "Daily",
                "Twice Daily",
                "Weekly",
                "Manual Only"
            ]
        )

        full_system_backup = st.selectbox(
            "Full system backup",
            [
                "Weekly",
                "Bi-Weekly",
                "Monthly",
                "Manual Only"
            ]
        )

        offsite_storage = st.selectbox(
            "Off-site backup storage",
            [
                "Enabled",
                "Planned",
                "Not Yet Configured"
            ]
        )

    with col2:
        encryption_status = st.selectbox(
            "Backup encryption",
            [
                "Enabled",
                "Partial",
                "Not Yet Enabled"
            ]
        )

        restore_access = st.selectbox(
            "Restore permissions",
            [
                "Super Admin Only",
                "Restricted Admin",
                "Operations Manager + Super Admin"
            ]
        )

        version_history = st.selectbox(
            "Version history retention",
            [
                "30 Days",
                "90 Days",
                "180 Days",
                "1 Year"
            ]
        )

    st.divider()

    st.subheader("Recovery Controls")

    st.markdown("""
### Recovery Actions

- restore deleted panelist records
- rollback failed imports
- recover overwritten project files
- restore previous backup version
- emergency recovery after server failure
- audit log of restore actions
""")

    st.divider()

    st.subheader("Business Continuity Planning")

    st.markdown("""
### Continuity Requirements

- backup admin access
- succession access for ownership
- emergency contact chain
- offline operating procedures
- contingency plans for active projects
- internet outage response plan
- power failure response plan
- cyberattack / ransomware response protocol
""")

    if st.button("Save Backup Configuration"):
        st.success("Backup and recovery configuration prepared successfully.")
        st.write(f"Backup Frequency: {backup_frequency}")
        st.write(f"Full System Backup: {full_system_backup}")
        st.write(f"Off-site Storage: {offsite_storage}")
        st.write(f"Encryption: {encryption_status}")
        st.write(f"Restore Access: {restore_access}")
        st.write(f"Version Retention: {version_history}")

        st.info("Automated scheduled backups, live restore testing, disaster recovery drills, and recovery audit reporting will be added in the next implementation phase.")


elif page == "System Settings":
    st.header("System Settings & Configuration")

    st.subheader("Core Platform Settings")

    company_name = st.text_input("Company / Organization Name")
    default_confidence = st.selectbox(
        "Default confidence level",
        ["90%", "95%", "99%"],
        index=1
    )

    col1, col2 = st.columns(2)

    with col1:
        default_response_rate = st.number_input(
            "Default expected response rate (%)",
            min_value=1.0,
            max_value=100.0,
            value=40.0,
            step=1.0
        )

        default_reward_points = st.number_input(
            "Default survey completion reward points",
            min_value=0,
            value=100,
            step=10
        )

        inactivity_rule = st.number_input(
            "Inactive after how many days?",
            min_value=1,
            value=180,
            step=1
        )

    with col2:
        duplicate_threshold = st.selectbox(
            "Duplicate detection sensitivity",
            ["Strict", "Balanced", "Lenient"],
            index=0
        )

        fraud_alert_level = st.selectbox(
            "Fraud alert sensitivity",
            ["High", "Medium", "Low"],
            index=1
        )

        reward_expiry = st.number_input(
            "Reward points expire after (days)",
            min_value=30,
            value=365,
            step=30
        )

    st.divider()

    st.subheader("Security & Access Settings")

    password_policy = st.selectbox(
        "Password policy",
        [
            "Minimum 6 characters",
            "Minimum 8 characters + strong password",
            "Strong password + 2FA required"
        ]
    )

    session_timeout = st.number_input(
        "Session timeout (minutes)",
        min_value=5,
        value=30,
        step=5
    )

    st.divider()

    st.subheader("Reporting & Branding")

    st.markdown("""
### Future Configurable Items

- company logo upload
- branded PDF reports
- client dashboard branding
- email templates
- WhatsApp message templates
- invoice templates
- presentation export branding
""")

    if st.button("Save System Settings"):
        st.success("System settings prepared successfully.")
        st.write(f"Organization: {company_name if company_name else 'Not provided'}")
        st.write(f"Default Confidence Level: {default_confidence}")
        st.write(f"Default Response Rate: {default_response_rate}%")
        st.write(f"Reward Points: {default_reward_points}")
        st.write(f"Duplicate Detection: {duplicate_threshold}")
        st.write(f"Fraud Alerts: {fraud_alert_level}")
        st.write(f"Password Policy: {password_policy}")

        st.info("Persistent configuration storage, branding uploads, gateway integrations, and full operational settings management will be added in the next implementation phase.")


elif page == "API & Integrations":
    st.header("API & External Integrations")

    st.subheader("Survey Platform Integrations")

    survey_platform = st.selectbox(
        "Primary survey platform",
        [
            "QuestionPro",
            "Qualtrics",
            "SurveyMonkey",
            "Google Forms",
            "KoboToolbox",
            "ODK",
            "Custom CATI System"
        ]
    )

    api_status = st.selectbox(
        "Integration status",
        [
            "Connected",
            "Planned",
            "Testing",
            "Not Yet Configured"
        ]
    )

    survey_api_notes = st.text_area("Survey integration notes")

    st.divider()

    st.subheader("Communication Integrations")

    col1, col2 = st.columns(2)

    with col1:
        whatsapp_integration = st.selectbox(
            "WhatsApp Business API",
            ["Connected", "Planned", "Not Configured"]
        )

        sms_gateway = st.selectbox(
            "SMS Gateway",
            ["Connected", "Planned", "Not Configured"]
        )

    with col2:
        email_service = st.selectbox(
            "Email Service",
            ["Connected", "Planned", "Not Configured"]
        )

        messenger_integration = st.selectbox(
            "Facebook Messenger",
            ["Connected", "Planned", "Not Configured"]
        )

    st.divider()

    st.subheader("Payment & Analytics Integrations")

    payment_system = st.selectbox(
        "Reward / payout system",
        [
            "Bank Transfer Workflow",
            "Mobile Top-Up Provider",
            "Gift Card System",
            "Manual Processing",
            "Not Configured"
        ]
    )

    analytics_tool = st.selectbox(
        "Analytics platform",
        [
            "Power BI",
            "Tableau",
            "R / Shiny",
            "Python Reporting Pipeline",
            "Internal Dashboard Only"
        ]
    )

    st.divider()

    st.subheader("Security & Storage Integrations")

    st.markdown("""
### Future Integration Areas

- cloud backup providers
- secure document storage
- identity verification services
- automated fraud detection APIs
- cloud disaster recovery services
- external audit reporting integrations
""")

    if st.button("Save Integration Configuration"):
        st.success("Integration configuration prepared successfully.")
        st.write(f"Survey Platform: {survey_platform}")
        st.write(f"Integration Status: {api_status}")
        st.write(f"WhatsApp API: {whatsapp_integration}")
        st.write(f"SMS Gateway: {sms_gateway}")
        st.write(f"Email Service: {email_service}")
        st.write(f"Payment System: {payment_system}")
        st.write(f"Analytics Tool: {analytics_tool}")

        st.info("Live API connections, webhook automation, response syncing, and automatic reward triggering will be added in the next implementation phase.")


elif page == "Deployment & Production":
    st.header("Deployment & Production Readiness")

    st.subheader("Hosting & Infrastructure")

    hosting_option = st.selectbox(
        "Hosting option",
        [
            "Local Development Only",
            "Cloud VPS (DigitalOcean / AWS / Azure)",
            "Managed Cloud Platform",
            "Dedicated Server",
            "Hybrid Deployment"
        ]
    )

    database_choice = st.selectbox(
        "Primary database",
        [
            "CSV Files (Development Only)",
            "PostgreSQL",
            "MySQL",
            "SQL Server",
            "Cloud Database Service"
        ]
    )

    domain_name = st.text_input("Domain name")

    st.divider()

    st.subheader("Security & Access")

    col1, col2 = st.columns(2)

    with col1:
        ssl_status = st.selectbox(
            "HTTPS / SSL",
            ["Enabled", "Planned", "Not Configured"]
        )

        secure_admin_login = st.selectbox(
            "Secure admin authentication",
            ["Enabled", "2FA Planned", "Basic Password Only"]
        )

    with col2:
        environment_variables = st.selectbox(
            "Environment variable protection",
            ["Configured", "Planned", "Not Yet Configured"]
        )

        backup_status = st.selectbox(
            "Automated backups",
            ["Enabled", "Planned", "Not Configured"]
        )

    st.divider()

    st.subheader("Operational Readiness")

    st.markdown("""
### Production Checklist

- error logging enabled
- user activity logs enabled
- deployment documentation completed
- testing checklist completed
- launch checklist approved
- disaster recovery process tested
- admin access review completed
- live notification channels tested
- backup restore test completed
""")

    st.divider()

    st.subheader("Launch Readiness")

    launch_status = st.selectbox(
        "Current launch status",
        [
            "Development",
            "Internal Testing",
            "Pilot Launch",
            "Production Ready",
            "Live in Production"
        ]
    )

    deployment_notes = st.text_area("Deployment notes")

    if st.button("Save Deployment Configuration"):
        st.success("Deployment readiness configuration prepared successfully.")
        st.write(f"Hosting: {hosting_option}")
        st.write(f"Database: {database_choice}")
        st.write(f"Domain: {domain_name if domain_name else 'Not provided'}")
        st.write(f"SSL: {ssl_status}")
        st.write(f"Admin Security: {secure_admin_login}")
        st.write(f"Launch Status: {launch_status}")

        st.info("Live production deployment, database migration, monitoring dashboards, and final go-live controls will be completed in the next implementation phase.")


elif page == "MVP Packaging & Developer Handoff":
    st.header("MVP Packaging & Developer Handoff")

    st.subheader("Developer Delivery Checklist")

    st.markdown("""
### Final Package Should Include

- complete application source code
- cleaned folder structure
- requirements.txt / dependency list
- database schema documentation
- CSV-to-database migration notes
- environment variable setup guide
- admin credential setup instructions
- deployment instructions
- backup and restore guide
- production launch checklist
""")

    st.divider()

    st.subheader("Module Coverage Summary")

    st.markdown("""
### Core Modules Included

- Panelist Registration
- Panelist Login
- Rewards & Loyalty
- Survey Distribution
- Advanced Analytics
- Fraud Prevention
- Client & Project Management
- Financial & Revenue
- Client Reporting Portal
- Communication & Notifications
- Data Protection & Compliance
- Fieldwork Management
- User Roles & Permissions
- Backup & Recovery
- System Settings
- API & External Integrations
- Deployment & Production Readiness
- Sample Selection Engine
- Admin Dashboard
""")

    st.divider()

    st.subheader("Known MVP Limitations")

    st.markdown("""
### To Be Completed in Production Phase

- PostgreSQL production database
- live API integrations
- WhatsApp/SMS gateway automation
- payment automation
- branded PDF export
- full permission enforcement
- automated backup scheduling
- production security hardening
- audit logging
- real-time reporting dashboards
""")

    st.divider()

    st.subheader("Priority Build Roadmap")

    priority_phase = st.selectbox(
        "Immediate next implementation priority",
        [
            "Production Database Migration",
            "Live Survey Integrations",
            "WhatsApp + SMS Automation",
            "Client Reporting Dashboards",
            "Security Hardening",
            "Commercial Launch Preparation"
        ]
    )

    developer_notes = st.text_area("Developer handoff notes")

    if st.button("Prepare Developer Handoff"):
        st.success("Developer handoff package prepared successfully.")
        st.write(f"Priority Phase: {priority_phase}")
        st.write(f"Notes: {developer_notes if developer_notes else 'No additional notes entered'}")

        st.info("Final export package, technical documentation bundle, and implementation handoff versioning will be completed in the final production handoff phase.")


elif page == "Sample Selection Engine":
    st.header("Sample Selection Engine")

    df = load_data()
    if df.empty:
        st.info("No panelists available for sampling yet.")
        st.stop()

    sample_pool = df.copy()

    st.subheader("1. Sampling Method")
    sampling_method = st.selectbox(
        "Select sampling method",
        [
            "Simple Random Sample",
            "Stratified Sample",
            "Quota Sample",
            "Controlled Sample",
            "Cluster Sample"
        ]
    )

    if sampling_method == "Cluster Sample":
        st.info(
            "Cluster sampling is included as a placeholder until a suitable smaller cluster variable, "
            "such as EA, polling area, or interviewer zone, is available."
        )

    st.subheader("2. Sampling Filters")
    st.caption(
        "All filter fields are independent. Leave a filter blank to include all records for that field. "
        "The age slider goes to at least 100, and the 65+ age group includes all persons aged 65 and older."
    )

    if "age" in sample_pool.columns:
        age_numeric_for_group = to_numeric_age(sample_pool["age"])
        sample_pool["age_group"] = age_numeric_for_group.apply(
            lambda x: "Unknown" if pd.isna(x) else (
                "18–24" if x < 25 else
                "25–34" if x < 35 else
                "35–44" if x < 45 else
                "45–54" if x < 55 else
                "55–64" if x < 65 else
                "65+"
            )
        )
    else:
        sample_pool["age_group"] = "Unknown"

    st.markdown("### Geography")

    g1, g2, g3 = st.columns(3)

    with g1:
        residence_options = safe_options(sample_pool, "place_of_residence")
        if "Abroad" not in residence_options:
            residence_options.append("Abroad")
        residence_options = sorted(residence_options, key=lambda x: x.lower())

        filter_residence = st.multiselect(
            "Current residence / Abroad",
            residence_options,
            default=[],
            placeholder="Leave blank for all"
        )

        filter_district = st.multiselect(
            "District",
            safe_options(sample_pool, "district"),
            default=[],
            placeholder="Leave blank for all districts"
        )

    with g2:
        filter_current_village = st.multiselect(
            "Current city / town / village",
            safe_options(sample_pool, "city_town_village"),
            default=[],
            placeholder="Leave blank for all villages"
        )

        filter_constituency = st.multiselect(
            "Registered constituency",
            safe_options(sample_pool, "constituency"),
            default=[],
            placeholder="Leave blank for all constituencies"
        )

    with g3:
        filter_registered_ctv = st.multiselect(
            "Registered CTV area / village",
            safe_options(sample_pool, "registered_ctv_area"),
            default=[],
            placeholder="Leave blank for all registered villages"
        )

        filter_country_abroad = st.multiselect(
            "Country if abroad",
            safe_options(sample_pool, "country_if_abroad"),
            default=[],
            placeholder="Leave blank for all countries"
        )

    st.markdown("### Demographics and status")

    c1, c2, c3 = st.columns(3)

    with c1:
        filter_sex = st.multiselect(
            "Sex",
            safe_options(sample_pool, "sex"),
            default=[],
            placeholder="Leave blank for all"
        )

        filter_age_group = st.multiselect(
            "Age group",
            ["18–24", "25–34", "35–44", "45–54", "55–64", "65+", "Unknown"],
            default=[],
            placeholder="Leave blank for all"
        )

    with c2:
        filter_ethnicity = st.multiselect(
            "Ethnicity",
            safe_options(sample_pool, "ethnicity"),
            default=[],
            placeholder="Leave blank for all"
        )

        filter_education = st.multiselect(
            "Education",
            safe_options(sample_pool, "education"),
            default=[],
            placeholder="Leave blank for all"
        )

    with c3:
        filter_verification = st.multiselect(
            "Verification Status",
            safe_options(sample_pool, "verification_status"),
            default=[],
            placeholder="Leave blank for all"
        )

        voters_only = st.checkbox("Registered voters only", value=False)

    age_series = to_numeric_age(sample_pool["age"]) if "age" in sample_pool.columns else pd.Series(dtype=float)
    observed_max_age = int(age_series.max()) if age_series.notna().any() else 100
    max_age = max(100, observed_max_age)

    selected_age_range = st.slider(
        "Age range",
        min_value=18,
        max_value=max_age,
        value=(18, max_age)
    )

    # Apply independent filters only after all filter options have been displayed.
    if filter_residence and "place_of_residence" in sample_pool.columns:
        sample_pool = sample_pool[sample_pool["place_of_residence"].astype(str).isin(filter_residence)]

    if filter_district and "district" in sample_pool.columns:
        sample_pool = sample_pool[sample_pool["district"].astype(str).isin(filter_district)]

    if filter_current_village and "city_town_village" in sample_pool.columns:
        sample_pool = sample_pool[sample_pool["city_town_village"].astype(str).isin(filter_current_village)]

    if filter_constituency and "constituency" in sample_pool.columns:
        sample_pool = sample_pool[sample_pool["constituency"].astype(str).isin(filter_constituency)]

    if filter_registered_ctv and "registered_ctv_area" in sample_pool.columns:
        sample_pool = sample_pool[sample_pool["registered_ctv_area"].astype(str).isin(filter_registered_ctv)]

    if filter_country_abroad and "country_if_abroad" in sample_pool.columns:
        sample_pool = sample_pool[sample_pool["country_if_abroad"].astype(str).isin(filter_country_abroad)]

    if filter_sex and "sex" in sample_pool.columns:
        sample_pool = sample_pool[sample_pool["sex"].astype(str).isin(filter_sex)]

    if filter_age_group and "age_group" in sample_pool.columns:
        sample_pool = sample_pool[sample_pool["age_group"].astype(str).isin(filter_age_group)]

    if filter_ethnicity and "ethnicity" in sample_pool.columns:
        sample_pool = sample_pool[sample_pool["ethnicity"].astype(str).isin(filter_ethnicity)]

    if filter_education and "education" in sample_pool.columns:
        sample_pool = sample_pool[sample_pool["education"].astype(str).isin(filter_education)]

    if filter_verification and "verification_status" in sample_pool.columns:
        sample_pool = sample_pool[sample_pool["verification_status"].astype(str).isin(filter_verification)]

    if voters_only:
        sample_pool = sample_pool[is_registered_voter_series(sample_pool)]

    if "age" in sample_pool.columns:
        sample_pool["age_num"] = to_numeric_age(sample_pool["age"])
        sample_pool = sample_pool[
            (sample_pool["age_num"] >= selected_age_range[0]) &
            (sample_pool["age_num"] <= selected_age_range[1])
        ]
        sample_pool = sample_pool.drop(columns=["age_num"], errors="ignore")

    auto_population_size = len(sample_pool)

    st.write(f"Eligible pool after filters: **{auto_population_size}** panelists")

    st.subheader("3. Sample Size Calculator")

    use_manual_population = st.checkbox(
        "Use official/manual population size instead of filtered panel count",
        value=False
    )

    calc1, calc2, calc3, calc4 = st.columns(4)

    with calc1:
        if use_manual_population:
            population_size = st.number_input(
                "Official/manual population size",
                min_value=1,
                value=max(1, auto_population_size)
            )
        else:
            population_size = auto_population_size
            st.metric("Auto-counted eligible population", population_size)

    with calc2:
        margin_error = st.number_input(
            "Desired margin of error (%)",
            min_value=1.0,
            max_value=20.0,
            value=5.0,
            step=0.5
        )

    with calc3:
        confidence_level = st.selectbox("Confidence level", ["90%", "95%", "99%"], index=1)

    with calc4:
        response_rate = st.number_input(
            "Expected response rate (%)",
            min_value=1.0,
            max_value=100.0,
            value=40.0,
            step=1.0
        )

    required_completes = calculate_sample_size(population_size, margin_error, confidence_level)
    contacts_needed = int(round(required_completes / (response_rate / 100) + 0.5)) if required_completes > 0 else 0

    st.write(f"Required completed interviews: **{required_completes}**")
    st.write(f"Panelists to contact after response-rate adjustment: **{contacts_needed}**")
    st.write(f"Available filtered panelists: **{auto_population_size}**")

    if contacts_needed > auto_population_size:
        st.warning(
            "The calculated number of contacts is larger than the available filtered panel. "
            "The sample will be limited to available panelists unless filters are broadened."
        )

    override_sample = st.checkbox("Manually override contact sample size")

    if override_sample:
        sample_size = st.number_input(
            "Manual contact sample size",
            min_value=1,
            max_value=max(1, auto_population_size),
            value=min(max(1, contacts_needed), max(1, auto_population_size))
        )
    else:
        sample_size = min(contacts_needed, auto_population_size)

    if st.button("Generate Sample"):
        if auto_population_size == 0:
            st.error("No eligible panelists found for selected filters.")
        else:
            n = min(int(sample_size), auto_population_size)
            selected_sample = sample_pool.sample(n=n, random_state=42)

            if sampling_method != "Simple Random Sample":
                st.info(
                    f"{sampling_method} is currently using random selection as MVP behavior. "
                    "Full allocation rules can be added next."
                )

            st.success(f"Sample generated: {len(selected_sample)} panelists")

            export_cols = [
                "first_name", "last_name", "place_of_residence", "district",
                "city_town_village", "country_if_abroad", "constituency",
                "registered_ctv_area", "sex", "age", "age_group",
                "phone_whatsapp", "email", "verification_status"
            ]

            available_cols = [col for col in export_cols if col in selected_sample.columns]
            final_sample = selected_sample[available_cols]

            st.dataframe(final_sample, use_container_width=True)

            st.download_button(
                "Download Sample CSV",
                final_sample.to_csv(index=False).encode("utf-8"),
                "selected_sample.csv",
                "text/csv"
            )


elif page == "Admin Dashboard":
    st.header("Admin Dashboard")
    admin_password = st.sidebar.text_input("Admin password", type="password")
    if admin_password != "admin123":
        st.warning("Enter the admin password to access the dashboard.")
        st.stop()

    df = load_data()
    if df.empty:
        st.info("No panelists registered yet.")
        st.stop()

    st.subheader("Panel Overview")
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total Panelists", len(df))
    col2.metric("Verified", len(df[df["verification_status"].astype(str) == "Verified"]))
    col3.metric("Pending", len(df[df["verification_status"].astype(str) == "Pending"]))
    duplicate_name_dob_count_admin = 0
    if {"first_name", "last_name", "dob"}.issubset(df.columns):
        admin_duplicate_key = (
            df["first_name"].astype(str).str.lower().str.replace(r"\s+", " ", regex=True).str.strip() + "|" +
            df["last_name"].astype(str).str.lower().str.replace(r"\s+", " ", regex=True).str.strip() + "|" +
            df["dob"].astype(str).str.strip()
        )
        admin_duplicate_mask = admin_duplicate_key.duplicated(keep=False) & (
            admin_duplicate_key.str.replace("|", "", regex=False).str.strip() != ""
        )
        duplicate_name_dob_count_admin = int(admin_duplicate_mask.sum())

    marked_possible_duplicate_count = len(
        df[df["verification_status"].astype(str) == "Possible Duplicate"]
    )

    total_duplicate_warning_count = max(
        duplicate_name_dob_count_admin,
        marked_possible_duplicate_count
    )

    col4.metric("Duplicate Warnings", total_duplicate_warning_count)

    st.divider()
    st.subheader("Filter Panelists")
    f1, f2, f3, f4 = st.columns(4)
    with f1:
        filter_verification = st.multiselect("Verification Status", sorted(df["verification_status"].replace("", pd.NA).dropna().unique()))
    with f2:
        filter_district = st.multiselect("District", sorted(df["district"].replace("", pd.NA).dropna().unique()))
    with f3:
        filter_constituency = st.multiselect("Constituency", sorted(df["constituency"].replace("", pd.NA).dropna().unique()))
    with f4:
        filter_voting = st.multiselect("Voter Status", sorted(df["voting_status"].replace("", pd.NA).dropna().unique()))

    filtered = df.copy()
    if filter_verification:
        filtered = filtered[filtered["verification_status"].isin(filter_verification)]
    if filter_district:
        filtered = filtered[filtered["district"].isin(filter_district)]
    if filter_constituency:
        filtered = filtered[filtered["constituency"].isin(filter_constituency)]
    if filter_voting:
        filtered = filtered[filtered["voting_status"].isin(filter_voting)]

    st.write(f"Showing **{len(filtered)}** of **{len(df)}** panelists.")
    if {"first_name", "last_name", "dob"}.issubset(filtered.columns):
        filtered_duplicate_key = (
            filtered["first_name"].astype(str).str.lower().str.replace(r"\s+", " ", regex=True).str.strip() + "|" +
            filtered["last_name"].astype(str).str.lower().str.replace(r"\s+", " ", regex=True).str.strip() + "|" +
            filtered["dob"].astype(str).str.strip()
        )
        filtered["duplicate_name_dob_flag"] = filtered_duplicate_key.duplicated(keep=False)
    else:
        filtered["duplicate_name_dob_flag"] = False

    st.subheader("Duplicate Review Table")

    if {"first_name", "last_name", "dob"}.issubset(df.columns):
        full_duplicate_key = (
            df["first_name"].astype(str).str.lower().str.replace(r"\s+", " ", regex=True).str.strip() + "|" +
            df["last_name"].astype(str).str.lower().str.replace(r"\s+", " ", regex=True).str.strip() + "|" +
            df["dob"].astype(str).str.strip()
        )
        full_duplicate_mask = full_duplicate_key.duplicated(keep=False) & (
            full_duplicate_key.str.replace("|", "", regex=False).str.strip() != ""
        )

        duplicate_review = df[full_duplicate_mask].copy()

        if not duplicate_review.empty:
            duplicate_cols = [
                "first_name", "last_name", "dob", "age", "username",
                "email", "phone_whatsapp", "district", "city_town_village",
                "constituency", "verification_status", "status", "notes"
            ]
            duplicate_cols = [c for c in duplicate_cols if c in duplicate_review.columns]
            st.warning(f"{len(duplicate_review)} records need duplicate review.")
            st.dataframe(duplicate_review[duplicate_cols], use_container_width=True)
        else:
            st.success("No duplicate name + DOB records currently detected.")
    else:
        st.info("Duplicate review requires first name, last name, and DOB fields.")

    st.divider()

    display_df = filtered.drop(columns=["password_salt", "password_hash"], errors="ignore")
    st.dataframe(display_df, use_container_width=True)
    st.download_button("Download Filtered CSV", display_df.to_csv(index=False).encode("utf-8"), "filtered_panelists.csv", "text/csv")

    st.divider()
    st.subheader("Edit Panelist Record")
    df["display_name"] = df["first_name"].astype(str) + " " + df["last_name"].astype(str) + " | " + df["username"].astype(str) + " | " + df["registration_date"].astype(str)
    selected_display = st.selectbox("Select panelist", df["display_name"].tolist(), index=None, placeholder="Select a record to edit")

    if selected_display:
        idx = df.index[df["display_name"] == selected_display][0]
        rec = df.loc[idx]
        st.markdown("### Selected Record")
        st.write(f"**Name:** {rec.get('first_name', '')} {rec.get('last_name', '')}")
        st.write(f"**Username:** {rec.get('username', '')}")
        st.write(f"**Registration Date:** {rec.get('registration_date', '')}")
        edit1, edit2 = st.columns(2)
        with edit1:
            new_verification = st.selectbox("Verification Status", VERIFICATION_STATUS, index=safe_index(VERIFICATION_STATUS, rec.get("verification_status", "Pending")))
            new_status = st.selectbox("Panelist Status", PANELIST_STATUS, index=safe_index(PANELIST_STATUS, rec.get("status", "Active")))
            new_email = st.text_input("Email", value=clean_text(rec.get("email", "")))
            new_phone = st.text_input("Phone / WhatsApp", value=clean_text(rec.get("phone_whatsapp", "")))
            new_phone = format_phone_number(new_phone) if new_phone else ""
        with edit2:
            new_district = st.selectbox("District", [""] + BELIZE_DISTRICTS, index=safe_index([""] + BELIZE_DISTRICTS, rec.get("district", "")))
            city_options = [""]
            if new_district in CITY_TOWN_VILLAGE:
                city_options = [""] + CITY_TOWN_VILLAGE[new_district]
            new_city = st.selectbox("City / Town / Village", city_options, index=safe_index(city_options, rec.get("city_town_village", "")))
            new_constituency = st.selectbox("Constituency", [""] + CTV_LIST, index=safe_index([""] + CTV_LIST, rec.get("constituency", "")))
            new_notes = st.text_area("Admin Notes", value=clean_text(rec.get("notes", "")))

        if st.button("Save Record Changes"):
            edit_errors = []
            if new_email and not valid_email(new_email): edit_errors.append("Please enter a valid email address.")
            if new_phone:
                phone_digits = "".join(ch for ch in str(new_phone) if ch.isdigit())
                if len(phone_digits) != 10: edit_errors.append("Phone / WhatsApp number must contain exactly 10 digits.")
            if edit_errors:
                st.error("Please correct the following:")
                for error in edit_errors: st.write(f"- {error}")
            else:
                df = df.astype(str)
                df.loc[idx, "verification_status"] = new_verification
                df.loc[idx, "status"] = new_status
                df.loc[idx, "email"] = clean_text(new_email)
                df.loc[idx, "phone_whatsapp"] = clean_text(new_phone)
                df.loc[idx, "district"] = new_district
                df.loc[idx, "city_town_village"] = new_city
                df.loc[idx, "constituency"] = new_constituency
                df.loc[idx, "notes"] = clean_text(new_notes)
                df = df.drop(columns=["display_name"], errors="ignore")
                save_data(df)
                st.success("Record updated successfully.")
                st.rerun()





















elif page == "Distribution Engine":
    st.header("Distribution Engine")

    st.info(
        "Prepare outreach batches and invitation exports for survey assignments."
    )

    assignments_df = load_survey_assignments()
    members_df = load_sample_batch_members()

    if assignments_df.empty:
        st.warning("No survey assignments are available yet.")
    else:
        assignment_labels = (
            assignments_df["assignment_id"].astype(str) + " | " +
            assignments_df["survey_title"].astype(str)
        ).tolist()

        selected_assignment = st.selectbox(
            "Survey assignment",
            assignment_labels,
            index=None,
            placeholder="Select assignment"
        )

        if selected_assignment:
            assignment_id = selected_assignment.split(" | ")[0].strip()

            row = assignments_df[
                assignments_df["assignment_id"].astype(str) == assignment_id
            ].iloc[0]

            survey_title = row.get("survey_title", "")
            sample_batch_id = row.get("sample_batch_id", "")

            st.write(f"**Survey:** {survey_title}")
            st.write(f"**Sample batch:** {sample_batch_id}")

            batch_members = members_df[
                members_df["sample_batch_id"].astype(str) == str(sample_batch_id)
            ].copy() if not members_df.empty else pd.DataFrame()

            if batch_members.empty:
                st.warning("No persisted sample members were found.")
            else:
                mode = st.selectbox(
                    "Distribution mode",
                    DISTRIBUTION_MODES,
                    index=0
                )

                survey_link = st.text_input(
                    "Survey link",
                    placeholder="https://..."
                )

                message = st.text_area(
                    "Invitation message",
                    value=f"Hello, you are invited to participate in: {survey_title}"
                )

                if st.button("Prepare distribution export"):
                    distribution_id = generate_distribution_id()

                    export_cols = [
                        c for c in [
                            "first_name",
                            "last_name",
                            "phone_whatsapp",
                            "email",
                            "facebook",
                            "instagram",
                            "tiktok",
                            "district",
                            "constituency"
                        ]
                        if c in batch_members.columns
                    ]

                    export_df = batch_members[export_cols].copy()
                    export_df.insert(0, "distribution_id", distribution_id)
                    export_df.insert(1, "assignment_id", assignment_id)
                    export_df["distribution_mode"] = mode
                    export_df["survey_link"] = survey_link

                    existing = load_distribution_log()
                    updated = pd.concat([existing, export_df], ignore_index=True)
                    save_distribution_log(updated)

                    st.success(f"Distribution prepared: {distribution_id}")

                    st.code(message, language="text")

                    st.dataframe(export_df, use_container_width=True)

                    st.download_button(
                        "Download distribution contacts",
                        export_df.to_csv(index=False).encode("utf-8"),
                        f"{distribution_id}_distribution_contacts.csv",
                        "text/csv"
                    )
