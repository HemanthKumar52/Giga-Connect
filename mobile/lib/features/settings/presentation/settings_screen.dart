import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: ListView(
        children: [
          const SizedBox(height: 16),

          // Account Section
          _SectionHeader(title: 'Account'),
          _SettingsTile(
            icon: Icons.person_outline,
            title: 'Edit Profile',
            subtitle: 'Update your personal information',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.lock_outline,
            title: 'Change Password',
            subtitle: 'Update your password',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.security,
            title: 'Two-Factor Authentication',
            subtitle: 'Add extra security to your account',
            trailing: Switch(
              value: false,
              onChanged: (value) {},
              activeColor: AppTheme.primaryColor,
            ),
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.fingerprint,
            title: 'Biometric Login',
            subtitle: 'Use fingerprint or face ID',
            trailing: Switch(
              value: true,
              onChanged: (value) {},
              activeColor: AppTheme.primaryColor,
            ),
            onTap: () {},
          ),

          const SizedBox(height: 24),

          // Notifications Section
          _SectionHeader(title: 'Notifications'),
          _SettingsTile(
            icon: Icons.notifications_outlined,
            title: 'Push Notifications',
            subtitle: 'Receive push notifications',
            trailing: Switch(
              value: true,
              onChanged: (value) {},
              activeColor: AppTheme.primaryColor,
            ),
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.email_outlined,
            title: 'Email Notifications',
            subtitle: 'Receive email updates',
            trailing: Switch(
              value: true,
              onChanged: (value) {},
              activeColor: AppTheme.primaryColor,
            ),
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.chat_bubble_outline,
            title: 'Message Notifications',
            subtitle: 'Get notified for new messages',
            trailing: Switch(
              value: true,
              onChanged: (value) {},
              activeColor: AppTheme.primaryColor,
            ),
            onTap: () {},
          ),

          const SizedBox(height: 24),

          // Payment Section
          _SectionHeader(title: 'Payments'),
          _SettingsTile(
            icon: Icons.payment,
            title: 'Payment Methods',
            subtitle: 'Manage your payment options',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.account_balance,
            title: 'Payout Settings',
            subtitle: 'Configure how you receive payments',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.receipt_long,
            title: 'Billing History',
            subtitle: 'View past transactions',
            onTap: () {},
          ),

          const SizedBox(height: 24),

          // Preferences Section
          _SectionHeader(title: 'Preferences'),
          _SettingsTile(
            icon: Icons.dark_mode_outlined,
            title: 'Dark Mode',
            subtitle: 'Toggle dark theme',
            trailing: Switch(
              value: false,
              onChanged: (value) {},
              activeColor: AppTheme.primaryColor,
            ),
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.language,
            title: 'Language',
            subtitle: 'English',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.attach_money,
            title: 'Currency',
            subtitle: 'USD',
            onTap: () {},
          ),

          const SizedBox(height: 24),

          // Support Section
          _SectionHeader(title: 'Support'),
          _SettingsTile(
            icon: Icons.help_outline,
            title: 'Help Center',
            subtitle: 'Get help and support',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.feedback_outlined,
            title: 'Send Feedback',
            subtitle: 'Help us improve',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.info_outline,
            title: 'About',
            subtitle: 'Version 1.0.0',
            onTap: () {},
          ),

          const SizedBox(height: 24),

          // Legal Section
          _SectionHeader(title: 'Legal'),
          _SettingsTile(
            icon: Icons.description_outlined,
            title: 'Terms of Service',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.privacy_tip_outlined,
            title: 'Privacy Policy',
            onTap: () {},
          ),

          const SizedBox(height: 24),

          // Danger Zone
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Danger Zone',
                  style: TextStyle(
                    color: Colors.red[700],
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 8),
                Card(
                  color: Colors.red[50],
                  child: Column(
                    children: [
                      ListTile(
                        leading: Icon(Icons.pause_circle_outline, color: Colors.red[700]),
                        title: Text(
                          'Deactivate Account',
                          style: TextStyle(color: Colors.red[700]),
                        ),
                        subtitle: const Text('Temporarily disable your account'),
                        trailing: Icon(Icons.chevron_right, color: Colors.red[700]),
                        onTap: () {
                          _showDeactivateDialog(context);
                        },
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: Icon(Icons.delete_forever, color: Colors.red[700]),
                        title: Text(
                          'Delete Account',
                          style: TextStyle(color: Colors.red[700]),
                        ),
                        subtitle: const Text('Permanently delete your account'),
                        trailing: Icon(Icons.chevron_right, color: Colors.red[700]),
                        onTap: () {
                          _showDeleteDialog(context);
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  void _showDeactivateDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Deactivate Account'),
        content: const Text(
          'Are you sure you want to deactivate your account? You can reactivate it by logging in again.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Account deactivated')),
              );
            },
            child: const Text('Deactivate', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _showDeleteDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Account'),
        content: const Text(
          'This action is irreversible. All your data, contracts, and earnings will be permanently deleted.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;

  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Text(
        title,
        style: TextStyle(
          color: Colors.grey[600],
          fontWeight: FontWeight.bold,
          fontSize: 14,
        ),
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback onTap;

  const _SettingsTile({
    required this.icon,
    required this.title,
    this.subtitle,
    this.trailing,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: Colors.grey[700]),
      title: Text(title),
      subtitle: subtitle != null ? Text(subtitle!) : null,
      trailing: trailing ?? const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}
