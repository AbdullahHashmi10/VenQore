import 'package:flutter/material.dart';

import 'mobile_section_page.dart';

class CustomersCenterScreen extends StatelessWidget {
  const CustomersCenterScreen({super.key});

  @override
  Widget build(BuildContext context) => const MobileSectionPage(
    title: 'Customers',
    introduction:
        'Find people quickly and understand their sales and balances.',
    icon: Icons.people_alt_rounded,
    actions: [
      MobilePageAction(
        title: 'All customers',
        subtitle: 'Search customer records and contact details.',
        icon: Icons.people_outline_rounded,
        path: '/customers',
        emphasized: true,
      ),
      MobilePageAction(
        title: 'Add customer',
        subtitle: 'Create a customer record for future sales.',
        icon: Icons.person_add_alt_1_rounded,
        path: '/customers/create',
        badge: 'NEW',
      ),
      MobilePageAction(
        title: 'Customer balances',
        subtitle: 'Review receivables and outstanding amounts.',
        icon: Icons.account_balance_wallet_outlined,
        path: '/reports/aged-receivables',
      ),
      MobilePageAction(
        title: 'Statements',
        subtitle: 'Open customer transaction statements.',
        icon: Icons.summarize_outlined,
        path: '/reports/party-statement',
      ),
      MobilePageAction(
        title: 'Customer insights',
        subtitle: 'Review customer activity and trends.',
        icon: Icons.insights_outlined,
        path: '/reports/customer-insights',
      ),
    ],
  );
}
