import 'package:flutter/material.dart';

import 'mobile_section_page.dart';

class PosCenterScreen extends StatelessWidget {
  const PosCenterScreen({super.key});

  @override
  Widget build(BuildContext context) => const MobileSectionPage(
    title: 'Point of sale',
    introduction:
        'Open the till and reach the supporting checkout tools your role allows.',
    icon: Icons.point_of_sale_rounded,
    actions: [
      MobilePageAction(
        title: 'Open POS',
        subtitle: 'Start selling from your active register.',
        icon: Icons.point_of_sale_rounded,
        path: '/pos',
        emphasized: true,
        badge: 'OPEN',
      ),
      MobilePageAction(
        title: 'Parked sales',
        subtitle: 'Resume checkouts saved by the team.',
        icon: Icons.pause_circle_outline_rounded,
        path: '/sales/parked-items',
      ),
      MobilePageAction(
        title: 'POS sessions',
        subtitle: 'Review register openings, closings, and totals.',
        icon: Icons.schedule_rounded,
        path: '/shifts/history',
      ),
      MobilePageAction(
        title: 'Cash movements',
        subtitle: 'Review permitted cash in and cash out activity.',
        icon: Icons.payments_outlined,
        path: '/transactions',
      ),
      MobilePageAction(
        title: 'Returns and refunds',
        subtitle: 'Find the original sale before processing a return.',
        icon: Icons.currency_exchange_rounded,
        path: '/returns-history',
      ),
    ],
  );
}
