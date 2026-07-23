/**
 * Page title translations (English)
 * key = route name, value = page title
 * Used by router.afterEach to dynamically set document.title
 */
const enPageTitles: Record<string, string> = {
  // ── Home ──
  Home: 'Home - Discover Beautiful Moments',
  MyHome: 'Home - Discover Beautiful Moments',

  // ── User ──
  UserLogin: 'Login - Welcome Back to Yuemu',
  UserRegister: 'Sign Up - Start Your Creative Journey',
  UserSetting: 'Account Settings - Your Profile',
  UserDetail: 'Profile - Meet Interesting Souls',
  UserResetPassword: 'Security - Reset Password',
  UserReportCenter: 'Report Center - Appeals & Reports',

  // ── My ──
  MyPage: 'My Page - Your Yuemu',
  MySpace: 'My Universe',
  MyPosts: 'My Posts - Creative Journey',
  MyTeams: 'My Teams - Squad Hub',

  // ── Pictures ──
  AddPicture: 'Upload - Leave Your Mark',
  AddPictureBatch: 'Batch Upload - Capture Inspiration',
  PictureDetail: 'Artwork Detail - Appreciate the Light',
  MobilePictureDetail: 'Mobile View - Artwork Detail',
  PictureRedirect: 'Picture Redirect',
  SearchPicture: 'Search Pictures - Find Treasures',
  GuessYouLike: 'You Might Like',

  // ── Copyright ──
  CopyrightRegister: 'Copyright Registration',
  CopyrightTrace: 'Copyright Trace - History Lookup',

  // ── Space ──
  AddSpace: 'Create Space - Your New Universe',
  SpaceDetail: 'Space Explorer - Discover Inspiration',
  SpaceAnalyze: 'Analytics - Space Dashboard',
  SpaceUserManage: 'Space Members - Guardians',
  SpaceChat: 'Campfire - Team Chat',
  SpaceActivityManage: 'Space Events - Activity Center',

  // ── Chat ──
  PrivateChat: 'Whisper - Private Chat',
  ChatList: 'Inbox - Contact List',
  PCChat: 'Full Screen Chat',
  AIChat: 'Summon AI - Your Cyber Assistant',
  ChatRedirect: 'Connecting...',

  // ── Forum & Posts ──
  Forum: 'Community - Yuemu Forum',
  PostDetail: 'Post Detail - Join the Discussion',
  PostEdit: 'Write a Post - Edit',

  // ── Activities ──
  ActivityDetail: 'Activity Detail - Join the Fun',
  ActivityEdit: 'Edit Activity - Plan the Party',
  ActivitySubmissionManage: 'Submissions - Review Center',

  // ── Messages & Interactions ──
  MessageCenter: 'New Signal - Message Center',
  InteractionHistory: 'Time Machine - Interaction History',

  // ── Search & Discover ──
  Search: 'Explore - Find Your Passion',
  Discovery: 'Discovery Guide - Explore the World',

  // ── Other Pages ──
  Ranking: 'Leaderboard - See Who\'s Hot',
  InvitePage: 'Invite - Membership Center',
  FriendLinks: 'Neighbors - Friend Links',
  Contact: 'Contact Us - Reach Out',
  FollowList: 'Following - My Galaxy',
  Barrage: 'Barrage Wall - Speak Freely',
  BrowseHistory: 'Memory Lane - Browse History',
  LoginRecords: 'Login Records - Account Security',
  Redirect: 'Jumping... Please Wait',
  AiResource: 'AI Resources - Your Digital Assets',
  CreatorAnalytics: 'Creator Center - Data Compass',
  Reminder: 'Reminders - Cyber Memory',
  ItemAnalytics: 'Item Analytics - Data Insights',

  // ── Games ──
  Games: 'Game Zone - Fun Mini Games',

  // ── Tools ──
  Tools: 'Toolbox - Utility Tools',
  Calculator: 'Toolbox - Calculator',
  Timer: 'Toolbox - Timer & Stopwatch',
  FoodWheel: 'Toolbox - Food Wheel: What to Eat',
  StickyWall: 'Toolbox - Sticky Note Wall',
  Pomodoro: 'Toolbox - Pomodoro Timer',
  Random: 'Toolbox - Random Number Generator',
  BaseConverter: 'Toolbox - Base Converter',
  UnitConverter: 'Toolbox - Unit Converter',
  TextLab: 'Toolbox - Text Processor',
  VaultKey: 'Toolbox - Password Generator',
  GridRuler: 'Toolbox - Screen Ruler',
  ColorPicker: 'Toolbox - Color Picker',

  // ── Love Board ──
  LoveBoard: 'Heartbeat - Love Board',
  LoveBoardShare: 'Witness Love - Love Board',
  LoveBoardList: 'Romance Square - Love Board Gallery',

  // ── Albums ──
  TimeAlbumDetail: 'Time Projector - Album Memories',
  MusicAlbumDetail: 'Vinyl Record - Music Album',

  // ── Privacy ──
  PrivacyCenter: 'Privacy Center',
  PrivacyPolicy: 'Privacy Policy',

  // ── Admin ──
  AdminManage: 'Admin - Core Console',
  AdminUserManage: 'Admin - User Management',
  AdminPictureManage: 'Admin - Picture Management',
  AdminSpaceManage: 'Admin - Space Management',
  AdminTagManage: 'Admin - Tag Management',
  AdminCategoryManage: 'Admin - Category Management',
  AdminReportManage: 'Admin - Report Management',
  AdminPostManage: 'Admin - Post Management',
  AdminCommentManage: 'Admin - Comment Management',
  AdminActivityManage: 'Admin - Activity Management',
  AdminSystemNotifyManage: 'Admin - System Notifications',
  AdminKnowledgeFileManage: 'Admin - Knowledge Base',
  AdminLikeManage: 'Admin - Like Management',
  AdminShareManage: 'Admin - Share Tracking',
  AdminAppManage: 'Admin - App Management',
  AdminFriendLinkManage: 'Admin - Friend Link Management',
  AdminAudioManage: 'Admin - Audio Management',
  AdminChatManage: 'Admin - Chat Management',
  AdminLoveBoardManage: 'Admin - Love Board Management',
  AdminMessageManage: 'Admin - Message Management',
  AdminRedisMonitor: 'System - Redis Monitor',
  AdminAIChatManage: 'System - AI Chat Monitor',
  AdminSessionManage: 'System - Session Topology',

  // ── 404 ──
  NotFound: '404 - Page Not Found',

  // ── Guides & About ──
  About: 'About Us - yuemutuku',
  Guides: 'Design & Creator Guides - yuemutuku',
  GuideDetail: 'Creator Guide Detail - yuemutuku',
};

/** Default page title fallback */
export const DEFAULT_EN_TITLE = 'yuemutuku - Discover, Share, Create Beautiful Moments';

export default enPageTitles;
