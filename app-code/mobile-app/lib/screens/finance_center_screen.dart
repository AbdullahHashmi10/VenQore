import 'package:flutter/material.dart';

import 'mobile_section_page.dart';

class FinanceCenterScreen extends StatelessWidget {
  const FinanceCenterScreen({super.key});

  @override
  Widget build(BuildContext context) => const MobileSectionPage(
    title: 'Money & accounts',
    introduction:
        'Follow cash, expenses, payments, banking, and accounting activity.',
    icon: Icons.account_balance_rounded,
    actions: [
      MobilePageAction(
        title: 'Transactions',
        subtitle: 'See money entering and leaving the business.',
        icon: Icons.swap_vert_circle_outlined,
        path: '/transactions',
        emphasized: true,
      ),
      MobilePageAction(
        title: 'New expense',
        subtitle: 'Record a business cost and payment details.',
        icon: Icons.payments_outlined,
        path: '/expenses/create',
        badge: 'QUICK',
      ),
      MobilePageAction(
        title: 'Expenses',
        subtitle: 'Search and manage recorded expenses.',
        icon: Icons.receipt_outlined,
        path: '/expenses',
      ),
      MobilePageAction(
        title: 'Receive payment',
        subtitle: 'Record money received from a customer.',
        icon: Icons.south_west_rounded,
        path: '/payments/in',
      ),
      MobilePageAction(
        title: 'Send payment',
        subtitle: 'Record a permitted outgoing payment.',
        icon: Icons.north_east_rounded,
        path: '/payments/out',
      ),
      MobilePageAction(
        title: 'Funds',
        subtitle: 'Review configured cash and business funds.',
        icon: Icons.account_balance_outlined,
        path: '/funds',
      ),
      MobilePageAction(
        title: 'Accounting',
        subtitle: 'Open ledgers, journals, and financial controls.',
        icon: Icons.calculate_outlined,
        path: '/accounting',
      ),
    ],
  );
}
