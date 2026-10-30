// Departments the conversational agent can route to. Each maps onto an existing officer role,
// service unit and complaint category already used by the manual routing flow and the
// role-scoped staff queues (see staffController.buildStaffScopedQuery).
export const DEPARTMENTS = {
  FACULTY_OFFICER: {
    label: 'Faculty Administration',
    unit: 'Faculty Administration',
    category: 'FACULTY_RELATED',
    subcategory: 'AI_AUTO_ROUTED',
    locationType: 'FACULTY',
    handles:
      'Academic and faculty-building matters: lecture halls, classroom equipment/projectors, laboratories and lab computers, faculty washrooms/furniture, timetable or exam issues, lecturers, department queries.',
  },
  LIBRARY_OFFICER: {
    label: 'Library Services',
    unit: 'Library Services',
    category: 'LIBRARY',
    subcategory: 'AI_AUTO_ROUTED',
    locationType: 'LIBRARY',
    handles:
      'University library: book availability/damage, reading rooms and study desks, library AC/lighting/noise, digital library access, lending and fines, library staff conduct.',
  },
  HOSTEL_WARDEN: {
    label: 'Hostel Administration & Welfare',
    unit: 'Hostel Administration & Welfare',
    category: 'HOSTEL_ACCOMMODATION',
    subcategory: 'AI_AUTO_ROUTED',
    locationType: 'HOSTEL',
    handles:
      'Student hostels/dormitories (Hijra, Al-Aqsa, Bilal, Zahira, Fathima, Zainab): hostel rooms, beds, water, electricity, bathrooms, hostel internet, hostel cleaning, warden matters, residents disputes.',
  },
  CANTEEN_MANAGER: {
    label: 'Cafeteria Services',
    unit: 'Cafeteria Services',
    category: 'CANTEEN_FOOD',
    subcategory: 'AI_AUTO_ROUTED',
    locationType: 'CANTEEN',
    handles:
      'Campus canteens and cafeteria: food quality/hygiene/safety, stale or contaminated food, prices, portions, canteen cleanliness, canteen drinking water, canteen staff.',
  },
  MAINTENANCE_OFFICER: {
    label: 'Maintenance Division',
    unit: 'Maintenance Division',
    category: 'CAMPUS_MAINTENANCE',
    subcategory: 'AI_AUTO_ROUTED',
    locationType: 'MAINTENANCE',
    handles:
      'General campus infrastructure outside a specific faculty/hostel/library/canteen: roads, walkways, street lighting, drainage, outdoor areas, shared buildings, water/electrical faults in common campus areas.',
  },
  HEALTH_CENTRE_OFFICER: {
    label: 'Health Centre',
    unit: 'Health Centre',
    category: 'OTHER_SERVICES',
    subcategory: 'HEALTH_CENTRE_FACILITIES',
    locationType: 'GENERAL',
    handles:
      'University medical centre: medical facilities, medicines, first aid, health emergencies, health-centre service quality, sanitation or health hazards on campus.',
  },
  SECURITY_OFFICER: {
    label: 'Security Division',
    unit: 'Security Division',
    category: 'OTHER_SERVICES',
    subcategory: 'SECURITY_INFRASTRUCTURE',
    locationType: 'GENERAL',
    handles:
      'Campus safety and security: theft, harassment or threats, suspicious persons, unsafe areas, broken gates/CCTV/lighting for safety, ragging or physical safety incidents.',
  },
  STUDENT_WELFARE_OFFICER: {
    label: 'Student Support Services and Welfare',
    unit: 'Student Support Services and Welfare',
    category: 'OTHER_SERVICES',
    subcategory: 'AI_AUTO_ROUTED',
    locationType: 'GENERAL',
    handles:
      'Student welfare and support: financial hardship, scholarships/bursaries, counselling and mental wellbeing, discrimination, disability support, personal welfare concerns not covered by another department.',
  },
};

export const DEPARTMENT_KEYS = Object.keys(DEPARTMENTS);

export const HOSTEL_NAMES = ['Hijra', 'Al-Aqsa', 'Bilal', 'Zahira', 'Fathima', 'Zainab'];

export const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

export const departmentPromptList = () =>
  DEPARTMENT_KEYS.map((k) => `- ${k} (${DEPARTMENTS[k].label}): ${DEPARTMENTS[k].handles}`).join('\n');
