import 'package:flutter/material.dart';

import 'mobile_section_page.dart';

class SalesCenterScreen extends StatelessWidget {
  const SalesCenterScreen({super.key});

  @override
  Widget build(BuildContext context) => const MobileSectionPage(
    title: 'Sales',
    introduction:
        'Create, find, and continue customer sales from one focused place.',
    icon: Icons.receipt_long_rounded,
    actions: [
      MobilePageAction(
        title: 'New sale',
        subtitle: 'Create an invoice and record payment.',
        icon: Icons.add_circle_outline_rounded,
        path: '/sales/create',
        emphasized: true,
        badge: 'QUICK',
      ),
      MobilePageAction(
        title: 'All sales',
        subtitle: 'Search invoices, dates, customers, and payment status.',
        icon: Icons.manage_search_rounded,
        path: '/sales',
      ),
      MobilePageAction(
        title: 'Sales history',
        subtitle: 'Review completed and recent sales.',
        icon: Icons.history_rounded,
        path: '/sales/list',
      ),
      MobilePageAction(
        title: 'Parked sales',
        subtitle: 'Continue sales that were saved for later.',
        icon: Icons.pause_circle_outline_rounded,
        path: '/sales/parked-items',
      ),
      MobilePageAction(
        title: 'Sale returns',
        subtitle: 'Review or create customer returns.',
        icon: Icons.assignment_return_outlined,
        path: '/returns-history',
      ),
      MobilePageAction(
        title: 'Proposals',
        subtitle: 'Prepare and follow up customer proposals.',
        icon: Icons.request_quote_outlined,
        path: '/proposals',
      ),
      MobilePageAction(
        title: 'Sales orders',
        subtitle: 'Track confirmed orders before invoicing.',
        icon: Icons.inventory_outlined,
        path: '/sales-orders',
      ),
    ],
  );
}
