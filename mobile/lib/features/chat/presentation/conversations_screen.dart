import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';

class ConversationsScreen extends ConsumerWidget {
  const ConversationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Mock data
    final conversations = [
      {
        'name': 'John Smith',
        'avatar': null,
        'lastMessage': 'Thanks for the update! The project is looking great.',
        'time': '2m ago',
        'unread': 2,
        'isOnline': true,
      },
      {
        'name': 'Sarah Johnson',
        'avatar': null,
        'lastMessage': 'Can we schedule a call for tomorrow?',
        'time': '1h ago',
        'unread': 0,
        'isOnline': true,
      },
      {
        'name': 'Michael Chen',
        'avatar': null,
        'lastMessage': 'I have reviewed the milestone. Great work!',
        'time': '3h ago',
        'unread': 0,
        'isOnline': false,
      },
      {
        'name': 'Emily Davis',
        'avatar': null,
        'lastMessage': 'Please check the attached files',
        'time': 'Yesterday',
        'unread': 1,
        'isOnline': false,
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.edit_square),
            onPressed: () {
              // New message
            },
          ),
        ],
      ),
      body: conversations.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.chat_bubble_outline, size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(
                    'No messages yet',
                    style: TextStyle(fontSize: 18, color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Start a conversation with a client or freelancer',
                    style: TextStyle(color: Colors.grey[500]),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          : ListView.builder(
              itemCount: conversations.length,
              itemBuilder: (context, index) {
                final conv = conversations[index];
                return ListTile(
                  onTap: () {
                    final name = conv['name'] as String;
                    context.push('/chat/${index + 1}?name=$name');
                  },
                  leading: Stack(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: AppTheme.primaryColor,
                        child: Text(
                          (conv['name'] as String).substring(0, 1),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                          ),
                        ),
                      ),
                      if (conv['isOnline'] == true)
                        Positioned(
                          right: 0,
                          bottom: 0,
                          child: Container(
                            width: 12,
                            height: 12,
                            decoration: BoxDecoration(
                              color: AppTheme.successColor,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: Colors.white,
                                width: 2,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                  title: Row(
                    children: [
                      Expanded(
                        child: Text(
                          conv['name'] as String,
                          style: TextStyle(
                            fontWeight: (conv['unread'] as int) > 0
                                ? FontWeight.bold
                                : FontWeight.normal,
                          ),
                        ),
                      ),
                      Text(
                        conv['time'] as String,
                        style: TextStyle(
                          fontSize: 12,
                          color: (conv['unread'] as int) > 0
                              ? AppTheme.primaryColor
                              : Colors.grey[500],
                        ),
                      ),
                    ],
                  ),
                  subtitle: Row(
                    children: [
                      Expanded(
                        child: Text(
                          conv['lastMessage'] as String,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: (conv['unread'] as int) > 0
                                ? Colors.black87
                                : Colors.grey[600],
                          ),
                        ),
                      ),
                      if ((conv['unread'] as int) > 0)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '${conv['unread']}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
