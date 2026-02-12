import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';

class ContractsScreen extends ConsumerWidget {
  const ContractsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('My Contracts'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Active'),
              Tab(text: 'Completed'),
              Tab(text: 'Cancelled'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _ContractsList(status: 'active'),
            _ContractsList(status: 'completed'),
            _ContractsList(status: 'cancelled'),
          ],
        ),
      ),
    );
  }
}

class _ContractsList extends StatelessWidget {
  final String status;

  const _ContractsList({required this.status});

  @override
  Widget build(BuildContext context) {
    // Mock contracts
    final contracts = status == 'active'
        ? [
            {
              'id': '1',
              'title': 'E-commerce Website Development',
              'client': 'Tech Solutions Inc.',
              'amount': 2500.0,
              'type': 'FIXED',
              'progress': 0.4,
              'startDate': 'Jan 15, 2024',
              'deadline': 'Mar 15, 2024',
              'currentMilestone': 'Design Phase',
            },
            {
              'id': '2',
              'title': 'Mobile App UI/UX Design',
              'client': 'StartupXYZ',
              'amount': 75.0,
              'type': 'HOURLY',
              'hoursLogged': 32,
              'startDate': 'Feb 1, 2024',
              'deadline': 'Ongoing',
              'progress': 0.6,
            },
          ]
        : status == 'completed'
            ? [
                {
                  'id': '3',
                  'title': 'Landing Page Design',
                  'client': 'Creative Agency',
                  'amount': 800.0,
                  'type': 'FIXED',
                  'progress': 1.0,
                  'completedDate': 'Dec 20, 2023',
                  'rating': 5.0,
                },
              ]
            : [];

    if (contracts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.assignment_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No $status contracts',
              style: TextStyle(fontSize: 18, color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: contracts.length,
      itemBuilder: (context, index) {
        final contract = contracts[index];
        return _ContractCard(
          contract: contract,
          onTap: () {
            context.push('/contracts/${contract['id']}');
          },
        );
      },
    );
  }
}

class _ContractCard extends StatelessWidget {
  final Map<String, dynamic> contract;
  final VoidCallback onTap;

  const _ContractCard({
    required this.contract,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isHourly = contract['type'] == 'HOURLY';
    final progress = contract['progress'] as double;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          contract['title'] as String,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          contract['client'] as String,
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: isHourly
                          ? AppTheme.primaryColor.withOpacity(0.1)
                          : AppTheme.successColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      isHourly ? 'Hourly' : 'Fixed',
                      style: TextStyle(
                        color: isHourly ? AppTheme.primaryColor : AppTheme.successColor,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Amount & Progress
              Row(
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Budget',
                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        isHourly
                            ? '\$${(contract['amount'] as double).toStringAsFixed(0)}/hr'
                            : '\$${(contract['amount'] as double).toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.successColor,
                        ),
                      ),
                    ],
                  ),
                  if (isHourly) ...[
                    const SizedBox(width: 24),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Hours Logged',
                          style: TextStyle(color: Colors.grey[600], fontSize: 12),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${contract['hoursLogged']}h',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                  const Spacer(),
                  if (contract['rating'] != null)
                    Row(
                      children: [
                        Icon(Icons.star, size: 20, color: AppTheme.warningColor),
                        const SizedBox(width: 4),
                        Text(
                          (contract['rating'] as double).toStringAsFixed(1),
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                ],
              ),

              if (progress < 1.0) ...[
                const SizedBox(height: 16),

                // Progress bar
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          contract['currentMilestone'] ?? 'In Progress',
                          style: TextStyle(color: Colors.grey[600], fontSize: 13),
                        ),
                        Text(
                          '${(progress * 100).toInt()}%',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: progress,
                        backgroundColor: Colors.grey[200],
                        valueColor: AlwaysStoppedAnimation<Color>(
                          AppTheme.primaryColor,
                        ),
                        minHeight: 6,
                      ),
                    ),
                  ],
                ),
              ],

              const SizedBox(height: 12),
              const Divider(),
              const SizedBox(height: 8),

              // Footer
              Row(
                children: [
                  Icon(Icons.calendar_today, size: 14, color: Colors.grey[500]),
                  const SizedBox(width: 4),
                  Text(
                    contract['completedDate'] ?? 'Due: ${contract['deadline']}',
                    style: TextStyle(color: Colors.grey[500], fontSize: 12),
                  ),
                  const Spacer(),
                  if (progress < 1.0) ...[
                    TextButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.chat_bubble_outline, size: 16),
                      label: const Text('Message'),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
