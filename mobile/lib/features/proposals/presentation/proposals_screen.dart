import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';

class ProposalsScreen extends ConsumerWidget {
  const ProposalsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('My Proposals'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Active'),
              Tab(text: 'Submitted'),
              Tab(text: 'Archived'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _ProposalList(status: 'active'),
            _ProposalList(status: 'submitted'),
            _ProposalList(status: 'archived'),
          ],
        ),
      ),
    );
  }
}

class _ProposalList extends StatelessWidget {
  final String status;

  const _ProposalList({required this.status});

  @override
  Widget build(BuildContext context) {
    // Mock data for now
    final proposals = [
      {
        'title': 'E-commerce Website Development',
        'client': 'Tech Solutions Inc.',
        'bid': 2500,
        'status': 'PENDING',
        'date': '2 days ago',
      },
      {
        'title': 'Mobile App UI/UX Design',
        'client': 'StartupXYZ',
        'bid': 1500,
        'status': 'SHORTLISTED',
        'date': '3 days ago',
      },
      {
        'title': 'API Development for SaaS Platform',
        'client': 'Enterprise Corp',
        'bid': 3500,
        'status': 'PENDING',
        'date': '1 week ago',
      },
    ];

    if (proposals.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.description_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No proposals yet',
              style: TextStyle(fontSize: 18, color: Colors.grey[600]),
            ),
            const SizedBox(height: 8),
            Text(
              'Start submitting proposals to find work',
              style: TextStyle(color: Colors.grey[500]),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: proposals.length,
      itemBuilder: (context, index) {
        final proposal = proposals[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        proposal['title'] as String,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    _StatusBadge(status: proposal['status'] as String),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  proposal['client'] as String,
                  style: TextStyle(color: Colors.grey[600]),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.successColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(
                        '\$${proposal['bid']}',
                        style: TextStyle(
                          color: AppTheme.successColor,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const Spacer(),
                    Icon(Icons.access_time, size: 14, color: Colors.grey[500]),
                    const SizedBox(width: 4),
                    Text(
                      proposal['date'] as String,
                      style: TextStyle(
                        color: Colors.grey[500],
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    String text;

    switch (status) {
      case 'ACCEPTED':
        color = AppTheme.successColor;
        text = 'Accepted';
        break;
      case 'SHORTLISTED':
        color = AppTheme.primaryColor;
        text = 'Shortlisted';
        break;
      case 'REJECTED':
        color = AppTheme.errorColor;
        text = 'Rejected';
        break;
      default:
        color = AppTheme.warningColor;
        text = 'Pending';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
