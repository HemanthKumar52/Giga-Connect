import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Mock notifications
    final notifications = [
      {
        'id': '1',
        'type': 'proposal_accepted',
        'title': 'Proposal Accepted',
        'message': 'Your proposal for "E-commerce Website Development" has been accepted!',
        'time': '2 minutes ago',
        'isRead': false,
      },
      {
        'id': '2',
        'type': 'message',
        'title': 'New Message',
        'message': 'John Smith sent you a message regarding the project.',
        'time': '15 minutes ago',
        'isRead': false,
      },
      {
        'id': '3',
        'type': 'payment',
        'title': 'Payment Received',
        'message': 'You received \$500 for completing Milestone 1.',
        'time': '1 hour ago',
        'isRead': true,
      },
      {
        'id': '4',
        'type': 'review',
        'title': 'New Review',
        'message': 'Sarah Johnson left you a 5-star review.',
        'time': '3 hours ago',
        'isRead': true,
      },
      {
        'id': '5',
        'type': 'job_match',
        'title': 'New Job Match',
        'message': 'A new job matching your skills is available: "Mobile App Development"',
        'time': '5 hours ago',
        'isRead': true,
      },
      {
        'id': '6',
        'type': 'milestone',
        'title': 'Milestone Due',
        'message': 'Reminder: Milestone 2 for "API Development" is due tomorrow.',
        'time': 'Yesterday',
        'isRead': true,
      },
      {
        'id': '7',
        'type': 'system',
        'title': 'Profile Verification',
        'message': 'Your profile has been verified. You now have a verified badge!',
        'time': '2 days ago',
        'isRead': true,
      },
    ];

    final unreadCount = notifications.where((n) => n['isRead'] == false).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (unreadCount > 0)
            TextButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('All notifications marked as read')),
                );
              },
              child: const Text('Mark all read'),
            ),
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () {
              // Navigate to notification settings
            },
          ),
        ],
      ),
      body: notifications.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.notifications_off_outlined, size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(
                    'No notifications yet',
                    style: TextStyle(fontSize: 18, color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'You\'ll see notifications here',
                    style: TextStyle(color: Colors.grey[500]),
                  ),
                ],
              ),
            )
          : ListView.builder(
              itemCount: notifications.length,
              itemBuilder: (context, index) {
                final notification = notifications[index];
                return _NotificationTile(
                  type: notification['type'] as String,
                  title: notification['title'] as String,
                  message: notification['message'] as String,
                  time: notification['time'] as String,
                  isRead: notification['isRead'] as bool,
                  onTap: () {
                    // Handle notification tap
                  },
                  onDismiss: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Notification dismissed')),
                    );
                  },
                );
              },
            ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final String type;
  final String title;
  final String message;
  final String time;
  final bool isRead;
  final VoidCallback onTap;
  final VoidCallback onDismiss;

  const _NotificationTile({
    required this.type,
    required this.title,
    required this.message,
    required this.time,
    required this.isRead,
    required this.onTap,
    required this.onDismiss,
  });

  IconData _getIcon() {
    switch (type) {
      case 'proposal_accepted':
        return Icons.check_circle;
      case 'message':
        return Icons.chat_bubble;
      case 'payment':
        return Icons.attach_money;
      case 'review':
        return Icons.star;
      case 'job_match':
        return Icons.work;
      case 'milestone':
        return Icons.flag;
      case 'system':
        return Icons.info;
      default:
        return Icons.notifications;
    }
  }

  Color _getIconColor() {
    switch (type) {
      case 'proposal_accepted':
        return AppTheme.successColor;
      case 'message':
        return AppTheme.primaryColor;
      case 'payment':
        return Colors.green;
      case 'review':
        return AppTheme.warningColor;
      case 'job_match':
        return Colors.blue;
      case 'milestone':
        return Colors.orange;
      case 'system':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: Key('notification_$title'),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: Colors.red,
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      onDismissed: (_) => onDismiss(),
      child: Container(
        color: isRead ? null : AppTheme.primaryColor.withOpacity(0.05),
        child: ListTile(
          onTap: onTap,
          leading: Stack(
            children: [
              CircleAvatar(
                backgroundColor: _getIconColor().withOpacity(0.1),
                child: Icon(_getIcon(), color: _getIconColor(), size: 20),
              ),
              if (!isRead)
                Positioned(
                  top: 0,
                  right: 0,
                  child: Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                  ),
                ),
            ],
          ),
          title: Text(
            title,
            style: TextStyle(
              fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
            ),
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 4),
              Text(
                message,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                time,
                style: TextStyle(
                  color: Colors.grey[500],
                  fontSize: 12,
                ),
              ),
            ],
          ),
          isThreeLine: true,
        ),
      ),
    );
  }
}
