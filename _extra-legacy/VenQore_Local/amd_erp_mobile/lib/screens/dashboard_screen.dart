import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../widgets/nebula_card.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black, // Root background
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'VenQore ERP Dashboard',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w700,
            fontSize: 22,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined, color: Colors.white70),
            onPressed: () {},
          ),
          const CircleAvatar(
            radius: 18,
            backgroundColor: AppColors.indigoOrb,
            child: Text('AH', style: TextStyle(color: Colors.white, fontSize: 13)),
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Cash in Hand & Core Stats Section
            const Text(
              'Financial Overview',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
                letterSpacing: 1.2,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            NebulaCard(
              width: double.infinity,
              padding: const EdgeInsets.all(28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Cash in Hand',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Rs 142,500',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 40,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -1,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildQuickStat('To Receive', 'Rs 45.2k', AppColors.success),
                      _buildQuickStat('To Pay', 'Rs 12.8k', AppColors.danger),
                    ],
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // 2. Quick Actions
            const Text(
              'Quick Actions',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
                letterSpacing: 1.2,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _buildActionCard(Icons.add_shopping_cart, 'New Sale', AppColors.indigoOrb),
                const SizedBox(width: 16),
                _buildActionCard(Icons.inventory_2_outlined, 'New Purchase', AppColors.purpleOrb),
                const SizedBox(width: 16),
                _buildActionCard(Icons.receipt_long, 'Add Expense', AppColors.accentIndigo),
              ],
            ),

            const SizedBox(height: 24),

            // 3. Bank Accounts
            const Text(
              'Bank Accounts',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
                letterSpacing: 1.2,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            _buildBankItem('HBL Limited', '**** 4521', 'Rs 882,000'),
            _buildBankItem('Meezan Bank', '**** 9901', 'Rs 120,450'),

            const SizedBox(height: 24),

            // 4. Activity Feed
            const Text(
              'Recent Activity',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
                letterSpacing: 1.2,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            _buildActivityItem('Inv-2026-105', 'Sale to Ahmed Raza', 'Rs 14,200', AppColors.success),
            _buildActivityItem('Exp-002', 'Shop Rent March', 'Rs 45,000', AppColors.danger),
            _buildActivityItem('Stock Correct', 'Manual Adjustment', '+15 Items', AppColors.warning),
            
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickStat(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            color: color,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildActionCard(IconData icon, String label, Color color) {
    return Expanded(
      child: NebulaCard(
        padding: const EdgeInsets.symmetric(vertical: 24),
        borderRadius: BorderRadius.circular(20),
        orbColors: [color.withOpacity(0.3), color.withOpacity(0.1)],
        child: Column(
          children: [
            Icon(icon, color: Colors.white, size: 28),
            const SizedBox(height: 12),
            Text(
              label,
              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBankItem(String name, String acc, String balance) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.indigoOrb.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.account_balance, color: AppColors.indigoOrb, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
                Text(acc, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              ],
            ),
          ),
          Text(balance, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildActivityItem(String ref, String desc, String amount, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 32,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(desc, style: const TextStyle(color: Colors.white, fontSize: 14)),
                Text(ref, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
              ],
            ),
          ),
          Text(amount, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
