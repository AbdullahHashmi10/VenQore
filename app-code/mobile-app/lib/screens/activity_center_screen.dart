import 'package:flutter/material.dart';

import 'mobile_section_page.dart';

class ActivityCenterScreen extends StatelessWidget {
  const ActivityCenterScreen({super.key});

  @override
  Widget build(BuildContext context) => const MobileSectionPage(
    title: 'Activity',
    introduction:
        'Review work that needs attention and follow recent business movement.',
    icon: Icons.notifications_active_outlined,
    actions: [
      MobilePageAction(
        title: 'Approvals',
        subtitle: 'Review documents waiting for a decision.',
        icon: Icons.approval_outlined,
        path: '/approvals',
        emphasized: true,
      ),
      MobilePageAction(
        title: 'Transactions',
        subtitle: 'See the latest money entering and leaving the business.',
        icon: Icons.swap_vert_circle_outlined,
        path: '/transactions',
      ),
      MobilePageAction(
        title: 'Recent sales',
        subtitle: 'Open the searchable sales history.',
        icon: Icons.history_rounded,
        path: '/sales/list',
      ),
      MobilePageAction(
        title: 'Parked sales',
        subtitle: 'Return to sales that were saved for later.',
        icon: Icons.pause_circle_outline_rounded,
        path: '/sales/parked-items',
      ),
    ],
  );
}
