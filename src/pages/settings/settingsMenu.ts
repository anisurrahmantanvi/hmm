/**
 * The Settings menu, one place to release things one by one.
 * An item with a `to` route opens that screen. An item without one shows "Coming soon" when tapped.
 * To release an item, give it a `to`.
 * `inline` sections also show a ready-made control at the top (language, themes, push notifications).
 */
export interface SettingsItem {
  title: string
  to?: string
}
export interface SettingsSection {
  title: string
  inline?: 'language' | 'themes' | 'push'
  items: SettingsItem[]
  /** Items that are not available yet. Shown separately, so working settings are not mixed with them. */
  soon?: string[]
}

const RAW_SECTIONS: SettingsSection[] = [
  {
    title: 'Settings',
    items: [
      { title: 'Account Center', to: '/settings/account' },
      { title: 'Audience Settings', to: '/settings/privacy' },
    ],
  },
  {
    title: 'Preferences',
    inline: 'language',
    items: [
      { title: 'Accessibility & Media', to: '/settings/display' },
      { title: 'Copy Text', to: '/settings/copy-text' },
    ],
  },
  {
    title: 'Audience & Visibility',
    items: [
      { title: 'Profile Lock', to: '/settings/privacy' },
      { title: 'Profile Details', to: '/settings/profile' },
      { title: 'How People Find and Contact You', to: '/settings/privacy' },
      { title: 'Posts' },
      { title: 'Stories' },
      { title: 'Profile and Tagging' },
      { title: 'Active Status', to: '/settings/privacy' },
      { title: 'Privacy Options: Public, Friends, Followers, Only Me' },
    ],
  },
  {
    title: 'Activity',
    items: [
      { title: 'Activity Log', to: '/settings/activity' },
      { title: 'Your Posts', to: '/settings/activity' },
      { title: 'Comments and Reactions', to: '/settings/activity' },
      { title: 'Search History', to: '/settings/search-history' },
      { title: 'Recently Deleted' },
    ],
  },
  {
    title: 'Themes',
    inline: 'themes',
    items: [
    ],
  },
  {
    title: 'Security & Privacy',
    items: [
      { title: 'Change Password', to: '/settings/privacy' },
      { title: 'Two-Factor Authentication', to: '/settings/two-factor' },
      { title: 'Login Activity', to: '/settings/privacy' },
      { title: 'Blocked Accounts', to: '/settings/blocked' },
      { title: 'Restricted Accounts', to: '/settings/restricted' },
    ],
  },
  {
    title: 'Notifications',
    inline: 'push',
    items: [
      { title: 'In-App Notifications' },
      { title: 'Email Notifications' },
      { title: 'Notification Sounds' },
      { title: 'Notification Preferences', to: '/settings/notification-prefs' },
    ],
  },
  {
    title: 'Help & Legal',
    items: [
      { title: 'Help Center', to: '/settings/help' },
      { title: 'Report a Problem', to: '/settings/support/problem' },
      { title: 'Terms of Service', to: '/terms' },
      { title: 'Privacy Policy', to: '/privacy-policy' },
      { title: 'About iConnecto', to: '/settings/about' },
    ],
  },
  {
    title: 'Privacy Center',
    items: [
      { title: 'Privacy Checkup', to: '/settings/privacy' },
      { title: 'Profile Visibility', to: '/settings/privacy' },
      { title: 'Private Account', to: '/settings/privacy' },
      { title: 'Blocked Users', to: '/settings/blocked' },
      { title: 'Restricted Users', to: '/settings/restricted' },
      { title: 'Who Can See My Content', to: '/settings/privacy' },
      { title: 'Manage Personal Information', to: '/settings/your-data' },
    ],
  },
  {
    title: 'Login & Devices',
    items: [
      { title: 'Logged-in Devices', to: '/settings/privacy' },
      { title: 'Device History', to: '/settings/devices' },
      { title: 'Logout From All Devices', to: '/settings/devices' },
      { title: 'Suspicious Login Alerts', to: '/settings/security-alerts' },
      { title: 'Login Notifications', to: '/settings/security-alerts' },
      { title: 'Manage Active Sessions', to: '/settings/devices' },
    ],
  },
  {
    title: 'Messaging Settings',
    items: [
      { title: 'Message Requests', to: '/messages?requests=1' },
      { title: 'Read Receipts ON/OFF', to: '/message-settings/privacy' },
      { title: 'Typing Status ON/OFF', to: '/message-settings/privacy' },
      { title: 'Online Status ON/OFF', to: '/message-settings/privacy' },
      { title: 'Who Can Message You', to: '/settings/privacy' },
      { title: 'Group Invitation Settings' },
      { title: 'Media Auto-Download', to: '/settings/display' },
    ],
  },
  {
    title: 'Interaction Settings',
    items: [
      { title: 'Who Can Comment', to: '/settings/privacy' },
      { title: 'Who Can Mention You' },
      { title: 'Who Can Tag You' },
      { title: 'Who Can React to Posts' },
      { title: 'Who Can Share Your Posts' },
      { title: 'Manual Tag Approval' },
    ],
  },
  {
    title: 'Feed Preferences',
    items: [
      { title: 'Favorites', to: '/settings/favorites' },
      { title: 'Unfollow Accounts' },
      { title: 'Snooze Accounts', to: '/settings/snoozed' },
      { title: 'Hidden Posts', to: '/settings/hidden-posts' },
      { title: 'Content Recommendations' },
      { title: 'Manage Interests' },
      { title: 'Show Less / Show More Content' },
    ],
  },
  {
    title: 'Reels Settings',
    items: [
      { title: 'Autoplay ON/OFF', to: '/settings/display' },
      { title: 'Video Quality' },
      { title: 'Upload Quality' },
      { title: 'Captions ON/OFF' },
      { title: 'Data Usage', to: '/settings/display' },
      { title: 'Reels Preferences' },
      { title: 'Allow Remixing' },
      { title: 'Allow Reel Sharing' },
    ],
  },
  {
    title: 'Creator Tools',
    items: [
      { title: 'Professional Dashboard', to: '/settings/insights' },
      { title: 'Creator Insights', to: '/settings/insights' },
      { title: 'Audience Analytics' },
      { title: 'Creator Profile' },
      { title: 'Monetization (when available)' },
      { title: 'Content Performance', to: '/settings/insights' },
      { title: 'Follower Growth' },
      { title: 'Earnings Dashboard (when available)' },
    ],
  },
  {
    title: 'Your Information',
    items: [
      { title: 'Download Your Information', to: '/settings/your-data' },
      { title: 'Export Account Data', to: '/settings/your-data' },
      { title: 'Account Deactivation', to: '/settings/deactivate' },
      { title: 'Account Deletion', to: '/settings/account' },
      { title: 'Data Management', to: '/settings/your-data' },
      { title: 'Manage Uploaded Media', to: '/settings/media' },
    ],
  },
  {
    title: 'Accessibility',
    items: [
      { title: 'Font Size', to: '/settings/display' },
      { title: 'Reduced Motion', to: '/settings/display' },
      { title: 'Screen Reader Support' },
      { title: 'Video Captions' },
      { title: 'Accessibility Preferences', to: '/settings/display' },
      { title: 'High Contrast Mode', to: '/settings/display' },
    ],
  },
  {
    title: 'Support & Feedback',
    items: [
      { title: 'Contact Support', to: '/settings/support/support' },
      { title: 'Report a Bug', to: '/settings/support/bug' },
      { title: 'Request a Feature', to: '/settings/support/feature' },
      { title: 'Report Status', to: '/settings/support/status' },
      { title: 'Frequently Asked Questions', to: '/settings/help' },
      { title: 'Help Center', to: '/settings/help' },
      { title: 'Community Guidelines', to: '/settings/help' },
    ],
  },
  {
    title: 'Verified Badge',
    items: [
      { title: 'Identity Verification' },
      { title: 'Verification Support' },
    ],
  },
  {
    title: 'Close Friends',
    items: [
      { title: 'Create Close Friends List', to: '/settings/close-friends' },
      { title: 'Add or Remove Friends', to: '/settings/close-friends' },
      { title: 'Share Stories with Close Friends', to: '/stories/new' },
      { title: 'Manage Close Friends Visibility', to: '/settings/close-friends' },
    ],
  },
  {
    title: 'Quiet Mode',
    items: [
      { title: 'Enable / Disable Quiet Mode', to: '/settings/notification-prefs' },
      { title: 'Custom Start and End Time', to: '/settings/notification-prefs' },
      { title: 'Pause Notifications', to: '/settings/notification-prefs' },
      { title: 'Automatic Quiet Mode Schedule', to: '/settings/notification-prefs' },
    ],
  },
  {
    title: 'Hidden Words',
    items: [
      { title: 'Filter Offensive Words', to: '/settings/hidden-words' },
      { title: 'Custom Hidden Words', to: '/settings/hidden-words' },
      { title: 'Comment Filtering', to: '/settings/hidden-words' },
      { title: 'Message Request Filtering', to: '/settings/hidden-words' },
      { title: 'Spam Keyword Filtering', to: '/settings/hidden-words' },
    ],
  },
  {
    title: 'Parental Controls',
    items: [
      { title: 'Parental Supervision' },
      { title: 'Screen Time Information' },
      { title: 'Privacy Guidance', to: '/settings/help' },
      { title: 'Restricted Content Settings' },
      { title: 'Supervision Management' },
    ],
  },
  {
    title: 'AI Content Recommendations',
    items: [
      { title: 'Personalized Feed' },
      { title: 'Recommended Reels' },
      { title: 'Interest-Based Content' },
      { title: 'Manage Recommendation Topics' },
      { title: 'Reset Recommendations' },
      { title: 'Not Interested Option', to: '/settings/hidden-posts' },
    ],
  },
  {
    title: 'Account Memorialization',
    items: [
      { title: 'Memorialization Request' },
      { title: 'Memorialized Account Information' },
      { title: 'Legacy Contact' },
      { title: 'Account Memorialization Policy' },
    ],
  },
  {
    title: 'Premium Subscription',
    items: [
      { title: 'iConnecto Premium' },
      { title: 'Subscription Plans' },
      { title: 'Premium Benefits' },
      { title: 'Subscription Management' },
      { title: 'Payment History' },
      { title: 'Cancel Subscription' },
      { title: 'Restore Purchase' },
    ],
  },
  {
    title: 'Profile Customization',
    items: [
      { title: 'Profile Themes', to: '/settings/profile-style' },
      { title: 'Custom Profile Background', to: '/settings/profile-style' },
      { title: 'Profile Accent Colors', to: '/settings/profile-style' },
      { title: 'Custom Profile Layout', to: '/settings/profile-style' },
      { title: 'Profile Music', to: '/settings/profile-style' },
      { title: 'Profile Display Preferences', to: '/settings/profile-style' },
    ],
  },
  {
    title: 'Advanced Media Controls',
    items: [
      { title: 'HD Photo Upload' },
      { title: 'HD Video Upload' },
      { title: 'Original Quality Upload' },
      { title: 'Automatic Video Compression' },
      { title: 'Media Storage Management', to: '/settings/media' },
      { title: 'Upload Preferences' },
    ],
  },
  {
    title: 'Creator Monetization',
    items: [
      { title: 'Creator Eligibility' },
      { title: 'Monetization Status' },
      { title: 'Creator Earnings' },
      { title: 'Payment Information' },
      { title: 'Payout History' },
      { title: 'Monetization Policy' },
    ],
  },
  {
    title: 'Advanced Chat Features',
    items: [
      { title: 'Chat Themes', to: '/message-settings/themes' },
      { title: 'Custom Chat Wallpaper', to: '/message-settings/wallpaper' },
      { title: 'Disappearing Messages', to: '/messages' },
      { title: 'Message Privacy', to: '/message-settings/privacy' },
      { title: 'Chat Backup' },
      { title: 'Manage Archived Chats', to: '/message-settings/archived' },
    ],
  },
  {
    title: 'Digital Wellbeing',
    items: [
      { title: 'Daily Usage Information', to: '/settings/wellbeing' },
      { title: 'Screen Time Reminder', to: '/settings/wellbeing' },
      { title: 'Break Reminders', to: '/settings/wellbeing' },
      { title: 'Quiet Hours', to: '/settings/notification-prefs' },
      { title: 'Notification Summary' },
    ],
  },
  {
    title: 'Content Safety',
    items: [
      { title: 'Sensitive Content Controls' },
      { title: 'Spam Protection' },
      { title: 'Offensive Content Filtering', to: '/settings/hidden-words' },
      { title: 'Reported Content History' },
      { title: 'Community Safety Preferences' },
    ],
  },
  {
    title: 'Advanced Account Protection',
    items: [
      { title: 'Passkeys', to: '/settings/two-factor' },
      { title: 'Two-Factor Authentication', to: '/settings/two-factor' },
      { title: 'Trusted Devices', to: '/settings/devices' },
      { title: 'Security Alerts', to: '/settings/security-alerts' },
      { title: 'Recovery Email and Phone', to: '/settings/change-email' },
      { title: 'Account Recovery' },
    ],
  },
]

/** Top-level groups shown on the Settings screen. Each lists the sections above that live inside it. */
export const SETTINGS_GROUPS: { title: string; caption: string; sections: string[] }[] = [
  { title: 'Account', caption: 'Your account, profile, data and sign-in.', sections: ['Settings', 'Your Information', 'Verified Badge'] },
  { title: 'Privacy', caption: 'Control who can see and do things with your content.', sections: ['Audience & Visibility', 'Privacy Center', 'Interaction Settings', 'Close Friends', 'Hidden Words', 'Content Safety', 'Parental Controls'] },
  { title: 'Security', caption: 'Passwords, devices and ways to protect your account.', sections: ['Security & Privacy', 'Login & Devices', 'Advanced Account Protection'] },
  { title: 'Notifications & Wellbeing', caption: 'Alerts, quiet time and healthy use.', sections: ['Notifications', 'Quiet Mode', 'Digital Wellbeing'] },
  { title: 'Feed, Reels & Media', caption: 'Customize what you see and how media loads.', sections: ['Feed Preferences', 'AI Content Recommendations', 'Activity', 'Reels Settings', 'Advanced Media Controls'] },
  { title: 'Appearance & Language', caption: 'Language, theme and how the app looks.', sections: ['Preferences', 'Themes', 'Accessibility', 'Profile Customization'] },
  { title: 'Help & Legal', caption: 'Get help, send feedback and read our policies.', sections: ['Help & Legal', 'Support & Feedback'] },
]

/** URL-friendly name of a section, used in /settings/section/:slug. */
export const sectionSlug = (title: string): string => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Row names where the first item of a screen would be a confusing label for the merged row. Key: "Section|route". */
const LABELS: Record<string, string> = {
  'Audience & Visibility|/settings/privacy': 'Privacy & visibility',
  'Privacy Center|/settings/privacy': 'Privacy & visibility',
  'Security & Privacy|/settings/privacy': 'Password & account privacy',
  'Login & Devices|/settings/privacy': 'Login activity',
  'Login & Devices|/settings/devices': 'Devices & sessions',
  'Messaging Settings|/message-settings/privacy': 'Read receipts, typing & online status',
  'Close Friends|/settings/close-friends': 'Close Friends list',
  'Close Friends|/stories/new': 'Share a story with Close Friends',
  'Quiet Mode|/settings/notification-prefs': 'Quiet mode & pause notifications',
  'Hidden Words|/settings/hidden-words': 'Hidden words',
  'Accessibility|/settings/display': 'Text size, motion & contrast',
  'Digital Wellbeing|/settings/wellbeing': 'Usage & break reminders',
  'Digital Wellbeing|/settings/notification-prefs': 'Quiet hours',
  'Content Safety|/settings/hidden-words': 'Hidden words & filtering',
  'Reels Settings|/settings/display': 'Autoplay & data usage',
  'Creator Tools|/settings/insights': 'Creator insights',
  'AI Content Recommendations|/settings/hidden-posts': 'Hidden posts (not interested)',
  'Profile Customization|/settings/profile-style': 'Profile style',
  'Advanced Account Protection|/settings/two-factor': 'Passkeys & two-factor',
  'Your Information|/settings/your-data': 'Your data',
}

/** One row per screen: items that open the same screen are merged, and items without a screen move to `soon`. */
export const SETTINGS_SECTIONS: SettingsSection[] = RAW_SECTIONS.map((sec) => {
  const seen = new Set<string>()
  const items: SettingsItem[] = []
  const soon: string[] = []
  for (const it of sec.items) {
    if (!it.to) { soon.push(it.title); continue }
    if (seen.has(it.to)) continue
    seen.add(it.to)
    items.push({ title: LABELS[`${sec.title}|${it.to}`] ?? it.title, to: it.to })
  }
  return { ...sec, items, soon }
})
