import { PrismaClient, Role, ActiveRole, CourseStatus, DifficultyLevel, SubscriptionPlan } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.featureFlag.deleteMany();
  await prisma.codingSubmission.deleteMany();
  await prisma.codingChallenge.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chatMember.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.referralUse.deleteMany();
  await prisma.referralCode.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.review.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.coursePrerequisite.deleteMany();
  await prisma.courseVersion.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.course.deleteMany();
  await prisma.category.deleteMany();
  await prisma.teacherApplication.deleteMany();
  await prisma.deviceSession.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Existing data cleaned');

  // Hash password function
  const hashPassword = async (password: string) => {
    return bcrypt.hash(password, 10);
  };

  // Create Users
  console.log('👤 Creating users...');
  const adminPassword = await hashPassword('admin123');
  const teacherPassword = await hashPassword('teacher123');
  const studentPassword = await hashPassword('student123');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@joyedu.com',
      username: 'admin',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      roles: [Role.ADMIN],
      activeRole: ActiveRole.ADMIN,
      isEmailVerified: true,
      isActive: true,
      subscriptionPlan: SubscriptionPlan.ENTERPRISE,
      profile: {
        create: {
          headline: 'System Administrator',
          location: 'Remote',
          language: 'en',
        },
      },
    },
  });

  const teacher1 = await prisma.user.create({
    data: {
      email: 'teacher1@joyedu.com',
      username: 'teacher1',
      passwordHash: teacherPassword,
      firstName: 'John',
      lastName: 'Teacher',
      bio: 'Experienced software developer with 10+ years in web development',
      roles: [Role.TEACHER],
      activeRole: ActiveRole.TEACHER,
      isEmailVerified: true,
      isActive: true,
      subscriptionPlan: SubscriptionPlan.PRO,
      profile: {
        create: {
          headline: 'Full Stack Developer & Instructor',
          website: 'https://johnteacher.com',
          linkedin: 'https://linkedin.com/in/johnteacher',
          github: 'https://github.com/johnteacher',
          location: 'San Francisco, CA',
          language: 'en',
        },
      },
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      email: 'teacher2@joyedu.com',
      username: 'teacher2',
      passwordHash: teacherPassword,
      firstName: 'Sarah',
      lastName: 'Instructor',
      bio: 'Data science expert and AI researcher',
      roles: [Role.TEACHER],
      activeRole: ActiveRole.TEACHER,
      isEmailVerified: true,
      isActive: true,
      subscriptionPlan: SubscriptionPlan.PRO,
      profile: {
        create: {
          headline: 'Data Science & AI Instructor',
          website: 'https://sarahai.com',
          linkedin: 'https://linkedin.com/in/sarahai',
          github: 'https://github.com/sarahai',
          location: 'New York, NY',
          language: 'en',
        },
      },
    },
  });

  const student1 = await prisma.user.create({
    data: {
      email: 'student1@joyedu.com',
      username: 'student1',
      passwordHash: studentPassword,
      firstName: 'Mike',
      lastName: 'Student',
      bio: 'Aspiring web developer',
      roles: [Role.STUDENT],
      activeRole: ActiveRole.STUDENT,
      isEmailVerified: true,
      isActive: true,
      subscriptionPlan: SubscriptionPlan.BASIC,
      profile: {
        create: {
          headline: 'Learning to code',
          location: 'Austin, TX',
          language: 'en',
        },
      },
    },
  });

  const student2 = await prisma.user.create({
    data: {
      email: 'student2@joyedu.com',
      username: 'student2',
      passwordHash: studentPassword,
      firstName: 'Emily',
      lastName: 'Learner',
      bio: 'Career switcher exploring tech',
      roles: [Role.STUDENT],
      activeRole: ActiveRole.STUDENT,
      isEmailVerified: true,
      isActive: true,
      subscriptionPlan: SubscriptionPlan.FREE,
      profile: {
        create: {
          headline: 'Career pivot to tech',
          location: 'Seattle, WA',
          language: 'en',
        },
      },
    },
  });

  const student3 = await prisma.user.create({
    data: {
      email: 'student3@joyedu.com',
      username: 'student3',
      passwordHash: studentPassword,
      firstName: 'David',
      lastName: 'Coder',
      bio: 'Full-time student learning programming',
      roles: [Role.STUDENT],
      activeRole: ActiveRole.STUDENT,
      isEmailVerified: true,
      isActive: true,
      subscriptionPlan: SubscriptionPlan.BASIC,
      profile: {
        create: {
          headline: 'Programming enthusiast',
          location: 'Chicago, IL',
          language: 'en',
        },
      },
    },
  });

  console.log('✅ Users created');

  // Create Categories
  console.log('📚 Creating categories...');
  const webDevCategory = await prisma.category.create({
    data: {
      name: 'Web Development',
      slug: 'web-development',
      description: 'Learn to build modern web applications',
      icon: '💻',
      sortOrder: 1,
    },
  });

  const dataScienceCategory = await prisma.category.create({
    data: {
      name: 'Data Science',
      slug: 'data-science',
      description: 'Master data analysis and machine learning',
      icon: '📊',
      sortOrder: 2,
    },
  });

  const mobileDevCategory = await prisma.category.create({
    data: {
      name: 'Mobile Development',
      slug: 'mobile-development',
      description: 'Build iOS and Android applications',
      icon: '📱',
      sortOrder: 3,
    },
  });

  const devOpsCategory = await prisma.category.create({
    data: {
      name: 'DevOps',
      slug: 'devops',
      description: 'Learn deployment and infrastructure',
      icon: '🔧',
      sortOrder: 4,
    },
  });

  console.log('✅ Categories created');

  // Create Courses
  console.log('🎓 Creating courses...');
  const course1 = await prisma.course.create({
    data: {
      title: 'Complete Web Development Bootcamp',
      slug: 'complete-web-development-bootcamp',
      subtitle: 'From zero to hero in web development',
      description: 'Learn HTML, CSS, JavaScript, React, Node.js, and more in this comprehensive web development course.',
      thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
      price: 99.99,
      discountPrice: 49.99,
      currency: 'USD',
      status: CourseStatus.PUBLISHED,
      difficulty: DifficultyLevel.BEGINNER,
      language: 'en',
      duration: 120,
      requirements: ['Basic computer skills', 'No programming experience needed'],
      learningGoals: ['Build responsive websites', 'Understand web development fundamentals', 'Deploy applications'],
      tags: ['web', 'html', 'css', 'javascript', 'react'],
      seoTitle: 'Complete Web Development Bootcamp - Learn to Code',
      seoDescription: 'Master web development from scratch. Learn HTML, CSS, JavaScript, React, and more.',
      seoKeywords: ['web development', 'learn to code', 'html', 'css', 'javascript', 'react'],
      isFeatured: true,
      publishedAt: new Date(),
      instructorId: teacher1.id,
      categoryId: webDevCategory.id,
    },
  });

  const course2 = await prisma.course.create({
    data: {
      title: 'Advanced React & Redux',
      slug: 'advanced-react-redux',
      subtitle: 'Master modern React development',
      description: 'Deep dive into React hooks, Redux, state management, and performance optimization.',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      price: 79.99,
      currency: 'USD',
      status: CourseStatus.PUBLISHED,
      difficulty: DifficultyLevel.INTERMEDIATE,
      language: 'en',
      duration: 80,
      requirements: ['Basic JavaScript knowledge', 'Understanding of React basics'],
      learningGoals: ['Master React hooks', 'Build scalable applications', 'Optimize performance'],
      tags: ['react', 'redux', 'javascript', 'frontend'],
      seoTitle: 'Advanced React & Redux Course',
      seoDescription: 'Take your React skills to the next level with advanced patterns and Redux.',
      seoKeywords: ['react', 'redux', 'advanced', 'frontend'],
      isFeatured: true,
      publishedAt: new Date(),
      instructorId: teacher1.id,
      categoryId: webDevCategory.id,
    },
  });

  const course3 = await prisma.course.create({
    data: {
      title: 'Data Science with Python',
      slug: 'data-science-python',
      subtitle: 'Become a data scientist',
      description: 'Learn Python, pandas, numpy, matplotlib, and machine learning fundamentals.',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
      price: 129.99,
      discountPrice: 89.99,
      currency: 'USD',
      status: CourseStatus.PUBLISHED,
      difficulty: DifficultyLevel.INTERMEDIATE,
      language: 'en',
      duration: 100,
      requirements: ['Basic Python knowledge', 'Understanding of statistics'],
      learningGoals: ['Analyze datasets', 'Build ML models', 'Visualize data'],
      tags: ['python', 'data-science', 'machine-learning', 'pandas'],
      seoTitle: 'Data Science with Python Course',
      seoDescription: 'Master data science using Python, pandas, and machine learning.',
      seoKeywords: ['data science', 'python', 'machine learning', 'pandas'],
      isFeatured: true,
      publishedAt: new Date(),
      instructorId: teacher2.id,
      categoryId: dataScienceCategory.id,
    },
  });

  const course4 = await prisma.course.create({
    data: {
      title: 'Machine Learning A-Z',
      slug: 'machine-learning-az',
      subtitle: 'Complete ML guide',
      description: 'Comprehensive machine learning course covering supervised and unsupervised learning.',
      thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800',
      price: 149.99,
      currency: 'USD',
      status: CourseStatus.PUBLISHED,
      difficulty: DifficultyLevel.ADVANCED,
      language: 'en',
      duration: 150,
      requirements: ['Python programming', 'Math basics', 'Statistics knowledge'],
      learningGoals: ['Build ML models', 'Understand algorithms', 'Apply ML to real problems'],
      tags: ['machine-learning', 'python', 'ai', 'deep-learning'],
      seoTitle: 'Machine Learning A-Z Course',
      seoDescription: 'Complete machine learning course from basics to advanced techniques.',
      seoKeywords: ['machine learning', 'ai', 'deep learning', 'python'],
      isFeatured: false,
      publishedAt: new Date(),
      instructorId: teacher2.id,
      categoryId: dataScienceCategory.id,
    },
  });

  console.log('✅ Courses created');

  // Create Chapters and Lessons
  console.log('📖 Creating chapters and lessons...');
  
  // Course 1 Chapters
  const course1Chapter1 = await prisma.chapter.create({
    data: {
      title: 'Introduction to Web Development',
      courseId: course1.id,
      sortOrder: 1,
    },
  });

  const course1Chapter2 = await prisma.chapter.create({
    data: {
      title: 'HTML Fundamentals',
      courseId: course1.id,
      sortOrder: 2,
    },
  });

  const course1Chapter3 = await prisma.chapter.create({
    data: {
      title: 'CSS Styling',
      courseId: course1.id,
      sortOrder: 3,
    },
  });

  // Course 1 Lessons
  await prisma.lesson.create({
    data: {
      title: 'What is Web Development?',
      slug: 'what-is-web-development',
      type: 'MARKDOWN',
      content: '# Web Development Introduction\n\nWeb development is the work involved in developing a website for the Internet.',
      chapterId: course1Chapter1.id,
      sortOrder: 1,
      isFree: true,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Setting Up Your Environment',
      slug: 'setting-up-environment',
      type: 'VIDEO',
      videoUrl: 'https://example.com/video1.mp4',
      videoDuration: 600,
      chapterId: course1Chapter1.id,
      sortOrder: 2,
      isFree: true,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'HTML Basics',
      slug: 'html-basics',
      type: 'MARKDOWN',
      content: '# HTML Basics\n\nHTML is the standard markup language for creating web pages.',
      chapterId: course1Chapter2.id,
      sortOrder: 1,
      isFree: false,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'HTML Elements and Tags',
      slug: 'html-elements-tags',
      type: 'VIDEO',
      videoUrl: 'https://example.com/video2.mp4',
      videoDuration: 900,
      chapterId: course1Chapter2.id,
      sortOrder: 2,
      isFree: false,
    },
  });

  // Course 2 Chapters
  const course2Chapter1 = await prisma.chapter.create({
    data: {
      title: 'React Fundamentals',
      courseId: course2.id,
      sortOrder: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'React Introduction',
      slug: 'react-introduction',
      type: 'MARKDOWN',
      content: '# React Introduction\n\nReact is a JavaScript library for building user interfaces.',
      chapterId: course2Chapter1.id,
      sortOrder: 1,
      isFree: true,
    },
  });

  // Course 3 Chapters
  const course3Chapter1 = await prisma.chapter.create({
    data: {
      title: 'Python for Data Science',
      courseId: course3.id,
      sortOrder: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      title: 'Python Basics',
      slug: 'python-basics',
      type: 'MARKDOWN',
      content: '# Python Basics\n\nPython is a versatile programming language.',
      chapterId: course3Chapter1.id,
      sortOrder: 1,
      isFree: true,
    },
  });

  console.log('✅ Chapters and lessons created');

  // Create Enrollments
  console.log('📝 Creating enrollments...');
  await prisma.enrollment.create({
    data: {
      userId: student1.id,
      courseId: course1.id,
      progress: 25.5,
    },
  });

  await prisma.enrollment.create({
    data: {
      userId: student1.id,
      courseId: course3.id,
      progress: 10.0,
    },
  });

  await prisma.enrollment.create({
    data: {
      userId: student2.id,
      courseId: course1.id,
      progress: 50.0,
    },
  });

  await prisma.enrollment.create({
    data: {
      userId: student3.id,
      courseId: course2.id,
      progress: 0.0,
    },
  });

  console.log('✅ Enrollments created');

  // Create Reviews
  console.log('⭐ Creating reviews...');
  await prisma.review.create({
    data: {
      userId: student1.id,
      courseId: course1.id,
      rating: 5,
      comment: 'Excellent course! Very comprehensive and well-structured.',
    },
  });

  await prisma.review.create({
    data: {
      userId: student2.id,
      courseId: course1.id,
      rating: 4,
      comment: 'Great content, learned a lot. Would recommend to beginners.',
    },
  });

  await prisma.review.create({
    data: {
      userId: student3.id,
      courseId: course2.id,
      rating: 5,
      comment: 'Advanced concepts explained very clearly. Perfect for intermediate learners.',
    },
  });

  console.log('✅ Reviews created');

  // Create Transactions
  console.log('💰 Creating transactions...');
  await prisma.transaction.create({
    data: {
      userId: student1.id,
      courseId: course1.id,
      amount: 49.99,
      currency: 'USD',
      status: 'COMPLETED',
      stripePaymentId: 'pi_1234567890',
    },
  });

  await prisma.transaction.create({
    data: {
      userId: student1.id,
      courseId: course3.id,
      amount: 89.99,
      currency: 'USD',
      status: 'COMPLETED',
      stripePaymentId: 'pi_1234567891',
    },
  });

  await prisma.transaction.create({
    data: {
      userId: student2.id,
      courseId: course1.id,
      amount: 49.99,
      currency: 'USD',
      status: 'COMPLETED',
      stripePaymentId: 'pi_1234567892',
    },
  });

  await prisma.transaction.create({
    data: {
      userId: student3.id,
      courseId: course2.id,
      amount: 79.99,
      currency: 'USD',
      status: 'COMPLETED',
      stripePaymentId: 'pi_1234567893',
    },
  });

  console.log('✅ Transactions created');

  // Create Coding Challenges
  console.log('💻 Creating coding challenges...');
  await prisma.codingChallenge.create({
    data: {
      title: 'Two Sum',
      slug: 'two-sum',
      description: 'Given an array of integers, return indices of the two numbers that add up to a specific target.',
      difficulty: DifficultyLevel.BEGINNER,
      language: 'JAVASCRIPT',
      starterCode: 'function twoSum(nums, target) {\n  // Your code here\n}',
      solutionCode: 'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}',
      testCases: JSON.stringify([
        { input: [2, 7, 11, 15], target: 9, expected: [0, 1] },
        { input: [3, 2, 4], target: 6, expected: [1, 2] },
      ]),
      hints: ['Use a hash map for O(n) solution', 'Think about what to store in the map'],
      points: 10,
    },
  });

  await prisma.codingChallenge.create({
    data: {
      title: 'Reverse String',
      slug: 'reverse-string',
      description: 'Write a function that reverses a string.',
      difficulty: DifficultyLevel.BEGINNER,
      language: 'JAVASCRIPT',
      starterCode: 'function reverseString(s) {\n  // Your code here\n}',
      solutionCode: 'function reverseString(s) {\n  return s.split("").reverse().join("");\n}',
      testCases: JSON.stringify([
        { input: 'hello', expected: 'olleh' },
        { input: 'world', expected: 'dlrow' },
      ]),
      hints: ['Split the string into an array', 'Use array reverse method'],
      points: 10,
    },
  });

  console.log('✅ Coding challenges created');

  // Create Feature Flags
  console.log('🚩 Creating feature flags...');
  await prisma.featureFlag.create({
    data: {
      key: 'enable_new_dashboard',
      name: 'Enable New Dashboard',
      description: 'Enable the new dashboard UI for all users',
      isEnabled: true,
    },
  });

  await prisma.featureFlag.create({
    data: {
      key: 'enable_ai_recommendations',
      name: 'Enable AI Recommendations',
      description: 'Enable AI-powered course recommendations',
      isEnabled: false,
    },
  });

  console.log('✅ Feature flags created');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Users: 5 (1 admin, 2 teachers, 3 students)`);
  console.log(`- Categories: 4`);
  console.log(`- Courses: 4`);
  console.log(`- Chapters: 5`);
  console.log(`- Lessons: 7`);
  console.log(`- Enrollments: 4`);
  console.log(`- Reviews: 3`);
  console.log(`- Transactions: 4`);
  console.log(`- Coding Challenges: 2`);
  console.log(`- Feature Flags: 2`);
  console.log('\n🔐 Test Credentials:');
  console.log(`Admin: admin@joyedu.com / admin123`);
  console.log(`Teacher: teacher1@joyedu.com / teacher123`);
  console.log(`Student: student1@joyedu.com / student123`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
