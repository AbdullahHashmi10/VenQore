import 'package:flutter/material.dart';

import 'mobile_section_page.dart';

class TeamCenterScreen extends StatelessWidget {
  const TeamCenterScreen({super.key});

  @override
  Widget build(BuildContext context) => const MobileSectionPage(
    title: 'Team & access',
    introduction:
        'Manage people and access while keeping each role within its permissions.',
    icon: Icons.badge_rounded,
    actions: [
      MobilePageAction(
        title: 'Team members',
        subtitle: 'View staff profiles and current access.',
        icon: Icons.badge_outlined,
        path: '/staff',
        emphasized: true,
      ),
      MobilePageAction(
        title: 'Manage employees',
        subtitle: 'Add employees and maintain their workspace access.',
        icon: Icons.person_add_alt_rounded,
        path: '/admin-panel/users',
        badge: 'ADMIN',
      ),
      MobilePageAction(
        title: 'Attendance',
        subtitle: 'Review staff attendance and recorded gaps.',
        icon: Icons.event_available_outlined,
        path: '/staff/attendance',
      ),
      MobilePageAction(
        title: 'Approvals',
        subtitle: 'Review requests waiting for a decision.',
        icon: Icons.approval_outlined,
        path: '/approvals',
      ),
      MobilePageAction(
        title: 'Activity log',
        subtitle: 'Review traceable business activity.',
        icon: Icons.manage_history_rounded,
        path: '/activity-log',
      ),
    ],
  );
}
