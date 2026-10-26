import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Issue from '../models/Issue.js';
import IssueSupport from '../models/IssueSupport.js';
import Announcement from '../models/Announcement.js';
import Opportunity from '../models/Opportunity.js';
import Resource from '../models/Resource.js';
import Event from '../models/Event.js';
import Feedback from '../models/Feedback.js';
import Notification from '../models/Notification.js';

dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uniconnect';
    await mongoose.connect(mongoUri);
    console.log(`[Seed] Connected to MongoDB: ${mongoUri}`);

    // Clean existing collections
    await Promise.all([
      User.deleteMany(),
      Issue.deleteMany(),
      IssueSupport.deleteMany(),
      Announcement.deleteMany(),
      Opportunity.deleteMany(),
      Resource.deleteMany(),
      Event.deleteMany(),
      Feedback.deleteMany(),
      Notification.deleteMany(),
    ]);
    console.log('[Seed] Cleared existing database records.');

    // 1. Seed Users
    const users = await User.create([
      {
        name: 'Kasun Perera',
        email: 'kasun@uniconnect.edu',
        password: 'password123',
        role: 'student',
        university: 'University of Colombo',
        faculty: 'Faculty of Computing',
        department: 'Computer Science & Software Engineering',
        studentId: 'SC/2023/1042',
        bio: '3rd year Software Engineering undergraduate passionate about open-source and campus improvement.',
        interests: ['Hackathons', 'Cloud Computing', 'Web Dev', 'Student Welfare'],
      },
      {
        name: 'Sanduni Fernando',
        email: 'sanduni@uniconnect.edu',
        password: 'password123',
        role: 'student',
        university: 'University of Colombo',
        faculty: 'Faculty of Science',
        department: 'Mathematics & Statistics',
        studentId: 'SC/2023/0891',
        bio: 'Statistics enthusiast, avid reader, and student representative.',
        interests: ['Data Science', 'Competitions', 'Academic Resources'],
      },
      {
        name: 'Dr. K. Jayawardena',
        email: 'dr.jayawardena@uniconnect.edu',
        password: 'password123',
        role: 'staff',
        university: 'University of Colombo',
        faculty: 'Faculty of Computing',
        department: 'Campus Infrastructure & Student Welfare Committee',
        studentId: 'STAFF/UOC/502',
        bio: 'Senior Lecturer and Director of Student Welfare and Campus Facilities Maintenance.',
      },
      {
        name: 'Malith Silva',
        email: 'malith@uniconnect.edu',
        password: 'password123',
        role: 'organizer',
        university: 'University of Colombo',
        faculty: 'Faculty of Computing',
        department: 'IEEE Student Branch & Rotaract Club',
        studentId: 'ORG/2024/012',
        bio: 'President of IEEE Student Branch. Organizing national hackathons and student tech summits.',
        interests: ['Hackathons', 'Tech Summits', 'Sports'],
      },
      {
        name: 'UniConnect Administrator',
        email: 'admin@uniconnect.edu',
        password: 'password123',
        role: 'admin',
        university: 'University of Colombo',
        faculty: 'Central University Administration',
        department: 'Information & Communications Technology Centre (ICTC)',
        studentId: 'ADMIN/001',
        bio: 'System Administrator for UniConnect Campus Intelligence Platform.',
      },
    ]);

    const [student1, student2, staffUser, organizerUser, adminUser] = users;
    console.log(`[Seed] Seeded ${users.length} users.`);

    // 2. Seed CampusCare Issues
    const issue1 = await Issue.create({
      title: 'Wi-Fi Connectivity Dropout in New Faculty Complex Level 2',
      description: 'The campus Wi-Fi AP "Eduroam-UOC" drops every 10-15 minutes on Level 2 study areas and lecture halls W201-W204. Around 150 students preparing for lab submissions are severely disrupted.',
      category: 'Internet and Wi-Fi',
      university: 'University of Colombo',
      faculty: 'Faculty of Computing',
      location: 'New Faculty Complex',
      specificLocation: 'Level 2, North Wing Study Corridor & Hall W202',
      priority: 'High',
      status: 'Under Review',
      reporter: student1._id,
      isAnonymous: false,
      supportCount: 14,
      statusHistory: [
        {
          previousStatus: '',
          newStatus: 'Reported',
          changedBy: student1._id,
          changedByName: student1.name,
          note: 'Initial report submitted by student representative.',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          previousStatus: 'Reported',
          newStatus: 'Under Review',
          changedBy: staffUser._id,
          changedByName: `${staffUser.name} (STAFF)`,
          note: 'Network engineering team has been notified. Access point router logs requested.',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      ],
      officialResponses: [
        {
          user: staffUser._id,
          responderName: staffUser.name,
          responderRole: 'Director of Campus Infrastructure',
          message: 'Our ICTC network technicians are dispatched today at 2:00 PM to replace the faulty Cisco POE switch in Rack 2B. Thank you for flagging.',
          isOfficial: true,
          createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
        },
      ],
    });

    const issue2 = await Issue.create({
      title: 'Broken Multimedia Projector in Lecture Hall 2 (W002)',
      description: 'The overhead digital projector has a burned-out lamp and severe purple discoloration. Lecturers have been unable to project course slides for CS2022 algorithms lecture.',
      category: 'Classroom Facilities',
      university: 'University of Colombo',
      faculty: 'Faculty of Computing',
      location: 'Main Academic Wing',
      specificLocation: 'Ground Floor, Lecture Hall 2 (W002)',
      priority: 'Medium',
      status: 'In Progress',
      reporter: student2._id,
      isAnonymous: false,
      supportCount: 8,
      statusHistory: [
        {
          previousStatus: '',
          newStatus: 'Reported',
          changedBy: student2._id,
          changedByName: student2.name,
          note: 'Reported during morning lecture period.',
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        },
        {
          previousStatus: 'Reported',
          newStatus: 'In Progress',
          changedBy: staffUser._id,
          changedByName: `${staffUser.name} (STAFF)`,
          note: 'Work order #WO-492 issued for optical unit replacement.',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ],
      officialResponses: [
        {
          user: staffUser._id,
          responderName: staffUser.name,
          responderRole: 'Department Staff Representative',
          message: 'Replacement 4K laser projector unit is being mounted by AV support today. Completed status expected by evening.',
          isOfficial: true,
          createdAt: new Date(Date.now() - 15 * 60 * 60 * 1000),
        },
      ],
    });

    const issue3 = await Issue.create({
      title: 'Low Water Pressure on 3rd Floor Male Hostel Block B',
      description: 'The overhead water pump is failing to supply sufficient pressure to bathrooms and washing sinks on the top floor of Block B. Students have had no running water during morning hours.',
      category: 'Water Supply',
      university: 'University of Colombo',
      faculty: 'Hostel & Residential Services',
      location: 'Student Hostels',
      specificLocation: 'Male Hostel Block B, 3rd Floor Washrooms',
      priority: 'High',
      status: 'In Progress',
      reporter: student1._id,
      isAnonymous: true,
      supportCount: 22,
      statusHistory: [
        {
          previousStatus: '',
          newStatus: 'Reported',
          changedBy: student1._id,
          changedByName: 'Anonymous Student',
          note: 'Submitted with high urgency.',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          previousStatus: 'Reported',
          newStatus: 'In Progress',
          changedBy: adminUser._id,
          changedByName: `${adminUser.name} (ADMIN)`,
          note: 'Plumbing contractor dispatched to replace rooftop booster pressure valve.',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        },
      ],
    });

    const issue4 = await Issue.create({
      title: 'Flickering Fluorescent Lighting in Main Library Quiet Zone',
      description: 'Two lighting ballasts above study tables 14-18 produce a constant high-pitched buzzing and rapid strobe flickering, creating eye strain for students studying for finals.',
      category: 'Electricity',
      university: 'University of Colombo',
      faculty: 'Central Library',
      location: 'Main University Library',
      specificLocation: 'Level 1, Silent Study Hall Tables 14-18',
      priority: 'Low',
      status: 'Resolved',
      reporter: student2._id,
      isAnonymous: false,
      supportCount: 5,
      statusHistory: [
        {
          previousStatus: '',
          newStatus: 'Reported',
          changedBy: student2._id,
          changedByName: student2.name,
          note: 'Reported.',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        {
          previousStatus: 'Reported',
          newStatus: 'In Progress',
          changedBy: staffUser._id,
          changedByName: `${staffUser.name} (STAFF)`,
          note: 'Electrical team assigned to replace tubes.',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          previousStatus: 'In Progress',
          newStatus: 'Resolved',
          changedBy: staffUser._id,
          changedByName: `${staffUser.name} (STAFF)`,
          note: 'Replaced with energy-efficient 4000K daylight LED tubes. Verified operational.',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      ],
      officialResponses: [
        {
          user: staffUser._id,
          responderName: staffUser.name,
          responderRole: 'Campus Maintenance Office',
          message: 'Both ballasts upgraded to flicker-free LED fixtures on Thursday morning. Issue resolved.',
          isOfficial: true,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      ],
    });

    const issue5 = await Issue.create({
      title: 'Damaged Wheelchair Ramp Handrail near Science Auditorium',
      description: 'The support weld on the left-side handrail of the disabled access ramp has snapped, posing a dangerous safety hazard for students with mobility impairments.',
      category: 'Safety and Accessibility',
      university: 'University of Colombo',
      faculty: 'Faculty of Science',
      location: 'Science Complex',
      specificLocation: 'Auditorium South Entrance Ramp',
      priority: 'Critical',
      status: 'Under Review',
      reporter: student1._id,
      isAnonymous: false,
      supportCount: 31,
      statusHistory: [
        {
          previousStatus: '',
          newStatus: 'Reported',
          changedBy: student1._id,
          changedByName: student1.name,
          note: 'Safety critical escalation.',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          previousStatus: 'Reported',
          newStatus: 'Under Review',
          changedBy: staffUser._id,
          changedByName: `${staffUser.name} (STAFF)`,
          note: 'Safety warning cones placed immediately. Welding workshop contacted for reinforcement.',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        },
      ],
    });

    // Create supports
    await IssueSupport.create([
      { issue: issue1._id, user: student1._id },
      { issue: issue1._id, user: student2._id },
      { issue: issue2._id, user: student1._id },
      { issue: issue5._id, user: student1._id },
      { issue: issue5._id, user: student2._id },
    ]);
    console.log('[Seed] Seeded CampusCare issues & support relations.');

    // 3. Seed UniPulse Announcements
    await Announcement.create([
      {
        title: 'Semester II Final Examination Timetable Released (2025/2026 Academic Year)',
        description: 'The Faculty Board has approved and published the official schedule for Semester II examinations. All candidates are advised to verify their admission cards, venue seating allocations, and examination regulations via the student intranet.',
        category: 'Examinations',
        publisher: staffUser._id,
        publisherName: 'Dr. K. Jayawardena',
        publisherRole: 'Dean\'s Representative',
        sourceDepartment: 'Examination & Student Affairs Branch',
        isVerified: true,
        priority: 'Urgent',
        targetAudience: 'All Undergraduate Students',
        sourceUrl: 'https://cmb.ac.lk/examination-notices-2026',
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        savedBy: [student1._id],
      },
      {
        title: 'Faculty IT Infrastructure Maintenance Downtime This Saturday',
        description: 'The Information & Communications Technology Centre (ICTC) will be carrying out scheduled core network router maintenance and database backups on Saturday from 11:00 PM to 4:00 AM. Access to LMS and portal services will experience temporary interruption.',
        category: 'Administrative',
        publisher: adminUser._id,
        publisherName: 'UniConnect Administrator',
        publisherRole: 'Campus ICTC',
        sourceDepartment: 'ICTC Campus Operations',
        isVerified: true,
        priority: 'High',
        targetAudience: 'All University Community',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Applications Open: Student Innovation & Entrepreneurship Fund 2026',
        description: 'Undergraduate student teams with technology or social impact startup ideas can apply for seed grants up to LKR 500,000 supported by the University Business Incubation Cell.',
        category: 'Workshop & Events',
        publisher: organizerUser._id,
        publisherName: 'Malith Silva',
        publisherRole: 'IEEE Student Branch',
        sourceDepartment: 'Centre for Innovation and Entrepreneurship',
        isVerified: true,
        priority: 'Normal',
        targetAudience: 'Innovators & Entrepreneurs',
        sourceUrl: 'https://innovation.cmb.ac.lk/apply-fund',
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ]);
    console.log('[Seed] Seeded UniPulse announcements.');

    // 4. Seed OpportunityHub Opportunities
    await Opportunity.create([
      {
        title: 'National Datathon 2026 - Sri Lanka Data Science Cup',
        description: 'A 48-hour competitive datathon focused on predictive modeling for public transit systems and flood management using real-world satellite and IoT datasets.',
        category: 'Datathon',
        organizer: 'Data Science Society & Industry Partners',
        eligibility: 'All undergraduate university students in Sri Lanka (Teams of 3-4)',
        skills: ['Python', 'Pandas', 'Machine Learning', 'Data Visualization', 'SQL'],
        locationType: 'Hybrid',
        deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        eventDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        registrationUrl: 'https://datasciencecup.lk/register',
        verificationStatus: 'Verified',
        status: 'Active',
        postedBy: organizerUser._id,
        savedBy: [student1._id, student2._id],
      },
      {
        title: 'Software Engineering Intern - Cloud & Distributed Systems',
        description: '6-month paid internship working on high-throughput backend services, Kubernetes deployments, and modern Node.js/Go microservices at a premier tech firm.',
        category: 'Internship',
        organizer: 'Virtusa Labs & Dialog Axiata Innovation',
        eligibility: '3rd or 4th Year Computer Science / Software Engineering undergraduates',
        skills: ['React', 'Node.js', 'Docker', 'RESTful APIs', 'Git'],
        locationType: 'Physical',
        deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        registrationUrl: 'https://careers.techcorp.lk/intern-cloud',
        verificationStatus: 'Verified',
        status: 'Active',
        postedBy: staffUser._id,
        savedBy: [student1._id],
      },
      {
        title: 'Google Cloud & Generative AI Hands-On Bootcamp',
        description: 'Comprehensive 4-week weekend workshop series covering Vertex AI, prompt engineering, vector search, and cloud deployments with official completion badges.',
        category: 'Workshop',
        organizer: 'Google Developer Student Clubs (GDSC)',
        eligibility: 'Open to all STEM students with basic programming experience',
        skills: ['Python', 'Google Cloud', 'Generative AI', 'Embeddings'],
        locationType: 'Remote',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        registrationUrl: 'https://gdsc.community.dev/events/bootcamp2026',
        verificationStatus: 'Verified',
        status: 'Active',
        postedBy: organizerUser._id,
      },
      {
        title: 'Undergraduate Research Grant in Clean Energy & IoT',
        description: 'Annual research stipend and equipment grant funded by the National Science Foundation for undergraduates pursuing green campus technology theses.',
        category: 'Research',
        organizer: 'National Science Foundation (NSF)',
        eligibility: 'Final year research students with GPA >= 3.3',
        skills: ['Research Writing', 'IoT', 'Embedded Systems', 'Data Analysis'],
        locationType: 'On-Campus',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        registrationUrl: 'https://nsf.gov.lk/grants/undergrad-clean-energy',
        verificationStatus: 'Verified',
        status: 'Active',
        postedBy: staffUser._id,
      },
    ]);
    console.log('[Seed] Seeded OpportunityHub records.');

    // 5. Seed ResourceShare Resources
    await Resource.create([
      {
        title: 'Data Structures & Algorithms - Complete Comprehensive Revision Guide',
        description: 'Curated 65-page study guide covering Trees, Graphs, Dijkstra, Dynamic Programming, and Big-O Complexity with annotated diagrammatic examples.',
        subject: 'SCS 2201 - Data Structures & Algorithms',
        faculty: 'Faculty of Computing',
        department: 'Computer Science',
        semester: 'Year 2 Sem 1',
        resourceType: 'Revision Guide',
        sourceUrl: 'https://drive.google.com/file/d/sample-dsa-guide',
        tags: ['DSA', 'Algorithms', 'Graphs', 'Dynamic Programming', 'Exam Prep'],
        contributor: student1._id,
        contributorName: 'Kasun Perera',
        moderationStatus: 'Approved',
        savedBy: [student2._id],
      },
      {
        title: 'Database Management Systems (DBMS) SQL & Normalization Cheatsheet',
        description: 'Quick reference sheet containing 1NF-BCNF decomposition rules, relational algebra formulas, index tuning tips, and common SQL query patterns.',
        subject: 'SCS 2204 - Database Management Systems',
        faculty: 'Faculty of Computing',
        department: 'Information Systems',
        semester: 'Year 2 Sem 2',
        resourceType: 'Lecture Notes',
        sourceUrl: 'https://github.com/uoc-cs/dbms-revision-kit',
        tags: ['SQL', 'Databases', 'Normalization', 'Relational Algebra'],
        contributor: student2._id,
        contributorName: 'Sanduni Fernando',
        moderationStatus: 'Approved',
      },
      {
        title: 'Operating Systems Past Paper Solutions & Memory Management Notes',
        description: 'Solved questions for virtual memory, paging, process synchronization, Peterson algorithm, and semaphore implementation with source code snippets.',
        subject: 'SCS 2203 - Operating Systems',
        faculty: 'Faculty of Computing',
        department: 'Computer Science',
        semester: 'Year 2 Sem 1',
        resourceType: 'Practice Questions / Past Papers',
        sourceUrl: 'https://drive.google.com/file/d/sample-os-solutions',
        tags: ['Operating Systems', 'Memory Management', 'Paging', 'Semaphores'],
        contributor: staffUser._id,
        contributorName: 'Dr. K. Jayawardena',
        moderationStatus: 'Approved',
      },
    ]);
    console.log('[Seed] Seeded ResourceShare materials.');

    // 6. Seed CampusArena Events
    await Event.create([
      {
        title: 'Inter-Faculty Sports Championship 2026 - Cricket & Badminton Finals',
        description: 'The thrilling grand finals of the annual inter-faculty tournament featuring Computing vs Engineering in Cricket and Science vs Arts in Badminton.',
        category: 'Sports',
        organizer: 'Department of Physical Education & Sports Council',
        venue: 'University Main Gymnasium & Grounds',
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        registrationUrl: 'https://sports.cmb.ac.lk/inter-faculty-2026',
        attendeeCount: 142,
        savedBy: [student1._id, student2._id],
        createdBy: organizerUser._id,
      },
      {
        title: 'University Annual Career Fair & Tech Expo 2026',
        description: 'Over 40 leading technology, finance, and engineering organizations participating for on-campus interviews, resume clinics, and technology exhibitions.',
        category: 'Career Fair',
        organizer: 'Career Guidance Unit (CGU)',
        venue: 'New Arts Theatre & Quadrangle',
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        registrationUrl: 'https://cgu.cmb.ac.lk/expo2026',
        attendeeCount: 380,
        savedBy: [student1._id],
        createdBy: staffUser._id,
      },
      {
        title: 'Open Source Festival & Git Workshop',
        description: 'Interactive workshop teaching students how to contribute to international open-source software, set up CI/CD workflows, and build public portfolios.',
        category: 'Workshop',
        organizer: 'IEEE Computer Society & FOSS Club',
        venue: 'Computing Faculty Lab 4 & Online Stream',
        startDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        registrationUrl: 'https://foss.cmb.ac.lk/workshop-git',
        attendeeCount: 89,
        createdBy: organizerUser._id,
      },
    ]);
    console.log('[Seed] Seeded CampusArena events.');

    // 7. Seed StudentVoice Suggestions
    await Feedback.create([
      {
        title: 'Extend Science Library Air-Conditioned Study Hours during Examination Weeks',
        description: 'Currently the air-conditioned reading room closes at 6:00 PM. Extending operations until 9:30 PM for the 3 weeks preceding examinations would provide students living in warm hostel rooms a quiet, comfortable environment to study.',
        category: 'Library Services',
        author: student1._id,
        isAnonymous: false,
        campusLocation: 'Science Library Building',
        status: 'Accepted',
        supportCount: 46,
        supportedUsers: [student1._id, student2._id],
        administrativeResponse: {
          respondedBy: staffUser._id,
          responderName: 'Dr. K. Jayawardena (STAFF)',
          responseText: 'The Library Committee reviewed this recommendation and approved extended hours from 8:00 AM to 9:30 PM beginning next Monday for the exam period. Additional security staff have been scheduled.',
          respondedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      },
      {
        title: 'Introduce University Shuttle Bus Live Location Tracking',
        description: 'The inter-campus shuttle between the hostels and faculty complexes often has unpredictable arrival times due to city traffic. A simple mobile GPS tracking link or status board would save students from waiting unnecessarily in the rain.',
        category: 'Transportation',
        author: student2._id,
        isAnonymous: false,
        campusLocation: 'Hostel Shuttle Route',
        status: 'Under Review',
        supportCount: 68,
        supportedUsers: [student1._id, student2._id],
      },
      {
        title: 'Install Filtered Water Dispenser Stations on Level 3 and 4 of West Building',
        description: 'Students attending back-to-back 3-hour labs on the upper floors currently have to walk down 4 flights of stairs to refill water bottles, creating hall congestion and lost lab time.',
        category: 'Student Welfare',
        author: student1._id,
        isAnonymous: true,
        campusLocation: 'West Academic Building',
        status: 'Implemented',
        supportCount: 39,
        supportedUsers: [student1._id],
        administrativeResponse: {
          respondedBy: staffUser._id,
          responderName: 'Dr. K. Jayawardena (STAFF)',
          responseText: 'Two stainless steel chilled and filtered drinking water dispensers have been procured and plumbed into the 3rd and 4th floor corridors. Now fully operational.',
          respondedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        },
      },
    ]);
    console.log('[Seed] Seeded StudentVoice suggestions.');

    // 8. Seed Notifications for student
    await Notification.create([
      {
        recipient: student1._id,
        type: 'issue_status',
        title: 'Issue Status Updated: Under Review',
        message: 'Your report "Wi-Fi Connectivity Dropout in New Faculty Complex Level 2" is now Under Review by ICTC technicians.',
        link: `/campuscare/${issue1._id}`,
        isRead: false,
      },
      {
        recipient: student1._id,
        type: 'issue_response',
        title: 'Official Response Received',
        message: 'Dr. K. Jayawardena commented on your report: "Our ICTC network technicians are dispatched today..."',
        link: `/campuscare/${issue1._id}`,
        isRead: false,
      },
      {
        recipient: student1._id,
        type: 'announcement',
        title: 'Urgent Examination Schedule Published',
        message: 'Semester II examination timetable has been uploaded by the Examination Branch.',
        link: '/unipulse',
        isRead: true,
      },
      {
        recipient: student1._id,
        type: 'feedback_update',
        title: 'StudentVoice Suggestion Accepted!',
        message: 'Your suggestion "Extend Science Library Air-Conditioned Study Hours" was approved by the Library Committee.',
        link: '/studentvoice',
        isRead: false,
      },
    ]);
    console.log('[Seed] Seeded notifications.');

    console.log('----------------------------------------------------');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Demo Credentials:');
    console.log('  Student:    kasun@uniconnect.edu / password123');
    console.log('  Staff:      dr.jayawardena@uniconnect.edu / password123');
    console.log('  Organizer:  rotaract@uniconnect.edu / password123');
    console.log('  Admin:      admin@uniconnect.edu / password123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
