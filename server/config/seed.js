import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './db.js';
import User from '../models/User.js';

import Faculty from '../models/Faculty.js';
import Hostel from '../models/Hostel.js';
import ServiceUnit from '../models/ServiceUnit.js';
import ComplaintCategory from '../models/ComplaintCategory.js';
import RoutingRule from '../models/RoutingRule.js';
import Complaint from '../models/Complaint.js';
import IssueSupport from '../models/IssueSupport.js';
import Announcement from '../models/Announcement.js';
import Opportunity from '../models/Opportunity.js';
import Resource from '../models/Resource.js';
import Event from '../models/Event.js';
import Feedback from '../models/Feedback.js';
import Notification from '../models/Notification.js';
import KnowledgeDocument from '../models/KnowledgeDocument.js';
import KnowledgeChunk from '../models/KnowledgeChunk.js';
import SystemSetting from '../models/SystemSetting.js';
import { ingestKnowledgeDocument } from '../services/ragService.js';

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to MongoDB database successfully.');

    // 1. Clear existing collections
    await Promise.all([
      User.deleteMany(),
      Faculty.deleteMany(),
      Hostel.deleteMany(),
      ServiceUnit.deleteMany(),
      ComplaintCategory.deleteMany(),
      RoutingRule.deleteMany(),
      Complaint.deleteMany(),
      IssueSupport.deleteMany(),
      Announcement.deleteMany(),
      Opportunity.deleteMany(),
      Resource.deleteMany(),
      Event.deleteMany(),
      Feedback.deleteMany(),
      Notification.deleteMany(),
      KnowledgeDocument.deleteMany(),
      KnowledgeChunk.deleteMany(),
      SystemSetting.deleteMany(),
    ]);
    console.log('[Seed] Cleared existing collections.');

    // 2. Seed Faculties (SEUSL Official Reference)
    const faculties = await Faculty.create([
      {
        name: 'Faculty of Technology',
        code: 'FOT',
        campus: 'Main Campus, Oluvil',
        departments: [
          'Information & Communication Technology',
          'Biosystems Technology',
          'Mechanical Technology',
          'Electrical & Electronic Technology',
        ],
        buildings: ['Technology Complex Block A', 'Technology Complex Block B', 'IoT & Embedded Systems Lab'],
      },
      {
        name: 'Faculty of Engineering',
        code: 'FOE',
        campus: 'Main Campus, Oluvil',
        departments: [
          'Civil Engineering',
          'Electrical & Electronic Engineering',
          'Mechanical Engineering',
          'Computer Science & Engineering',
        ],
        buildings: ['Engineering Complex A', 'Heavy Structures Lab', 'Fluid Mechanics Lab'],
      },
      {
        name: 'Faculty of Applied Sciences',
        code: 'FAS',
        campus: 'Sammanthurai Campus',
        departments: [
          'Physical Sciences',
          'Biological Sciences',
          'Mathematical Sciences',
          'Chemical Sciences',
        ],
        buildings: ['Science Complex Sammanthurai', 'Physics Lab', 'Biotechnology Wing'],
      },
      {
        name: 'Faculty of Management and Commerce',
        code: 'FMC',
        campus: 'Main Campus, Oluvil',
        departments: ['Management', 'Accountancy & Finance', 'Marketing', 'Human Resource Management'],
        buildings: ['FMC Main Auditorium', 'Business Analytics Lab'],
      },
      {
        name: 'Faculty of Arts and Culture',
        code: 'FAC',
        campus: 'Main Campus, Oluvil',
        departments: ['Social Sciences', 'Languages', 'Geography', 'Political Science'],
        buildings: ['FAC Cultural Hall', 'Language Laboratory'],
      },
      {
        name: 'Faculty of Islamic Studies and Arabic Language',
        code: 'FIA',
        campus: 'Main Campus, Oluvil',
        departments: ['Islamic Studies', 'Arabic Language'],
        buildings: ['FIA Academic Complex', 'Islamic Research Library'],
      },
    ]);
    console.log(`[Seed] Seeded ${faculties.length} Faculties.`);

    // 3. Seed Hostels
    const hostels = await Hostel.create([
      {
        name: 'Hijra Hostel',
        gender: 'Male',
        campus: 'Main Campus, Oluvil',
        blocks: ['Block A', 'Block B', 'Block C'],
        totalRooms: 120,
      },
      {
        name: 'Al-Aqsa Hostel',
        gender: 'Male',
        campus: 'Main Campus, Oluvil',
        blocks: ['Block 1', 'Block 2'],
        totalRooms: 90,
      },
      {
        name: 'Bilal Hostel',
        gender: 'Male',
        campus: 'Sammanthurai Campus',
        blocks: ['Wing North', 'Wing South'],
        totalRooms: 80,
      },
      {
        name: 'Zahira Hostel',
        gender: 'Female',
        campus: 'Main Campus, Oluvil',
        blocks: ['Block 1', 'Block 2', 'Block 3'],
        totalRooms: 150,
      },
      {
        name: 'Fathima Hostel',
        gender: 'Female',
        campus: 'Main Campus, Oluvil',
        blocks: ['Block A', 'Block B'],
        totalRooms: 110,
      },
      {
        name: 'Zainab Hostel',
        gender: 'Female',
        campus: 'Sammanthurai Campus',
        blocks: ['Main Block'],
        totalRooms: 70,
      },
    ]);
    console.log(`[Seed] Seeded ${hostels.length} Hostels.`);

    // 4. Seed Service Units
    const serviceUnits = await ServiceUnit.create([
      {
        name: 'Maintenance Division',
        code: 'MAINT',
        description: 'University Works and Campus Infrastructure Maintenance (Civil, Electrical, Plumbing)',
        defaultStaffRole: 'MAINTENANCE_OFFICER',
        contactEmail: 'works@seu.ac.lk',
      },
      {
        name: 'ICT Centre',
        code: 'ICTC',
        description: 'Campus Network, Internet, Server Infrastructure, Lab Computers & Projectors',
        defaultStaffRole: 'OTHER_AUTHORIZED_SERVICE_OFFICER',
        contactEmail: 'ictc@seu.ac.lk',
      },
      {
        name: 'Library Services',
        code: 'LIB',
        description: 'SEUSL Central Library and Faculty Branch Library Services',
        defaultStaffRole: 'LIBRARY_OFFICER',
        contactEmail: 'library@seu.ac.lk',
      },
      {
        name: 'Cafeteria Services',
        code: 'CANT',
        description: 'Student & Staff Canteens, Dining Hygiene, and Food Facilities Administration',
        defaultStaffRole: 'CANTEEN_MANAGER',
        contactEmail: 'canteen@seu.ac.lk',
      },
      {
        name: 'Student Support Services and Welfare',
        code: 'SSSW',
        description: 'Accommodation Coordination, Student Welfare, Grievance Redressal, Financial Aid',
        defaultStaffRole: 'STUDENT_WELFARE_OFFICER',
        contactEmail: 'sssw@seu.ac.lk',
      },
      {
        name: 'Health Centre',
        code: 'HLTH',
        description: 'University Health and Medical Care Facilities',
        defaultStaffRole: 'HEALTH_CENTRE_OFFICER',
        contactEmail: 'health@seu.ac.lk',
      },
      {
        name: 'Security Division',
        code: 'SEC',
        description: 'Campus Safety, Gate Control, Building Security and Emergency Response',
        defaultStaffRole: 'SECURITY_OFFICER',
        contactEmail: 'security@seu.ac.lk',
      },
    ]);
    console.log(`[Seed] Seeded ${serviceUnits.length} Service Units.`);

    // 5. Seed Complaint Categories A through F
    const categories = await ComplaintCategory.create([
      {
        key: 'FACULTY_RELATED',
        displayName: 'A. Faculty-Related Issues',
        description: 'Lecture halls, labs, classroom equipment, presentation tools, faculty building facilities',
        locationType: 'FACULTY',
        displayOrder: 1,
        subcategories: [
          { name: 'LECTURE_HALL_FACILITIES', displayName: 'Lecture hall facilities' },
          { name: 'CLASSROOM_EQUIPMENT', displayName: 'Classroom equipment' },
          { name: 'LABORATORY_EQUIPMENT', displayName: 'Laboratory equipment' },
          { name: 'COMPUTERS_NETWORKING', displayName: 'Computers and networking' },
          { name: 'PROJECTORS_PRESENTATION', displayName: 'Projectors and presentation equipment' },
          { name: 'FACULTY_BUILDING_MAINTENANCE', displayName: 'Faculty building maintenance' },
          { name: 'FACULTY_WASHROOMS', displayName: 'Faculty washrooms' },
          { name: 'ELECTRICAL_PROBLEMS', displayName: 'Electrical problems' },
          { name: 'WATER_SUPPLY_PROBLEMS', displayName: 'Water supply problems' },
          { name: 'FURNITURE_INFRASTRUCTURE', displayName: 'Furniture and infrastructure' },
          { name: 'CLEANING_SANITATION', displayName: 'Cleaning and sanitation' },
        ],
      },
      {
        key: 'HOSTEL_ACCOMMODATION',
        displayName: 'B. Hostel and Accommodation',
        description: 'Residential hostels, room utilities, plumbing, electricity, furniture, common areas',
        locationType: 'HOSTEL',
        displayOrder: 2,
        subcategories: [
          { name: 'WATER_SUPPLY', displayName: 'Water supply' },
          { name: 'ELECTRICITY', displayName: 'Electricity' },
          { name: 'BATHROOM_PLUMBING', displayName: 'Bathroom and plumbing problems' },
          { name: 'ROOM_MAINTENANCE', displayName: 'Room maintenance' },
          { name: 'BEDS_FURNITURE', displayName: 'Beds and furniture' },
          { name: 'CLEANING', displayName: 'Cleaning' },
          { name: 'INTERNET_CONNECTIVITY', displayName: 'Internet connectivity' },
          { name: 'HOSTEL_COMMON_AREAS', displayName: 'Hostel common areas' },
          { name: 'SECURITY_CONCERNS', displayName: 'Security concerns' },
          { name: 'OTHER_ACCOMMODATION', displayName: 'Other accommodation problems' },
        ],
      },
      {
        key: 'LIBRARY',
        displayName: 'C. Library',
        description: 'Main university library and faculty branch reading rooms, digital resources, AC, lighting',
        locationType: 'LIBRARY',
        displayOrder: 3,
        subcategories: [
          { name: 'LIBRARY_FACILITIES', displayName: 'Library facilities' },
          { name: 'LIGHTING_ELECTRICITY', displayName: 'Lighting and electricity' },
          { name: 'AIR_CONDITIONING', displayName: 'Air conditioning' },
          { name: 'COMPUTERS', displayName: 'Computers' },
          { name: 'INTERNET_CONNECTIVITY', displayName: 'Internet connectivity' },
          { name: 'WASHROOMS', displayName: 'Washrooms' },
          { name: 'SEATING_FURNITURE', displayName: 'Seating and furniture' },
          { name: 'MAINTENANCE', displayName: 'Maintenance' },
          { name: 'CLEANLINESS', displayName: 'Cleanliness' },
        ],
      },
      {
        key: 'CANTEEN_FOOD',
        displayName: 'D. Canteen and Food Facilities',
        description: 'University cafeteria, food hygiene, dining hall maintenance, water and sanitation',
        locationType: 'CANTEEN',
        displayOrder: 4,
        subcategories: [
          { name: 'WATER_SUPPLY', displayName: 'Water supply' },
          { name: 'CLEANLINESS_SANITATION', displayName: 'Cleanliness and sanitation' },
          { name: 'EQUIPMENT_MAINTENANCE', displayName: 'Equipment maintenance' },
          { name: 'DINING_AREA_MAINTENANCE', displayName: 'Dining area maintenance' },
          { name: 'WASTE_DISPOSAL', displayName: 'Waste disposal' },
          { name: 'FOOD_QUALITY_CONCERNS', displayName: 'Food quality concerns' },
          { name: 'OTHER_CANTEEN_ISSUES', displayName: 'Other canteen facility issues' },
        ],
      },
      {
        key: 'CAMPUS_MAINTENANCE',
        displayName: 'E. Campus Maintenance',
        description: 'General campus roads, lighting, drainage, plumbing, electricity, landscaping',
        locationType: 'MAINTENANCE',
        displayOrder: 5,
        subcategories: [
          { name: 'ELECTRICAL_MAINTENANCE', displayName: 'Electrical maintenance' },
          { name: 'PLUMBING', displayName: 'Plumbing' },
          { name: 'BUILDING_REPAIRS', displayName: 'Building repairs' },
          { name: 'ROAD_PATHWAY_MAINTENANCE', displayName: 'Road and pathway maintenance' },
          { name: 'DRAINAGE', displayName: 'Drainage' },
          { name: 'WASTE_MANAGEMENT', displayName: 'Waste management' },
          { name: 'LANDSCAPING', displayName: 'Landscaping' },
          { name: 'LIGHTING', displayName: 'Lighting' },
          { name: 'WATER_SUPPLY', displayName: 'Water supply' },
          { name: 'FURNITURE_REPAIR', displayName: 'Furniture repair' },
        ],
      },
      {
        key: 'OTHER_SERVICES',
        displayName: 'F. Other University Services',
        description: 'Health centre, sports grounds, recreation, student welfare, security and ICT infrastructure',
        locationType: 'GENERAL',
        displayOrder: 6,
        subcategories: [
          { name: 'HEALTH_CENTRE_FACILITIES', displayName: 'Health centre facilities' },
          { name: 'SPORTS_FACILITIES', displayName: 'Sports facilities' },
          { name: 'RECREATIONAL_FACILITIES', displayName: 'Recreational facilities' },
          { name: 'STUDENT_COMMON_AREAS', displayName: 'Student common areas' },
          { name: 'INTERNET_ICT_FACILITIES', displayName: 'Internet and ICT facilities' },
          { name: 'SECURITY_INFRASTRUCTURE', displayName: 'Security and campus infrastructure' },
          { name: 'STUDENT_WELFARE', displayName: 'Student welfare' },
          { name: 'OTHER_APPROVED_SERVICES', displayName: 'Other approved university services' },
        ],
      },
    ]);
    console.log(`[Seed] Seeded ${categories.length} Complaint Categories.`);

    // 6. Seed Verified Routing Rules
    const routingRules = await RoutingRule.create([
      {
        name: 'Hostel Water Supply Emergency Rule',
        category: 'HOSTEL_ACCOMMODATION',
        subcategory: 'WATER_SUPPLY',
        responsibleUnit: 'Maintenance Division',
        permittedRoles: ['MAINTENANCE_OFFICER', 'HOSTEL_WARDEN', 'SUPER_ADMIN'],
        firstNotificationRole: 'HOSTEL_WARDEN',
        priorityRule: 'HIGH_URGENCY',
        escalationHours: 24,
        priority: 100,
      },
      {
        name: 'Hostel Electricity Failure Rule',
        category: 'HOSTEL_ACCOMMODATION',
        subcategory: 'ELECTRICITY',
        responsibleUnit: 'Maintenance Division',
        permittedRoles: ['MAINTENANCE_OFFICER', 'HOSTEL_WARDEN', 'SUPER_ADMIN'],
        firstNotificationRole: 'HOSTEL_WARDEN',
        priorityRule: 'HIGH_URGENCY',
        escalationHours: 24,
        priority: 95,
      },
      {
        name: 'Hostel General Accommodation Rule',
        category: 'HOSTEL_ACCOMMODATION',
        subcategory: 'ALL',
        responsibleUnit: 'Student Support Services and Welfare',
        permittedRoles: ['HOSTEL_WARDEN', 'HOSTEL_SUB_WARDEN', 'STUDENT_WELFARE_OFFICER'],
        firstNotificationRole: 'HOSTEL_WARDEN',
        priorityRule: 'DEFAULT',
        escalationHours: 48,
        priority: 50,
      },
      {
        name: 'Faculty Computing & Projector Rule',
        category: 'FACULTY_RELATED',
        subcategory: 'PROJECTORS_PRESENTATION',
        responsibleUnit: 'ICT Centre',
        permittedRoles: ['FACULTY_OFFICER', 'OTHER_AUTHORIZED_SERVICE_OFFICER', 'SUPER_ADMIN'],
        firstNotificationRole: 'FACULTY_OFFICER',
        priorityRule: 'DEFAULT',
        escalationHours: 48,
        priority: 80,
      },
      {
        name: 'Faculty Laboratory & Equipment Rule',
        category: 'FACULTY_RELATED',
        subcategory: 'LABORATORY_EQUIPMENT',
        responsibleUnit: 'Maintenance Division',
        permittedRoles: ['FACULTY_OFFICER', 'MAINTENANCE_OFFICER'],
        firstNotificationRole: 'FACULTY_OFFICER',
        priorityRule: 'DEFAULT',
        escalationHours: 48,
        priority: 80,
      },
      {
        name: 'Faculty General Facilities Rule',
        category: 'FACULTY_RELATED',
        subcategory: 'ALL',
        responsibleUnit: 'Maintenance Division',
        permittedRoles: ['FACULTY_OFFICER', 'MAINTENANCE_OFFICER'],
        firstNotificationRole: 'FACULTY_OFFICER',
        priorityRule: 'DEFAULT',
        escalationHours: 72,
        priority: 40,
      },
      {
        name: 'Library Facilities & Air Conditioning Rule',
        category: 'LIBRARY',
        subcategory: 'ALL',
        responsibleUnit: 'Library Services',
        permittedRoles: ['LIBRARY_OFFICER', 'MAINTENANCE_OFFICER', 'SUPER_ADMIN'],
        firstNotificationRole: 'LIBRARY_OFFICER',
        priorityRule: 'DEFAULT',
        escalationHours: 48,
        priority: 70,
      },
      {
        name: 'Canteen Food Safety & Quality Critical Rule',
        category: 'CANTEEN_FOOD',
        subcategory: 'FOOD_QUALITY_CONCERNS',
        responsibleUnit: 'Cafeteria Services',
        permittedRoles: ['CANTEEN_MANAGER', 'STUDENT_WELFARE_OFFICER', 'HEALTH_CENTRE_OFFICER'],
        firstNotificationRole: 'CANTEEN_MANAGER',
        priorityRule: 'CRITICAL_SAFETY',
        escalationHours: 12,
        priority: 100,
      },
      {
        name: 'Canteen Facilities & Maintenance Rule',
        category: 'CANTEEN_FOOD',
        subcategory: 'ALL',
        responsibleUnit: 'Cafeteria Services',
        permittedRoles: ['CANTEEN_MANAGER', 'MAINTENANCE_OFFICER'],
        firstNotificationRole: 'CANTEEN_MANAGER',
        priorityRule: 'DEFAULT',
        escalationHours: 48,
        priority: 50,
      },
      {
        name: 'Campus Works & Civil Maintenance Rule',
        category: 'CAMPUS_MAINTENANCE',
        subcategory: 'ALL',
        responsibleUnit: 'Maintenance Division',
        permittedRoles: ['MAINTENANCE_OFFICER', 'SUPER_ADMIN'],
        firstNotificationRole: 'MAINTENANCE_OFFICER',
        priorityRule: 'MAINTENANCE_SCHEDULE',
        escalationHours: 72,
        priority: 60,
      },
      {
        name: 'Health Centre Operations Rule',
        category: 'OTHER_SERVICES',
        subcategory: 'HEALTH_CENTRE_FACILITIES',
        responsibleUnit: 'Health Centre',
        permittedRoles: ['HEALTH_CENTRE_OFFICER', 'SUPER_ADMIN'],
        firstNotificationRole: 'HEALTH_CENTRE_OFFICER',
        priorityRule: 'HIGH_URGENCY',
        escalationHours: 24,
        priority: 90,
      },
      {
        name: 'Campus Safety & Security Incident Rule',
        category: 'OTHER_SERVICES',
        subcategory: 'SECURITY_INFRASTRUCTURE',
        responsibleUnit: 'Security Division',
        permittedRoles: ['SECURITY_OFFICER', 'SUPER_ADMIN'],
        firstNotificationRole: 'SECURITY_OFFICER',
        priorityRule: 'CRITICAL_SAFETY',
        escalationHours: 12,
        priority: 95,
      },
      {
        name: 'Student Support & Welfare Services Rule',
        category: 'OTHER_SERVICES',
        subcategory: 'STUDENT_WELFARE',
        responsibleUnit: 'Student Support Services and Welfare',
        permittedRoles: ['STUDENT_WELFARE_OFFICER', 'SUPER_ADMIN'],
        firstNotificationRole: 'STUDENT_WELFARE_OFFICER',
        priorityRule: 'DEFAULT',
        escalationHours: 48,
        priority: 85,
      },
    ]);
    console.log(`[Seed] Seeded ${routingRules.length} Verified Routing Rules.`);

    // 7. Seed Authenticated Users (Super Admin, Staff across units, Students)
    const users = await User.create([
      // Super Administrator
      {
        name: 'SEUSL Super Administrator',
        email: 'admin@seu.ac.lk',
        password: 'password123',
        role: 'SUPER_ADMIN',
        university: 'South Eastern University of Sri Lanka',
        faculty: 'Central University Administration',
        department: 'Office of the Vice Chancellor / ICTC',
        studentId: 'ADMIN/SEUSL/01',
        verificationStatus: 'verified',
        bio: 'Chief System Administrator for UniConnect SmartResolve Platform.',
      },
      // University Administrator
      {
        name: 'Senior Assistant Registrar',
        email: 'registrar@seu.ac.lk',
        password: 'password123',
        role: 'UNIVERSITY_ADMIN',
        university: 'South Eastern University of Sri Lanka',
        faculty: 'General Administration',
        department: 'Academic & Student Affairs',
        studentId: 'STAFF/SAR/02',
        verificationStatus: 'verified',
        bio: 'Overseeing student admissions, grievance escalation, and campus compliance.',
      },
      // Faculty Officers
      {
        name: 'Dr. M. A. Fathima',
        email: 'fo.tech@seu.ac.lk',
        password: 'password123',
        role: 'FACULTY_OFFICER',
        university: 'South Eastern University of Sri Lanka',
        faculty: 'Faculty of Technology',
        department: 'Information & Communication Technology',
        studentId: 'STAFF/FOT/01',
        assignedFaculties: ['Faculty of Technology'],
        verificationStatus: 'verified',
        bio: 'Faculty Student Grievance Representative for Faculty of Technology.',
      },
      {
        name: 'Eng. K. Sivakumar',
        email: 'fo.eng@seu.ac.lk',
        password: 'password123',
        role: 'FACULTY_OFFICER',
        university: 'South Eastern University of Sri Lanka',
        faculty: 'Faculty of Engineering',
        department: 'Civil Engineering',
        studentId: 'STAFF/FOE/02',
        assignedFaculties: ['Faculty of Engineering'],
        verificationStatus: 'verified',
        bio: 'Faculty Officer and Laboratory Coordinator for Faculty of Engineering.',
      },
      // Hostel Wardens & Sub-Wardens
      {
        name: 'Mr. A. R. Mohamed',
        email: 'warden.hijra@seu.ac.lk',
        password: 'password123',
        role: 'HOSTEL_WARDEN',
        university: 'South Eastern University of Sri Lanka',
        faculty: 'Student Support Services and Welfare',
        department: 'Male Accommodation Division',
        studentId: 'WARDEN/MALE/01',
        assignedHostels: ['Hijra Hostel', 'Al-Aqsa Hostel', 'Bilal Hostel'],
        verificationStatus: 'verified',
        bio: 'Senior Hostel Warden managing male residential halls and student welfare.',
      },
      {
        name: 'Mrs. S. Nilani',
        email: 'warden.zahira@seu.ac.lk',
        password: 'password123',
        role: 'HOSTEL_WARDEN',
        university: 'South Eastern University of Sri Lanka',
        faculty: 'Student Support Services and Welfare',
        department: 'Female Accommodation Division',
        studentId: 'WARDEN/FEMALE/01',
        assignedHostels: ['Zahira Hostel', 'Fathima Hostel', 'Zainab Hostel'],
        verificationStatus: 'verified',
        bio: 'Hostel Warden managing female student residential facilities.',
      },
      {
        name: 'Mr. T. Jazeel',
        email: 'subwarden@seu.ac.lk',
        password: 'password123',
        role: 'HOSTEL_SUB_WARDEN',
        university: 'South Eastern University of Sri Lanka',
        faculty: 'Student Support Services and Welfare',
        department: 'Hijra Residential Hall',
        studentId: 'SUBWARDEN/01',
        assignedHostels: ['Hijra Hostel'],
        verificationStatus: 'verified',
        bio: 'Sub-Warden assisting daily residential operations and student facility requests.',
      },
      // Maintenance Officer
      {
        name: 'Eng. R. M. Nazeer',
        email: 'maintenance@seu.ac.lk',
        password: 'password123',
        role: 'MAINTENANCE_OFFICER',
        university: 'South Eastern University of Sri Lanka',
        faculty: 'Works and Maintenance Department',
        department: 'Civil & Electrical Engineering Division',
        studentId: 'STAFF/MAINT/01',
        assignedServiceUnits: ['Maintenance Division'],
        verificationStatus: 'verified',
        bio: 'Works Engineer overseeing campus repairs, plumbing, electricity, and water systems.',
      },
      // Library Officer
      {
        name: 'Mrs. H. M. Fareeda',
        email: 'librarian@seu.ac.lk',
        password: 'password123',
        role: 'LIBRARY_OFFICER',
        university: 'South Eastern University of Sri Lanka',
        faculty: 'Library Services',
        department: 'Reader Services & Digital Information Division',
        studentId: 'STAFF/LIB/01',
        assignedServiceUnits: ['Library Services'],
        verificationStatus: 'verified',
        bio: 'Senior Assistant Librarian managing reader facilities and digital services.',
      },
      // Canteen Manager
      {
        name: 'Mr. P. B. Jayarathne',
        email: 'canteen@seu.ac.lk',
        password: 'password123',
        role: 'CANTEEN_MANAGER',
        university: 'South Eastern University of Sri Lanka',
        faculty: 'Student Support Services and Welfare',
        department: 'Cafeteria & Dining Services Committee',
        studentId: 'STAFF/CANT/01',
        assignedServiceUnits: ['Cafeteria Services'],
        verificationStatus: 'verified',
        bio: 'Cafeteria Supervisor monitoring meal quality, dining sanitation, and vendor hygiene.',
      },
      // Health Centre Officer
      {
        name: 'Dr. M. S. Rizwan',
        email: 'health@seu.ac.lk',
        password: 'password123',
        role: 'HEALTH_CENTRE_OFFICER',
        university: 'South Eastern University of Sri Lanka',
        faculty: 'University Health Centre',
        department: 'Medical Services',
        studentId: 'STAFF/MED/01',
        assignedServiceUnits: ['Health Centre'],
        verificationStatus: 'verified',
        bio: 'University Medical Officer managing student health services and clinic facilities.',
      },
      // Security Officer
      {
        name: 'Capt. N. H. Bandara',
        email: 'security@seu.ac.lk',
        password: 'password123',
        role: 'SECURITY_OFFICER',
        university: 'South Eastern University of Sri Lanka',
        faculty: 'Security Division',
        department: 'Campus Safety & Emergency Operations',
        studentId: 'STAFF/SEC/01',
        assignedServiceUnits: ['Security Division'],
        verificationStatus: 'verified',
        bio: 'Chief Security Officer in charge of campus checkpoints and safety surveillance.',
      },
      // Student Welfare Officer
      {
        name: 'Mr. I. M. Farook',
        email: 'welfare@seu.ac.lk',
        password: 'password123',
        role: 'STUDENT_WELFARE_OFFICER',
        university: 'South Eastern University of Sri Lanka',
        faculty: 'Student Support Services and Welfare',
        department: 'Student Affairs Division',
        studentId: 'STAFF/SSSW/01',
        assignedServiceUnits: ['Student Support Services and Welfare'],
        verificationStatus: 'verified',
        bio: 'Senior Student Counselor and Welfare Coordinator.',
      },
      // Students
      {
        name: 'Kasun Perera',
        email: 'kasun@seu.ac.lk',
        password: 'password123',
        role: 'STUDENT',
        university: 'South Eastern University of Sri Lanka',
        faculty: 'Faculty of Technology',
        department: 'Information & Communication Technology',
        degreeProgramme: 'Bachelor of Information and Communication Technology (Honours)',
        academicYear: '2022/2023',
        registrationNumber: 'TG/2022/1042',
        studentId: 'TG/2022/1042',
        contactNumber: '+94 77 123 4567',
        verificationStatus: 'verified',
        bio: '3rd year BICT undergraduate passionate about campus technology and student welfare.',
        interests: ['Hackathons', 'Cloud Computing', 'Web Development'],
      },
      {
        name: 'Sanduni Fernando',
        email: 'sanduni@seu.ac.lk',
        password: 'password123',
        role: 'STUDENT',
        university: 'South Eastern University of Sri Lanka',
        faculty: 'Faculty of Engineering',
        department: 'Civil Engineering',
        degreeProgramme: 'Bachelor of Science in Engineering (Honours)',
        academicYear: '2022/2023',
        registrationNumber: 'EG/2022/0891',
        studentId: 'EG/2022/0891',
        contactNumber: '+94 71 987 6543',
        verificationStatus: 'verified',
        bio: 'Civil Engineering student and Zahira residential hostel representative.',
        interests: ['Structures', 'Green Campus Initiatives', 'Robotics'],
      },
      {
        name: 'Ahamed Rizwan',
        email: 'newstudent@seu.ac.lk',
        password: 'password123',
        role: 'STUDENT',
        university: 'South Eastern University of Sri Lanka',
        faculty: 'Faculty of Applied Sciences',
        department: 'Physical Sciences',
        degreeProgramme: 'Bachelor of Science in Applied Sciences',
        academicYear: '2023/2024',
        registrationNumber: 'AS/2023/0412',
        studentId: 'AS/2023/0412',
        contactNumber: '+94 76 555 4321',
        verificationStatus: 'pending',
        bio: 'Newly registered student awaiting administrator record verification.',
      },
      // Legacy demo aliases so existing demo credentials still log in
      {
        name: 'Legacy Admin User',
        email: 'admin@uniconnect.edu',
        password: 'password123',
        role: 'SUPER_ADMIN',
        university: 'South Eastern University of Sri Lanka',
        faculty: 'Central University Administration',
        verificationStatus: 'verified',
      },
      {
        name: 'Legacy Staff User',
        email: 'dr.jayawardena@uniconnect.edu',
        password: 'password123',
        role: 'FACULTY_OFFICER',
        university: 'South Eastern University of Sri Lanka',
        faculty: 'Faculty of Technology',
        verificationStatus: 'verified',
      },
      {
        name: 'Legacy Student User',
        email: 'kasun@uniconnect.edu',
        password: 'password123',
        role: 'STUDENT',
        registrationNumber: 'TG/2022/1042',
        studentId: 'TG/2022/1042',
        university: 'South Eastern University of Sri Lanka',
        faculty: 'Faculty of Technology',
        verificationStatus: 'verified',
      },
    ]);
    console.log(`[Seed] Seeded ${users.length} Users with full SEUSL roles.`);

    const kasunUser = users.find((u) => u.email === 'kasun@seu.ac.lk');
    const sanduniUser = users.find((u) => u.email === 'sanduni@seu.ac.lk');
    const wardenUser = users.find((u) => u.email === 'warden.hijra@seu.ac.lk');
    const maintUser = users.find((u) => u.email === 'maintenance@seu.ac.lk');
    const adminUser = users.find((u) => u.email === 'admin@seu.ac.lk');

    // 8. Seed Verified Knowledge Documents into RAG
    const doc1 = await ingestKnowledgeDocument({
      title: 'SEUSL Student Handbook & Code of Conduct',
      sourceUrl: 'https://www.seu.ac.lk/cqa/publications/Student%20Handbook.pdf',
      sourceReference: 'SEUSL CQA Publications - Student Handbook 2024 Edition',
      documentType: 'HANDBOOK',
      departmentScope: 'UNIVERSITY_WIDE',
      uploadedBy: adminUser._id,
      rawText: `SOUTH EASTERN UNIVERSITY OF SRI LANKA - STUDENT HANDBOOK & REGULATIONS.
Section 1: General Code of Student Conduct.
All registered undergraduate students must carry their university student identity card at all times when on campus. Any damage caused to university property, laboratories, lecture halls, or equipment is strictly prohibited and subject to inquiry under university by-laws.

Section 2: Complaint and Grievance Redressal Procedures.
Students facing issues regarding academic facilities, hostel accommodation, or campus amenities should submit their grievances through the designated UniConnect SmartResolve portal.
Urgent concerns such as power outages or water supply disruptions in residential hostels are processed with high urgency and inspected within 24 hours by the Works and Maintenance Division.
Academic and classroom grievances should be reported under Faculty-Related Issues, which are acknowledged by the respective Faculty Student Grievance Officer.

Section 3: Disciplinary Inquiries.
The university maintains zero tolerance for ragging, harassment, or vandalism. Any incident of intimidation or ragging will result in immediate suspension and referral to law enforcement under the Prohibition of Ragging Act No. 20 of 1998.`,
    });

    const doc2 = await ingestKnowledgeDocument({
      title: 'SEUSL Student Support Services and Welfare (SSSW) Charter',
      sourceUrl: 'https://www.seu.ac.lk/sssw/about.php',
      sourceReference: 'SEUSL SSSW Official Division Portal',
      documentType: 'WELFARE_POLICY',
      departmentScope: 'Student Support Services and Welfare',
      uploadedBy: adminUser._id,
      rawText: `STUDENT SUPPORT SERVICES AND WELFARE (SSSW) - SOUTH EASTERN UNIVERSITY OF SRI LANKA.
The SSSW Division is the central administrative body responsible for student welfare, accommodation, cafeteria quality oversight, and grievance assistance.
1. Hostel Allocation and Regulations:
Hostel accommodation is provided for eligible 1st year and final year students based on distance and university allocation policies.
Quiet hours in all university hostels (Hijra, Al-Aqsa, Bilal, Zahira, Fathima, Zainab) start at 10:00 PM.
Students must not alter room electrical wiring or use high-load unauthorized appliances such as immersion heaters.
Plumbing and electrical defects must be logged immediately so the Hostel Warden can issue a maintenance request to the Works Department.

2. Student Counseling and Financial Aid:
Students facing mental stress, personal distress, or financial hardship can book confidential appointments with the University Student Counselors located at the SSSW Complex, Main Campus, Oluvil.`,
    });

    const doc3 = await ingestKnowledgeDocument({
      title: 'SEUSL Cafeteria & Canteen Hygiene Guidelines',
      sourceUrl: 'https://www.seu.ac.lk/universitylife/cafeteriaservices/index.php',
      sourceReference: 'SEUSL Campus Life Cafeteria Services Protocol',
      documentType: 'CANTEEN_POLICY',
      departmentScope: 'Cafeteria Services',
      uploadedBy: adminUser._id,
      rawText: `SEUSL CAFETERIA AND CANTEEN FOOD SAFETY AND HYGIENE PROTOCOLS.
1. Food Hygiene Standards:
All campus cafeterias and food vendors operating in the Main Campus (Oluvil) and Sammanthurai Campus must adhere strictly to Ministry of Health Food Safety regulations.
All food service handlers must wear clean aprons and hairnets. Potable filtered drinking water must be available to all students free of charge.

2. Complaint Mechanism for Food Concerns:
Any report concerning spoiled food, unhygienic conditions, or food poisoning is treated as CRITICAL_SAFETY priority.
Upon receipt of a complaint, the Canteen Manager and the University Public Health Inspector (PHI) will inspect the vendor premises within 12 hours.
Vendors found violating hygiene protocols will be issued formal warnings or immediate operational suspension.`,
    });

    const doc4 = await ingestKnowledgeDocument({
      title: 'SEUSL Works and Maintenance Service Charter',
      sourceUrl: 'https://www.seu.ac.lk/maintenance/charter.php',
      sourceReference: 'Works and Maintenance Department SOP 2024',
      documentType: 'MAINTENANCE_PROCEDURE',
      departmentScope: 'Maintenance Division',
      uploadedBy: adminUser._id,
      rawText: `SEUSL WORKS AND MAINTENANCE DEPARTMENT - SERVICE RESOLUTION STANDARDS.
Resolution Service Level Agreements (SLAs):
1. Category: Water Supply Disruptions in Hostels or Academic Buildings. Target acknowledgment: 2 hours. Target resolution: 24 hours.
2. Category: Electrical Power Cuts or Short Circuits. Target acknowledgment: 1 hour. Target resolution: 12-24 hours.
3. Category: Classroom Projector and Lab Equipment Repairs. Handled in collaboration with ICT Centre. Target resolution: 48-72 hours.
4. Category: General Building, Road, and Drainage Repairs. Target resolution: 3 to 7 working days depending on materials procurement.
Completion Proof Requirement:
Maintenance Officers must record verified work completion notes and, where appropriate, attach photo evidence before changing status to RESOLVED.`,
    });

    console.log(`[Seed] Ingested 4 official SEUSL RAG Knowledge Documents.`);

    // 9. Seed Sample Real Complaints Across Categories
    const sampleComplaints = await Complaint.create([
      {
        ticketNumber: 'SEUSL-2026-00101',
        title: 'Water Supply Disruption in 2nd Floor Washrooms - Hijra Hostel Block B',
        description: 'For the past 24 hours, there is no running water in the second-floor bathrooms of Hijra Hostel Block B. Over 60 resident students are unable to wash or attend morning lectures.',
        category: 'HOSTEL_ACCOMMODATION',
        subcategory: 'WATER_SUPPLY',
        locationDetails: {
          locationType: 'HOSTEL',
          hostelName: 'Hijra Hostel',
          building: 'Block B',
          roomOrArea: '2nd Floor Washroom Area',
        },
        location: 'Hijra Hostel, Block B, 2nd Floor',
        specificLocation: 'Washroom cubicles 1 to 4',
        faculty: 'Faculty of Technology',
        university: 'South Eastern University of Sri Lanka',
        priority: 'High',
        status: 'IN_PROGRESS',
        reporter: kasunUser._id,
        studentRegistrationNumber: 'TG/2022/1042',
        studentName: 'Kasun Perera',
        supportCount: 14,
        aiAnalysis: {
          summary: 'Student reports complete water outage affecting 60+ residents in Hijra Hostel Block B 2nd floor washrooms.',
          suggestedCategory: 'HOSTEL_ACCOMMODATION',
          suggestedSubcategory: 'WATER_SUPPLY',
          suggestedPriority: 'HIGH',
          suggestedResponsibleUnit: 'Maintenance Division',
          confidence: 0.94,
          requiresHumanReview: false,
          reason: 'Explicit report of hostel water outage affecting large residential block.',
          analyzedAt: new Date(Date.now() - 3600000 * 18),
        },
        routingDecision: {
          ruleApplied: 'Hostel Water Supply Emergency Rule',
          assignedUnit: 'Maintenance Division',
          assignedStaff: maintUser._id,
          assignedStaffName: 'Eng. R. M. Nazeer (MAINTENANCE_OFFICER)',
          assignedAt: new Date(Date.now() - 3600000 * 16),
          isVerifiedAssignment: true,
        },
        internalNotes: [
          {
            author: wardenUser._id,
            authorName: 'Mr. A. R. Mohamed',
            authorRole: 'HOSTEL_WARDEN',
            note: 'Verified with hostel sub-warden. Overhead pump valve in Block B is tripped. Dispatched plumbing team.',
            createdAt: new Date(Date.now() - 3600000 * 14),
          },
        ],
        officialResponses: [
          {
            user: maintUser._id,
            responderName: 'Eng. R. M. Nazeer',
            responderRole: 'Works Engineer',
            message: 'Our plumbing technician is replacing the main booster pump pressure valve. Water flow will be restored by 4:00 PM today.',
            isOfficial: true,
            createdAt: new Date(Date.now() - 3600000 * 5),
          },
        ],
        statusHistory: [
          {
            previousStatus: '',
            newStatus: 'SUBMITTED',
            changedBy: kasunUser._id,
            changedByName: 'Kasun Perera',
            note: 'Complaint logged via UniConnect SmartResolve portal.',
            timestamp: new Date(Date.now() - 3600000 * 18),
          },
          {
            previousStatus: 'SUBMITTED',
            newStatus: 'ASSIGNED',
            changedBy: adminUser._id,
            changedByName: 'Routing Engine',
            note: 'Matched rule "Hostel Water Supply Emergency Rule". Assigned to Maintenance Division.',
            timestamp: new Date(Date.now() - 3600000 * 16),
          },
          {
            previousStatus: 'ASSIGNED',
            newStatus: 'IN_PROGRESS',
            changedBy: maintUser._id,
            changedByName: 'Eng. R. M. Nazeer',
            note: 'Work crew arrived on site at Hijra Hostel.',
            timestamp: new Date(Date.now() - 3600000 * 6),
          },
        ],
      },
      {
        ticketNumber: 'SEUSL-2026-00102',
        title: 'Ceiling Projector HDMI Port Damaged - Technology Complex Hall W201',
        description: 'The ceiling multimedia projector in Hall W201 does not accept HDMI signal. The port connector appears physically bent, preventing lecturers from displaying course slides.',
        category: 'FACULTY_RELATED',
        subcategory: 'PROJECTORS_PRESENTATION',
        locationDetails: {
          locationType: 'FACULTY',
          facultyName: 'Faculty of Technology',
          building: 'Technology Complex Block A',
          roomOrArea: 'Lecture Hall W201',
        },
        location: 'Technology Complex Block A, Hall W201',
        specificLocation: 'Podium multimedia switch box',
        faculty: 'Faculty of Technology',
        university: 'South Eastern University of Sri Lanka',
        priority: 'Medium',
        status: 'ASSIGNED',
        reporter: kasunUser._id,
        studentRegistrationNumber: 'TG/2022/1042',
        studentName: 'Kasun Perera',
        supportCount: 8,
        aiAnalysis: {
          summary: 'Defective projector HDMI connection in Faculty of Technology Lecture Hall W201 disrupting lectures.',
          suggestedCategory: 'FACULTY_RELATED',
          suggestedSubcategory: 'PROJECTORS_PRESENTATION',
          suggestedPriority: 'MEDIUM',
          suggestedResponsibleUnit: 'ICT Centre',
          confidence: 0.91,
          requiresHumanReview: false,
          reason: 'Classroom multimedia presentation equipment fault in academic hall.',
          analyzedAt: new Date(Date.now() - 3600000 * 10),
        },
        routingDecision: {
          ruleApplied: 'Faculty Computing & Projector Rule',
          assignedUnit: 'ICT Centre',
          assignedStaff: adminUser._id,
          assignedStaffName: 'ICTC Technical Support Queue',
          assignedAt: new Date(Date.now() - 3600000 * 9),
          isVerifiedAssignment: true,
        },
        statusHistory: [
          {
            previousStatus: '',
            newStatus: 'SUBMITTED',
            changedBy: kasunUser._id,
            changedByName: 'Kasun Perera',
            note: 'Submitted with hall location specifics.',
            timestamp: new Date(Date.now() - 3600000 * 10),
          },
          {
            previousStatus: 'SUBMITTED',
            newStatus: 'ASSIGNED',
            changedBy: adminUser._id,
            changedByName: 'Routing Engine',
            note: 'Assigned to ICT Centre per verified faculty routing rules.',
            timestamp: new Date(Date.now() - 3600000 * 9),
          },
        ],
      },
      {
        ticketNumber: 'SEUSL-2026-00103',
        title: 'Air Conditioning Failure in Central Library 1st Floor Study Hall',
        description: 'Both split AC units in the first floor quiet reading area of the SEUSL Main Library have stopped cooling, causing excessive humidity that damages library reference materials.',
        category: 'LIBRARY',
        subcategory: 'AIR_CONDITIONING',
        locationDetails: {
          locationType: 'LIBRARY',
          building: 'Main Library Complex, Oluvil',
          roomOrArea: '1st Floor Periodicals Reading Room',
        },
        location: 'Main Library Complex, Oluvil',
        specificLocation: '1st Floor East Wing',
        faculty: 'Faculty of Engineering',
        university: 'South Eastern University of Sri Lanka',
        priority: 'Medium',
        status: 'RESOLVED',
        reporter: sanduniUser._id,
        studentRegistrationNumber: 'EG/2022/0891',
        studentName: 'Sanduni Fernando',
        supportCount: 22,
        aiAnalysis: {
          summary: 'Library study hall AC units failed, causing heat and humidity in periodicals section.',
          suggestedCategory: 'LIBRARY',
          suggestedSubcategory: 'AIR_CONDITIONING',
          suggestedPriority: 'MEDIUM',
          suggestedResponsibleUnit: 'Library Services',
          confidence: 0.95,
          requiresHumanReview: false,
          reason: 'Air conditioning failure in library reading facility.',
          analyzedAt: new Date(Date.now() - 3600000 * 48),
        },
        routingDecision: {
          ruleApplied: 'Library Facilities & Air Conditioning Rule',
          assignedUnit: 'Library Services',
          assignedStaff: maintUser._id,
          assignedStaffName: 'Eng. R. M. Nazeer (MAINTENANCE_OFFICER)',
          assignedAt: new Date(Date.now() - 3600000 * 46),
          isVerifiedAssignment: true,
        },
        resolutionDetails: {
          resolvedBy: maintUser._id,
          resolvedByName: 'Eng. R. M. Nazeer',
          details: 'Air conditioning compressor capacitor replaced and refrigerant gas refilled. Ambient temperature stabilized at 22°C.',
          resolvedAt: new Date(Date.now() - 3600000 * 12),
        },
        officialResponses: [
          {
            user: maintUser._id,
            responderName: 'Eng. R. M. Nazeer',
            responderRole: 'Works Engineer',
            message: 'Maintenance completed. AC units are operating at optimal cooling efficiency.',
            isOfficial: true,
            createdAt: new Date(Date.now() - 3600000 * 12),
          },
        ],
        statusHistory: [
          {
            previousStatus: '',
            newStatus: 'SUBMITTED',
            changedBy: sanduniUser._id,
            changedByName: 'Sanduni Fernando',
            note: 'Reported with high support count.',
            timestamp: new Date(Date.now() - 3600000 * 48),
          },
          {
            previousStatus: 'SUBMITTED',
            newStatus: 'IN_PROGRESS',
            changedBy: maintUser._id,
            changedByName: 'Eng. R. M. Nazeer',
            note: 'Technicians dispatched with AC spare parts.',
            timestamp: new Date(Date.now() - 3600000 * 24),
          },
          {
            previousStatus: 'IN_PROGRESS',
            newStatus: 'RESOLVED',
            changedBy: maintUser._id,
            changedByName: 'Eng. R. M. Nazeer',
            note: 'Compressor capacitor replaced and tested successfully.',
            timestamp: new Date(Date.now() - 3600000 * 12),
          },
        ],
      },
      {
        ticketNumber: 'SEUSL-2026-00104',
        title: 'Contaminated Drinking Water Odor - Main Student Cafeteria Cooler',
        description: 'The drinking water cooler located near the south entrance of the student canteen emits a foul chemical odor. Several students noticed discolored water today at lunch.',
        category: 'CANTEEN_FOOD',
        subcategory: 'WATER_SUPPLY',
        locationDetails: {
          locationType: 'CANTEEN',
          building: 'Main Campus Canteen Complex, Oluvil',
          roomOrArea: 'South Dining Hall Entryway',
        },
        location: 'Main Campus Canteen Complex, Oluvil',
        specificLocation: 'Stainless steel 200L cooler dispenser #2',
        faculty: 'Faculty of Technology',
        university: 'South Eastern University of Sri Lanka',
        priority: 'Critical',
        status: 'AWAITING_ADMIN_REVIEW',
        reporter: kasunUser._id,
        studentRegistrationNumber: 'TG/2022/1042',
        studentName: 'Kasun Perera',
        supportCount: 31,
        aiAnalysis: {
          summary: 'Critical food/water safety hazard: Canteen drinking water cooler dispensing foul odor and discolored water.',
          suggestedCategory: 'CANTEEN_FOOD',
          suggestedSubcategory: 'WATER_SUPPLY',
          suggestedPriority: 'CRITICAL',
          suggestedResponsibleUnit: 'Cafeteria Services',
          confidence: 0.96,
          requiresHumanReview: true,
          reason: 'Potential water contamination safety hazard impacting large student body.',
          analyzedAt: new Date(Date.now() - 3600000 * 2),
        },
        routingDecision: {
          ruleApplied: 'Canteen Food Safety & Quality Critical Rule',
          assignedUnit: 'Cafeteria Services',
          assignedStaff: null,
          assignedStaffName: 'Escalated to SSSW & Canteen Management Committee',
          assignedAt: new Date(Date.now() - 3600000 * 1),
          isVerifiedAssignment: true,
        },
        statusHistory: [
          {
            previousStatus: '',
            newStatus: 'SUBMITTED',
            changedBy: kasunUser._id,
            changedByName: 'Kasun Perera',
            note: 'High-severity water safety incident logged.',
            timestamp: new Date(Date.now() - 3600000 * 2),
          },
          {
            previousStatus: 'SUBMITTED',
            newStatus: 'AWAITING_ADMIN_REVIEW',
            changedBy: adminUser._id,
            changedByName: 'AI Safety Sentinel',
            note: 'Flagged for urgent administrative review due to critical health and contamination risk.',
            timestamp: new Date(Date.now() - 3600000 * 1),
          },
        ],
      },
    ]);
    console.log(`[Seed] Seeded ${sampleComplaints.length} Sample Verified Complaints.`);

    // 10. Seed System Settings
    await SystemSetting.create([
      {
        key: 'CHAT_MODEL',
        value: 'nvidia/nemotron-3-super-120b-a12b',
        description: 'Primary conversational and classification reasoning LLM via OpenRouter',
        category: 'AI',
        updatedBy: adminUser._id,
      },
      {
        key: 'EMBEDDING_MODEL',
        value: 'nvidia/nemotron-3.5-embed-1b:free',
        description: 'Semantic vector representation model for university knowledge RAG',
        category: 'AI',
        updatedBy: adminUser._id,
      },
      {
        key: 'AI_FEATURE_ENABLED',
        value: true,
        description: 'Enable automated classification and RAG assistant',
        category: 'AI',
        updatedBy: adminUser._id,
      },
      {
        key: 'DEFAULT_ESCALATION_HOURS',
        value: 48,
        description: 'Default elapsed hours before an unacknowledged complaint triggers overdue escalation',
        category: 'ROUTING',
        updatedBy: adminUser._id,
      },
      {
        key: 'STUDENT_REGISTRATION_VERIFICATION_REQUIRED',
        value: true,
        description: 'Whether new student registrations require administrative verification before filing high-impact petitions',
        category: 'REGISTRATION',
        updatedBy: adminUser._id,
      },
    ]);
    console.log('[Seed] Seeded System Settings.');

    // 11. Seed Announcements & Campus Modules
    await Announcement.create([
      {
        title: 'Semester End Examination Schedule - Academic Year 2022/2023',
        description: 'The timetable for the Faculty of Technology and Faculty of Engineering end-semester examinations is now published on the official faculty noticeboards and online portal.',
        category: 'Academic',
        targetAudience: 'All Students',
        publisher: adminUser._id,
        publisherName: 'Office of the Dean, Faculty of Technology',
        publisherRole: 'admin',
        sourceDepartment: 'Examination Branch, SEUSL',
        isVerified: true,
        priority: 'High',
      },
      {
        title: 'Temporary Water Maintenance Notice - Male Hostel Complex',
        description: 'Maintenance works on the central water sump at the Main Campus will take place on Saturday between 9:00 AM and 3:00 PM. Students are advised to conserve water.',
        category: 'Administrative',
        targetAudience: 'Hostel Students',
        publisher: adminUser._id,
        publisherName: 'Works and Maintenance Department',
        publisherRole: 'staff',
        sourceDepartment: 'Maintenance Division',
        isVerified: true,
        priority: 'Normal',
      },
    ]);

    await Opportunity.create([
      {
        title: 'National Inter-University Hackathon 2026',
        description: 'Compete with Sri Lankan university teams in smart campus IoT and AI software development. Cash prizes and internship fast-track with leading tech firms.',
        category: 'Hackathon',
        organizer: 'IEEE Student Branch - SEUSL',
        deadline: new Date(Date.now() + 86400000 * 20),
        registrationUrl: 'https://seu.ac.lk/hackathon2026',
        postedBy: adminUser._id,
      },
    ]);

    await Event.create([
      {
        title: 'SEUSL Annual Sports Championship 2026',
        description: 'Inter-faculty cricket, volleyball, and badminton tournament held at the university main grounds.',
        category: 'Sports',
        venue: 'SEUSL Main Sports Complex, Oluvil',
        organizer: 'Department of Physical Education',
        startDate: new Date(Date.now() + 86400000 * 14),
        endDate: new Date(Date.now() + 86400000 * 17),
        createdBy: adminUser._id,
      },
    ]);


    console.log('[Seed] Database successfully seeded with South Eastern University of Sri Lanka (SEUSL) production data!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    process.exit(1);
  }
};

seedDatabase();
