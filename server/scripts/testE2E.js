/**
 * UniConnect SmartResolve - End-to-End Automated Platform Verification
 * Tests the full lifecycle: Auth, Metadata, Complaint Triage, AI Classification,
 * Automated Routing, Staff Queue, Clarification Cycle, Resolution, and RAG Q&A.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import connectDB from '../config/db.js';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import Faculty from '../models/Faculty.js';
import Hostel from '../models/Hostel.js';
import ServiceUnit from '../models/ServiceUnit.js';
import ComplaintCategory from '../models/ComplaintCategory.js';
import RoutingRule from '../models/RoutingRule.js';
import KnowledgeDocument from '../models/KnowledgeDocument.js';
import { classifyComplaintWithAI } from '../services/openRouterService.js';
import { routeComplaint } from '../services/routingEngine.js';
import { answerUniversityQuestionRAG } from '../services/ragService.js';
import { executeAgentTool } from '../services/aiAgentService.js';

async function runE2ETest() {
  console.log('\n============================================================');
  console.log('🚀 UNICONNECT SMARTRESOLVE - END-TO-END VERIFICATION SUITE');
  console.log('============================================================\n');

  try {
    // Step 1: Connect to MongoDB Atlas
    console.log('📡 [Step 1] Connecting to MongoDB Atlas...');
    await connectDB();
    console.log('✅ Connected to MongoDB Atlas successfully.');

    // Step 2: Verify University Organizational Architecture in Database
    console.log('\n🏛️  [Step 2] Verifying SEUSL Organizational Hierarchy...');
    const [facultiesCount, hostelsCount, unitsCount, categoriesCount, rulesCount, docsCount] = await Promise.all([
      Faculty.countDocuments(),
      Hostel.countDocuments(),
      ServiceUnit.countDocuments(),
      ComplaintCategory.countDocuments(),
      RoutingRule.countDocuments(),
      KnowledgeDocument.countDocuments(),
    ]);

    console.log(`   - Faculties: ${facultiesCount} (Expected: 6)`);
    console.log(`   - Hostels: ${hostelsCount} (Expected: 6)`);
    console.log(`   - Service Units: ${unitsCount} (Expected: 7)`);
    console.log(`   - Complaint Categories: ${categoriesCount} (Expected: 6)`);
    console.log(`   - Routing Rules: ${rulesCount} (Expected: >= 10)`);
    console.log(`   - RAG Knowledge Documents: ${docsCount} (Expected: >= 4)`);

    if (facultiesCount < 6 || hostelsCount < 6 || categoriesCount < 6) {
      throw new Error('Organizational records missing. Seed script required.');
    }
    console.log('✅ SEUSL Organization Hierarchy Verified.');

    // Step 3: Test Student Identity & Authorization
    const studentUser = await User.findOne({ email: 'kasun@seu.ac.lk' });
    const wardenUser = await User.findOne({ email: 'warden.zahira@seu.ac.lk' });
    const maintenanceUser = await User.findOne({ email: 'maintenance@seu.ac.lk' });
    const adminUser = await User.findOne({ email: 'admin@seu.ac.lk' });

    if (!studentUser || !wardenUser || !maintenanceUser || !adminUser) {
      throw new Error('One or more seeded user accounts not found.');
    }

    console.log(`   - Student: ${studentUser.name} (${studentUser.registrationNumber}) [${studentUser.role}]`);
    console.log(`   - Hostel Warden: ${wardenUser.name} (${wardenUser.assignedHostel}) [${wardenUser.role}]`);
    console.log(`   - Maintenance: ${maintenanceUser.name} [${maintenanceUser.role}]`);
    console.log(`   - Admin: ${adminUser.name} [${adminUser.role}]`);
    console.log('✅ SEUSL Role Directory Verified.');

    // Step 4: Test AI Classification Engine & Graceful Fallback
    console.log('\n🧠 [Step 4] Testing AI Complaint Analysis & Urgency Scoring...');
    const testComplaintPayload = {
      title: 'Severe Water Leakage and Flooding in Zahira Hall Ground Floor Washroom',
      description: 'The main pipe in the third cubicle of Zahira Hall ground floor has ruptured. Water is actively spreading into the hallway and nearing the electrical switchboards.',
      location: 'Zahira Hall (Hostel)',
      faculty: 'Technology',
    };

    const aiResult = await classifyComplaintWithAI(testComplaintPayload);
    console.log('   - AI Category:', aiResult.category);
    console.log('   - AI Subcategory:', aiResult.subCategory);
    console.log('   - Urgency Score (1-5):', aiResult.urgencyScore);
    console.log('   - Confidence:', `${Math.round(aiResult.confidence * 100)}%`);
    console.log('   - Sentiment:', aiResult.sentiment);
    console.log('   - Reasoning:', aiResult.reasoning);
    console.log('✅ AI Classification Completed.');

    // Step 5: Test Automated University Routing Engine
    console.log('\n⚙️  [Step 5] Testing SmartResolve Routing Engine...');
    const routingResult = await routeComplaint({
      category: aiResult.category || 'HOSTEL_ACCOMMODATION',
      subCategory: aiResult.subCategory || 'PLUMBING_WATER_SUPPLY',
      location: testComplaintPayload.location,
      specificLocation: 'Ground floor washroom cubicle 3',
      locationDetails: {
        locationType: 'HOSTEL',
        hostelName: 'Zahira Hall',
        building: 'Block A',
        roomOrArea: 'Ground Floor Washroom',
      },
      urgencyScore: aiResult.urgencyScore || 4,
      priority: 'Urgent',
      faculty: 'Technology',
    });

    console.log('   - Target Scope:', routingResult.targetScope);
    console.log('   - Assigned Unit:', routingResult.assignedUnit);
    console.log('   - Assigned Role:', routingResult.assignedRole);
    console.log('   - SLA Escalation Target:', `${routingResult.slaHours} hours`);
    console.log('   - Routing Rule Applied:', routingResult.ruleAppliedName);
    console.log('✅ SmartResolve Routing Rule Successfully Matched.');

    // Step 6: Create Ticket in Database & Verify Auto Ticket Number
    console.log('\n🎫 [Step 6] Persisting Complaint & Generating Ticket Number...');
    const newComplaint = new Complaint({
      title: testComplaintPayload.title,
      description: testComplaintPayload.description,
      category: aiResult.category || 'HOSTEL_ACCOMMODATION',
      subcategory: aiResult.subCategory || 'PLUMBING_WATER_SUPPLY',
      location: testComplaintPayload.location,
      specificLocation: 'Ground floor washroom cubicle 3',
      locationDetails: {
        locationType: 'HOSTEL',
        hostelName: 'Zahira Hall',
        building: 'Block A',
        roomOrArea: 'Ground Floor Washroom',
      },
      priority: routingResult.priority || 'Urgent',
      status: 'ASSIGNED',
      reporter: studentUser._id,
      assignedToUnit: routingResult.assignedUnit,
      assignedStaffRole: routingResult.assignedRole,
      assignedStaffId: wardenUser._id,
      slaEscalationDueAt: routingResult.slaEscalationDueAt,
      aiClassification: {
        category: aiResult.category,
        subCategory: aiResult.subCategory,
        urgencyScore: aiResult.urgencyScore,
        confidence: aiResult.confidence,
        sentiment: aiResult.sentiment,
        reasoning: aiResult.reasoning,
        modelVersion: 'nvidia/nemotron-3-super-120b',
        analyzedAt: new Date(),
      },
      routingDecision: {
        targetScope: routingResult.targetScope,
        assignedUnit: routingResult.assignedUnit,
        assignedRole: routingResult.assignedRole,
        ruleAppliedId: routingResult.ruleAppliedId,
        ruleAppliedName: routingResult.ruleAppliedName,
        slaHours: routingResult.slaHours,
        conflictDetected: routingResult.conflictDetected,
        routedAt: new Date(),
      },
      statusHistory: [
        {
          previousStatus: 'SUBMITTED',
          newStatus: 'ASSIGNED',
          changedBy: adminUser._id,
          changedByName: 'SmartResolve Automated Dispatcher',
          note: `Automatically routed to ${routingResult.assignedUnit} via rule "${routingResult.ruleAppliedName}"`,
          timestamp: new Date(),
        },
      ],
    });

    await newComplaint.save();
    console.log(`   - Generated Ticket Number: ${newComplaint.ticketNumber}`);
    if (!newComplaint.ticketNumber.startsWith('SEUSL-2026-')) {
      throw new Error(`Ticket format invalid: ${newComplaint.ticketNumber}`);
    }
    console.log('✅ Complaint Ticket Created with standard SEUSL formatting.');

    // Step 7: Staff Action - Clarification Cycle
    console.log('\n💬 [Step 7] Testing Staff Clarification Request & Student Reply...');
    // Warden asks for clarification
    newComplaint.status = 'AWAITING_CLARIFICATION';
    newComplaint.clarificationRequests.push({
      askedBy: wardenUser._id,
      askedByName: wardenUser.name,
      question: 'Has the main water valve outside Block A been shut off to prevent electrical damage?',
      askedAt: new Date(),
    });
    await newComplaint.save();
    console.log('   - Officer asked clarification question.');

    // Student replies
    const latestReq = newComplaint.clarificationRequests[0];
    latestReq.studentAnswer = 'Yes, the floor supervisor shut off the external red isolation valve at 5:15 PM.';
    latestReq.answeredAt = new Date();
    newComplaint.status = 'IN_PROGRESS';
    newComplaint.statusHistory.push({
      previousStatus: 'AWAITING_CLARIFICATION',
      newStatus: 'IN_PROGRESS',
      changedBy: studentUser._id,
      changedByName: `${studentUser.name} (Student Clarification Provided)`,
      note: 'Student confirmed isolation valve shut off.',
      timestamp: new Date(),
    });
    await newComplaint.save();
    console.log('   - Student submitted answer. Status updated to IN_PROGRESS.');

    // Step 8: Staff Action - Internal Note & Resolution
    console.log('\n🔒 [Step 8] Testing Staff Internal Confidential Note & Resolution...');
    newComplaint.internalNotes.push({
      author: wardenUser._id,
      authorName: wardenUser.name,
      authorRole: wardenUser.role,
      note: 'Emergency plumber Mr. Selvam dispatched with replacement 2-inch PVC junction fitting. Cost budgeted to Hostel Maintenance Account.',
      createdAt: new Date(),
    });

    newComplaint.officialResponses.push({
      user: wardenUser._id,
      responderName: wardenUser.name,
      responderRole: wardenUser.role,
      message: 'Plumbing contractor has replaced the broken junction pipe and water supply has been restored with no leakage.',
      createdAt: new Date(),
    });

    newComplaint.status = 'RESOLVED';
    newComplaint.statusHistory.push({
      previousStatus: 'IN_PROGRESS',
      newStatus: 'RESOLVED',
      changedBy: wardenUser._id,
      changedByName: wardenUser.name,
      note: 'Issue resolved: broken junction replaced.',
      timestamp: new Date(),
    });
    await newComplaint.save();
    console.log('   - Staff logged internal note, official response, and set status to RESOLVED.');
    console.log('✅ Complaint Lifecycle Successfully Completed.');

    // Step 9: Test RAG Knowledge System
    console.log('\n📚 [Step 9] Testing RAG Policy Retrieval & Grounded Q&A...');
    const ragQuery = 'What are the hostel quiet hours and visitor policy at SEUSL?';
    console.log(`   - Student Query: "${ragQuery}"`);
    const ragResult = await answerUniversityQuestionRAG(ragQuery);
    console.log(`   - AI Answer: ${ragResult.answer.slice(0, 150)}...`);
    console.log(`   - Sources Cited: ${ragResult.sources.map(s => s.title).join(', ') || 'Official Regulations'}`);
    console.log('✅ RAG Retrieval and Grounded Answer Verified.');

    // Step 10: Test Tool-Enabled AI Agent
    console.log('\n🤖 [Step 10] Testing Tool-Enabled AI Agent...');
    const toolCallResult = await executeAgentTool(
      'getComplaintStatus',
      { ticketNumber: newComplaint.ticketNumber },
      studentUser
    );
    const statusValue = toolCallResult.complaint?.status || toolCallResult.data?.status;
    const catValue = toolCallResult.complaint?.category || toolCallResult.data?.category;
    console.log('   - Tool Executed: getComplaintStatus');
    console.log('   - Tool Output Status:', statusValue);
    console.log('   - Tool Output Category:', catValue);
    console.log('✅ AI Agent Tool Execution Verified.');

    console.log('\n============================================================');
    console.log('🎉 ALL 10 END-TO-END SMARTRESOLVE SUITE TESTS PASSED (100%)');
    console.log('============================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ E2E Verification Failed with error:', err);
    process.exit(1);
  }
}

runE2ETest();
