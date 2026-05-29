import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ========== CONFIGURATION ==========
//
// Demo Credentials (create these users in Firebase Console before seeding):
// ┌──────────────────────┬──────────────────────┬──────────────┬──────────────────────────┐
// │ Role                 │ Email                │ Password     │ Firebase UID (get from   │
// │                      │                      │              │ Firebase Console after   │
// │                      │                      │              │ creating the user)       │
// ├──────────────────────┼──────────────────────┼──────────────┼──────────────────────────┤
// │ Admin / Business     │ admin@freebuff.in    │ Admin@123    │ Set as FIREBASE_ADMIN_UID │
// │ Owner                │                      │              │                          │
// ├──────────────────────┼──────────────────────┼──────────────┼──────────────────────────┤
// │ Demo Staff           │ staff@freebuff.in    │ Staff@123    │ Set as FIREBASE_STAFF_UID │
// └──────────────────────┴──────────────────────┴──────────────┴──────────────────────────┘
//
// How to create these users in Firebase Console:
// 1. Go to https://console.firebase.google.com → Your Project → Authentication → Users
// 2. Click "Add User" → Enter email + password (Admin@123)
// 3. Repeat for staff@freebuff.in
// 4. Click each user → Copy their UID
// 5. Run: FIREBASE_ADMIN_UID=<uid> FIREBASE_STAFF_UID=<uid2> npx tsx prisma/seed.ts

const FIREBASE_ADMIN_UID = process.env.FIREBASE_ADMIN_UID || 'PLACEHOLDER_ADMIN_UID';
const FIREBASE_STAFF_UID = process.env.FIREBASE_STAFF_UID || ''; // Optional second user

async function main() {
  console.log('🌱 Seeding database with demo data...\n');

  // ========== STEP 1: DEMO USERS ==========
  console.log('👤 Creating demo users...');

  // --- Admin User (business owner) ---
  const adminUser = await prisma.user.upsert({
    where: { firebaseUid: FIREBASE_ADMIN_UID },
    update: {},
    create: {
      firebaseUid: FIREBASE_ADMIN_UID,
      email: 'admin@freebuff.in',
      name: 'Rahul Sharma',
      phone: '+91-9876543210',
      role: 'BUSINESS_OWNER',
    },
  });
  console.log(`   ✅ Admin: ${adminUser.name} (${adminUser.email})`);

  // --- Staff User (optional, created only if FIREBASE_STAFF_UID is provided) ---
  let staffUser = null;
  if (FIREBASE_STAFF_UID) {
    staffUser = await prisma.user.upsert({
      where: { firebaseUid: FIREBASE_STAFF_UID },
      update: {},
      create: {
        firebaseUid: FIREBASE_STAFF_UID,
        email: 'staff@freebuff.in',
        name: 'Priya Patel',
        phone: '+91-9988776655',
        role: 'STAFF',
      },
    });
    console.log(`   ✅ Staff: ${staffUser.name} (${staffUser.email})`);
  }

  // Use admin user as the owner for the demo business
  const user = adminUser;

  // ========== STEP 2: DEMO BUSINESS ==========
  console.log('\n🏥 Creating demo business...');
  const business = await prisma.business.upsert({
    where: { id: 'demo-business-clinic' },
    update: {},
    create: {
      id: 'demo-business-clinic',
      ownerId: user.id,
      name: 'Sharma Dental Clinic',
      type: 'CLINIC',
      description: 'Advanced dental care with modern technology. Specializing in root canals, teeth whitening, braces, and general dentistry.',
      phone: '+91-9876543210',
      email: 'info@sharmadental.com',
      website: 'https://sharmadental.com',
      address: '42, MG Road, Near City Mall',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      whatsappNumber: '+91-9876543210',
      timezone: 'Asia/Kolkata',
      language: 'hi',
      businessHours: {
        monday: { open: '09:00', close: '19:00', isOpen: true },
        tuesday: { open: '09:00', close: '19:00', isOpen: true },
        wednesday: { open: '09:00', close: '19:00', isOpen: true },
        thursday: { open: '09:00', close: '19:00', isOpen: true },
        friday: { open: '09:00', close: '19:00', isOpen: true },
        saturday: { open: '10:00', close: '17:00', isOpen: true },
        sunday: { open: null, close: null, isOpen: false },
      },
    },
  });
  console.log(`   ✅ Business: ${business.name}, ${business.city}`);

  // ========== STEP 3: AI SETTINGS ==========
  console.log('\n🤖 Configuring AI settings...');
  await prisma.aiSettings.upsert({
    where: { businessId: business.id },
    update: {},
    create: {
      businessId: business.id,
      tone: 'professional',
      language: 'hi-en',
      welcomeMessage: 'नमस्ते! 🙏 Welcome to Sharma Dental Clinic! I am your AI assistant. How can I help you today? You can ask about our services, book an appointment, or inquire about treatments.',
      fallbackMessage: 'Thank you for your message. Our team will get back to you shortly. For urgent dental concerns, please call us directly.',
      autoReplyEnabled: true,
      businessHoursOnly: false,
      leadCaptureEnabled: true,
      appointmentEnabled: true,
      faqEnabled: true,
      maxResponseLength: 500,
      temperature: 0.7,
    },
  });
  console.log('   ✅ AI Settings configured (Hinglish, professional tone)');

  // ========== STEP 4: FAQS ==========
  console.log('\n📋 Creating FAQs...');
  const faqs = [
    {
      question: 'What are your clinic timings?',
      answer: 'We are open Monday to Friday from 9:00 AM to 7:00 PM, and Saturday from 10:00 AM to 5:00 PM. We remain closed on Sundays.',
      category: 'general',
      priority: 10,
    },
    {
      question: 'Do you accept insurance?',
      answer: 'Yes, we accept all major health insurance plans. Please bring your insurance card to your first appointment and we will help you with the claim process.',
      category: 'billing',
      priority: 9,
    },
    {
      question: 'How much does a root canal cost?',
      answer: 'Root canal treatment starts from ₹3,000 per tooth, depending on the complexity. The final cost will be determined after examination. We also offer EMI options.',
      category: 'treatments',
      priority: 8,
    },
    {
      question: 'How often should I visit the dentist?',
      answer: 'We recommend visiting every 6 months for a regular check-up and cleaning. However, if you have specific concerns, feel free to book an appointment anytime.',
      category: 'general',
      priority: 7,
    },
    {
      question: 'Do you offer teeth whitening?',
      answer: 'Yes! We offer professional teeth whitening treatments starting from ₹5,000. Our in-clinic procedure takes about 1 hour with immediate visible results.',
      category: 'treatments',
      priority: 6,
    },
    {
      question: 'Is the clinic wheelchair accessible?',
      answer: 'Yes, our clinic is fully wheelchair accessible with a ramp at the entrance and accessible restrooms.',
      category: 'general',
      priority: 5,
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept cash, all major credit/debit cards, UPI (GPay, PhonePe, Paytm), and net banking. EMI options are also available for expensive treatments.',
      category: 'billing',
      priority: 4,
    },
    {
      question: 'Do you treat children?',
      answer: 'Yes, we have a dedicated pediatric dentistry section. Dr. Sharma specializes in making children comfortable during their dental visits.',
      category: 'general',
      priority: 3,
    },
    {
      question: 'What should I bring for my first appointment?',
      answer: 'Please bring your ID proof, insurance card (if applicable), and any previous dental records or X-rays. Arrive 15 minutes early to complete registration.',
      category: 'appointments',
      priority: 2,
    },
    {
      question: 'डॉक्टर हिंदी बोलते हैं? (Does the doctor speak Hindi?)',
      answer: 'हाँ, डॉ. शर्मा हिंदी और इंग्लिश दोनों में fluent हैं। आप अपनी सुविधा के अनुसार किसी भी भाषा में बात कर सकते हैं।',
      category: 'general',
      priority: 1,
    },
  ];

  // Delete existing FAQs to avoid duplicates
  await prisma.faq.deleteMany({ where: { businessId: business.id } });
  for (const faq of faqs) {
    await prisma.faq.create({
      data: { ...faq, businessId: business.id },
    });
  }
  console.log(`   ✅ ${faqs.length} FAQs created`);

  // ========== STEP 5: LEADS ==========
  console.log('\n👥 Creating leads...');
  const leadsData = [
    { name: 'Priya Patel', phone: '+91-9988776655', email: 'priya.p@email.com', source: 'whatsapp', status: 'NEW' as const, score: 20, notes: 'Inquired about teeth whitening pricing' },
    { name: 'Amit Verma', phone: '+91-8877665544', email: 'amit.v@email.com', source: 'website', status: 'CONTACTED' as const, score: 45, notes: 'Interested in braces for his daughter. Called and discussed options.' },
    { name: 'Sunita Reddy', phone: '+91-7766554433', email: 'sunita.r@email.com', source: 'referral', status: 'QUALIFIED' as const, score: 72, notes: 'Referred by Dr. Mehta. Needs root canal. Ready to schedule.' },
    { name: 'Vikram Singh', phone: '+91-6655443322', email: 'vikram.s@email.com', source: 'whatsapp', status: 'CONVERTED' as const, score: 95, notes: 'Completed root canal treatment. Very satisfied with the service.' },
    { name: 'Ananya Joshi', phone: '+91-5544332211', email: 'ananya.j@email.com', source: 'website', status: 'LOST' as const, score: 10, notes: 'Chose a different clinic closer to home.' },
    { name: 'Rajesh Kumar', phone: '+91-4433221100', email: 'rajesh.k@email.com', source: 'whatsapp', status: 'NEW' as const, score: 15, notes: 'Asked about clinic timings on WhatsApp' },
  ];

  // Delete existing leads to avoid conflicts
  await prisma.lead.deleteMany({ where: { businessId: business.id } });
  const leads: Array<{ id: string; name: string; phone: string }> = [];
  for (const data of leadsData) {
    const lead = await prisma.lead.create({
      data: {
        businessId: business.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        source: data.source,
        status: data.status,
        score: data.score,
        notes: data.notes,
        lastContactedAt: data.status !== 'NEW' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
        convertedAt: data.status === 'CONVERTED' ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : undefined,
      },
    });
    leads.push({ id: lead.id, name: lead.name!, phone: lead.phone });
  }
  console.log(`   ✅ ${leads.length} leads created (NEW, CONTACTED, QUALIFIED, CONVERTED, LOST)`);

  // ========== STEP 6: WHATSAPP MESSAGES ==========
  console.log('\n💬 Creating WhatsApp messages...');
  const messageThreads: Array<{
    leadId: string;
    leadName: string;
    leadPhone: string;
    messages: Array<{ content: string; direction: 'INBOUND' | 'OUTBOUND'; isAiGenerated?: boolean }>;
  }> = [
    {
      leadId: leads[0].id,
      leadName: leads[0].name,
      leadPhone: leads[0].phone,
      messages: [
        { content: 'Hi, I wanted to know about teeth whitening costs', direction: 'INBOUND' },
        { content: 'नमस्ते Priya! 🙏 Thank you for reaching out to Sharma Dental Clinic. Our professional teeth whitening treatment starts from ₹5,000. The procedure takes about 1 hour with immediate results. Would you like to book a consultation?', direction: 'OUTBOUND', isAiGenerated: true },
        { content: 'Oh that sounds great! Does it work on sensitive teeth?', direction: 'INBOUND' },
        { content: 'Yes, we use a gentle formula that is suitable for sensitive teeth. Our dentist will first examine your teeth to ensure the best results. We also offer a desensitizing gel application before the procedure to minimize any discomfort.', direction: 'OUTBOUND', isAiGenerated: true },
      ],
    },
    {
      leadId: leads[2].id,
      leadName: leads[2].name,
      leadPhone: leads[2].phone,
      messages: [
        { content: 'Hello, Dr. Mehta referred me. I have severe tooth pain', direction: 'INBOUND' },
        { content: 'Welcome Sunita! Dr. Mehta\'s patients are always welcome. I\'m sorry to hear about your tooth pain. We can schedule an urgent appointment for you. When would be convenient? We have slots available tomorrow at 10 AM or 2 PM.', direction: 'OUTBOUND', isAiGenerated: true },
        { content: 'Tomorrow 10am works. How much will root canal cost?', direction: 'INBOUND' },
        { content: 'Root canal treatment starts from ₹3,000 per tooth. The exact cost depends on the complexity. We will provide a complete estimate after examination. We also offer EMI options. I\'ve booked your appointment for tomorrow at 10:00 AM!', direction: 'OUTBOUND', isAiGenerated: true },
      ],
    },
    {
      leadId: leads[3].id,
      leadName: leads[3].name,
      leadPhone: leads[3].phone,
      messages: [
        { content: 'Hi, I need to get my teeth checked. Any slot available this week?', direction: 'INBOUND' },
        { content: 'Welcome to Sharma Dental Clinic! We have several slots available this week. May I suggest Wednesday at 11 AM or Friday at 3 PM? Which works better for you?', direction: 'OUTBOUND', isAiGenerated: true },
        { content: 'Wednesday 11am is perfect', direction: 'INBOUND' },
        { content: 'Excellent! Your appointment is confirmed for Wednesday at 11:00 AM with Dr. Sharma. Please bring any previous dental records if you have them. See you soon! 😊', direction: 'OUTBOUND', isAiGenerated: true },
      ],
    },
    {
      leadId: leads[5].id,
      leadName: leads[5].name,
      leadPhone: leads[5].phone,
      messages: [
        { content: 'Are you open on Sundays? I want to come for a checkup', direction: 'INBOUND' },
        { content: 'नमस्ते Rajesh! 🙏 We are closed on Sundays. Our timings are Monday-Friday: 9 AM to 7 PM, and Saturday: 10 AM to 5 PM. Would you like me to suggest a convenient slot on Saturday?', direction: 'OUTBOUND', isAiGenerated: true },
      ],
    },
  ];

  for (const thread of messageThreads) {
    for (let i = 0; i < thread.messages.length; i++) {
      const msg = thread.messages[i];
      await prisma.whatsAppMessage.create({
        data: {
          businessId: business.id,
          fromNumber: msg.direction === 'INBOUND' ? thread.leadPhone : business.whatsappNumber!,
          toNumber: msg.direction === 'OUTBOUND' ? thread.leadPhone : business.whatsappNumber!,
          content: msg.content,
          direction: msg.direction,
          status: msg.direction === 'INBOUND' ? 'DELIVERED' : 'SENT',
          isAiGenerated: msg.isAiGenerated ?? false,
          leadId: thread.leadId,
          createdAt: new Date(Date.now() - (thread.messages.length - i) * 30 * 60 * 1000),
        },
      });
    }
  }
  console.log(`   ✅ ${messageThreads.reduce((sum, t) => sum + t.messages.length, 0)} messages created across ${messageThreads.length} conversations`);

  // ========== STEP 7: APPOINTMENTS ==========
  console.log('\n📅 Creating appointments...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const appointments = [
    { leadId: leads[2].id, customerName: 'Sunita Reddy', customerPhone: '+91-7766554433', title: 'Root Canal Consultation', date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), duration: 60, status: 'CONFIRMED' as const, notes: 'Referred by Dr. Mehta, severe tooth pain' },
    { leadId: leads[0].id, customerName: 'Priya Patel', customerPhone: '+91-9988776655', title: 'Teeth Whitening Consultation', date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), duration: 30, status: 'PENDING' as const, notes: 'Interested in whitening' },
    { leadId: leads[3].id, customerName: 'Vikram Singh', customerPhone: '+91-6655443322', title: 'Root Canal Treatment - Follow Up', date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), duration: 45, status: 'CONFIRMED' as const, notes: 'Follow-up after root canal' },
    { leadId: leads[1].id, customerName: 'Amit Verma', customerPhone: '+91-8877665544', title: 'Braces Consultation for Daughter', date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000), duration: 45, status: 'PENDING' as const, notes: 'For daughter, age 12' },
    { customerName: 'Meera Gupta', customerPhone: '+91-9123456780', title: 'Regular Check-up & Cleaning', date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), duration: 30, status: 'CONFIRMED' as const, notes: 'Regular 6-month checkup' },
    { customerName: 'Arjun Nair', customerPhone: '+91-9012345678', title: 'Emergency Tooth Extraction', date: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000), duration: 60, status: 'CONFIRMED' as const, notes: 'Wisdom tooth pain, urgent' },
    { customerName: 'Kavita Desai', customerPhone: '+91-8901234567', title: 'Teeth Whitening', date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), duration: 60, status: 'COMPLETED' as const, notes: 'Completed whitening, great results' },
    { customerName: 'Deepak Joshi', customerPhone: '+91-7890123456', title: 'Dental Implant Consultation', date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), duration: 45, status: 'CANCELLED' as const, notes: 'Cancelled due to travel' },
  ];

  await prisma.appointment.deleteMany({ where: { businessId: business.id } });
  for (const apt of appointments) {
    await prisma.appointment.create({
      data: {
        businessId: business.id,
        leadId: apt.leadId || null,
        customerName: apt.customerName,
        customerPhone: apt.customerPhone,
        title: apt.title,
        date: apt.date,
        duration: apt.duration,
        status: apt.status,
        notes: apt.notes,
      },
    });
  }
  console.log(`   ✅ ${appointments.length} appointments created (${appointments.filter(a => a.status !== 'CANCELLED' && a.status !== 'COMPLETED').length} upcoming)`);

  // ========== STEP 8: WORKFLOWS ==========
  console.log('\n⚙️ Creating workflows...');
  const workflows = [
    {
      name: 'Welcome Message',
      trigger: 'welcome_message',
      action: { message: 'नमस्ते! 🙏 Welcome to Sharma Dental Clinic! How can we help you today?' },
      isActive: true,
    },
    {
      name: 'Follow-up Check',
      trigger: 'follow_up',
      action: { waitHours: 24, message: 'Hi {customer_name}, this is Dr. Sharma\'s clinic. We hope you\'re doing well. If you have any questions about your recent visit, feel free to ask! 😊' },
      isActive: true,
    },
    {
      name: 'Appointment Reminder',
      trigger: 'follow_up',
      action: { waitHours: 2, message: 'Reminder: You have an appointment at Sharma Dental Clinic tomorrow at {time}. Please confirm or reschedule if needed.' },
      isActive: true,
      schedule: { cron: '0 10 * * *', timezone: 'Asia/Kolkata' },
    },
    {
      name: 'Review Request',
      trigger: 'follow_up',
      action: { waitHours: 48, message: 'Thank you for visiting Sharma Dental Clinic! We would love to hear about your experience. Please share a review on Google Maps: {review_link}' },
      isActive: true,
    },
    {
      name: 'Post-Treatment Care',
      trigger: 'follow_up',
      action: { waitHours: 6, message: 'Post-treatment care reminder: Avoid hot foods and drinks for 24 hours. If you experience severe pain, please contact us immediately.' },
      isActive: false,
    },
  ];

  await prisma.workflow.deleteMany({ where: { businessId: business.id } });
  for (const wf of workflows) {
    await prisma.workflow.create({
      data: {
        businessId: business.id,
        name: wf.name,
        trigger: wf.trigger,
        action: wf.action as any,
        schedule: wf.schedule as any,
        isActive: wf.isActive,
      },
    });
  }
  console.log(`   ✅ ${workflows.length} workflows created (${workflows.filter(w => w.isActive).length} active)`);

  // ========== STEP 9: ANALYTICS EVENTS ==========
  console.log('\n📊 Creating analytics events...');
  const events = [
    'message_sent', 'message_received', 'lead_captured', 'lead_converted',
    'appointment_booked', 'appointment_completed', 'appointment_cancelled',
  ];

  // Create 60 days of historical analytics events
  await prisma.analyticsEvent.deleteMany({ where: { businessId: business.id } });

  for (let day = 60; day >= 0; day--) {
    const date = new Date(today.getTime() - day * 24 * 60 * 60 * 1000);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const dailyMultiplier = isWeekend ? 0.3 : 1;

    // Random number of events per day
    const numEvents = Math.floor(Math.random() * 5 * dailyMultiplier) + (isWeekend ? 1 : 3);

    for (let i = 0; i < numEvents; i++) {
      const randomHour = 9 + Math.floor(Math.random() * 10); // 9 AM to 7 PM
      const eventTime = new Date(date);
      eventTime.setHours(randomHour, Math.floor(Math.random() * 60));

      const event = events[Math.floor(Math.random() * events.length)];
      await prisma.analyticsEvent.create({
        data: {
          businessId: business.id,
          event,
          properties: {
            source: Math.random() > 0.5 ? 'whatsapp' : 'website',
            ...(event === 'lead_captured' ? { leadSource: ['whatsapp', 'website', 'referral'][Math.floor(Math.random() * 3)] } : {}),
          },
          createdAt: eventTime,
        },
      });
    }
  }
  const totalEvents = await prisma.analyticsEvent.count({ where: { businessId: business.id } });
  console.log(`   ✅ ${totalEvents} analytics events created (60 days of data)`);

  // ========== STEP 10: SUBSCRIPTION ==========
  console.log('\n💳 Creating subscription...');
  await prisma.subscription.upsert({
    where: { businessId: business.id },
    update: {},
    create: {
      userId: user.id,
      businessId: business.id,
      planId: 'growth',
      planName: 'Growth',
      status: 'ACTIVE',
      amount: 999,
      currency: 'INR',
      currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('   ✅ Subscription: Growth plan (₹999/month, active)');

  // ========== STEP 11: WHATSAPP TEMPLATES ==========
  console.log('\n📝 Creating WhatsApp templates...');
  const templates = [
    { name: 'appointment_reminder', category: 'utility', content: 'Hi {{1}}, this is a reminder for your {{2}} appointment at Sharma Dental Clinic tomorrow at {{3}}.' },
    { name: 'appointment_confirmation', category: 'utility', content: 'Your appointment at Sharma Dental Clinic is confirmed! 📅 Date: {{1}}, Time: {{2}}. Call us if you need to reschedule.' },
    { name: 'welcome_message', category: 'marketing', content: 'Welcome to Sharma Dental Clinic, {{1}}! 🎉 We are happy to have you. Reply with what you need help with.' },
  ];

  await prisma.whatsAppTemplate.deleteMany({ where: { businessId: business.id } });
  for (const tpl of templates) {
    await prisma.whatsAppTemplate.create({
      data: { ...tpl, businessId: business.id, language: 'en', status: 'approved' },
    });
  }
  console.log(`   ✅ ${templates.length} WhatsApp templates created`);

  // ========== SUMMARY ==========
  console.log('\n═══════════════════════════════════════════');
  console.log('📊  SEED SUMMARY');
  console.log('═══════════════════════════════════════════');
  const counts = {
    users: await prisma.user.count(),
    businesses: await prisma.business.count(),
    aiSettings: await prisma.aiSettings.count(),
    faqs: await prisma.faq.count({ where: { businessId: business.id } }),
    leads: await prisma.lead.count({ where: { businessId: business.id } }),
    messages: await prisma.whatsAppMessage.count({ where: { businessId: business.id } }),
    appointments: await prisma.appointment.count({ where: { businessId: business.id } }),
    workflows: await prisma.workflow.count({ where: { businessId: business.id } }),
    events: await prisma.analyticsEvent.count({ where: { businessId: business.id } }),
    templates: await prisma.whatsAppTemplate.count({ where: { businessId: business.id } }),
  };
  console.log(`   👤 Users:                ${counts.users}`);
  console.log(`   🏥 Businesses:           ${counts.businesses}`);
  console.log(`   🤖 AI Settings:          ${counts.aiSettings}`);
  console.log(`   📋 FAQs:                 ${counts.faqs}`);
  console.log(`   👥 Leads:                ${counts.leads}`);
  console.log(`   💬 Messages:             ${counts.messages}`);
  console.log(`   📅 Appointments:         ${counts.appointments}`);
  console.log(`   ⚙️ Workflows:            ${counts.workflows}`);
  console.log(`   📊 Analytics Events:     ${counts.events}`);
  console.log(`   📝 WhatsApp Templates:   ${counts.templates}`);
  console.log('═══════════════════════════════════════════\n');

  if (FIREBASE_ADMIN_UID === 'PLACEHOLDER_ADMIN_UID') {
    console.log('⚠️  IMPORTANT: The demo data is linked to a placeholder Firebase UID.');
    console.log('   To link this data to your REAL Firebase users:');
    console.log('');
    console.log('   1. Go to Firebase Console → Authentication → Users tab');
    console.log('   2. Click "Add User" and create these users:');
    console.log('      - admin@freebuff.in  /  Admin@123');
    console.log('      - staff@freebuff.in  /  Staff@123');
    console.log('   3. Click each user and copy their UID');
    console.log('   4. Run the seed with UIDs:');
    console.log('      FIREBASE_ADMIN_UID=<admin-uid> FIREBASE_STAFF_UID=<staff-uid> npx tsx prisma/seed.ts');
    console.log('');
    console.log('   💡 Or set them in your .env file:');
    console.log('      FIREBASE_ADMIN_UID=abc123...');
    console.log('      FIREBASE_STAFF_UID=def456...\n');
  } else {
    console.log(`✅ Demo data linked to: admin@freebuff.in / staff@freebuff.in\n`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
