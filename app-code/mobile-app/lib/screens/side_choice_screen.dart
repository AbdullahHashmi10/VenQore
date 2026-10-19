import 'package:flutter/material.dart';

import '../core/app_side.dart';
import '../theme/app_colors.dart';
import '../theme/vq.dart';
import '../widgets/brand_logo.dart';
import '../widgets/motion.dart';
import '../widgets/vq_widgets.dart';
import 'business_web_screen.dart';
import 'help_screen.dart';
import 'register_screen.dart';
import 'sign_in_screen.dart';

/// The front door. One big mesh card for people who want to order (the marketplace), one smaller card
/// for people who work at or own a store. Nobody is asked their role: the server knows it at sign-in.
class SideChoiceScreen extends StatelessWidget {
  const SideChoiceScreen({super.key});

  /// Opens the chosen side (used by the splash for someone who already chose).
  static Route<void> routeFor(AppSide side) {
    return MaterialPageRoute<void>(
      builder: (_) => side == AppSide.customer
          ? const BusinessWebScreen(
              initialPath: '/shop',
              initialTitle: 'Explore stores',
            )
          : const BusinessWebScreen(
              initialPath: '/dashboard',
              initialTitle: 'VenQore Business',
            ),
    );
  }

  Future<void> _go(BuildContext context, AppSide side, Widget page) async {
    await AppSideStore.set(side);
    if (!context.mounted) return;
    Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => page));
  }

  Future<void> _explore(BuildContext context) async {
    await AppSideStore.set(AppSide.customer);
    if (!context.mounted) return;
    Navigator.of(context).pushReplacement(routeFor(AppSide.customer));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SafeArea(
        child: CustomScrollView(
          physics: const ClampingScrollPhysics(),
          slivers: [
            SliverFillRemaining(
              hasScrollBody: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: Column(
                  children: [
                    _Header(
                      onHelp: () => Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => const HelpScreen(),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Expanded(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(minHeight: 560),
                        child: FadeSlideIn(
                          child: _MarketplaceHero(
                            onExplore: () => _explore(context),
                            onSignIn: () => _go(
                              context,
                              AppSide.customer,
                              const SignInScreen(side: AppSide.customer),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    FadeSlideIn(
                      delay: const Duration(milliseconds: 120),
                      child: _StoreCard(
                        onSignIn: () => _go(
                          context,
                          AppSide.store,
                          const SignInScreen(side: AppSide.store),
                        ),
                        onCreate: () => _go(
                          context,
                          AppSide.store,
                          const RegisterScreen(side: AppSide.store),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.onHelp});

  final VoidCallback onHelp;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.line),
            boxShadow: Vq.elev1,
          ),
          child: const BrandLogo(size: 36, borderRadius: 12),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Flexible(
                    child: Text(
                      'VenQore',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Vq.display(18),
                    ),
                  ),
                ],
              ),
              Text(
                'Order. Sell. Deliver.',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Vq.sans(13, color: AppColors.inkFaint, weight: 500),
              ),
            ],
          ),
        ),
        IconButton(
          tooltip: 'Help',
          onPressed: onHelp,
          icon: const Icon(
            Icons.help_outline_rounded,
            color: AppColors.inkMuted,
            size: 22,
          ),
        ),
      ],
    );
  }
}

class _MarketplaceHero extends StatelessWidget {
  const _MarketplaceHero({required this.onExplore, required this.onSignIn});

  final VoidCallback onExplore;
  final VoidCallback onSignIn;

  static const _categories = <(IconData, String)>[
    (Icons.restaurant_rounded, 'Restaurants'),
    (Icons.local_grocery_store_rounded, 'Groceries'),
    (Icons.local_pharmacy_rounded, 'Pharmacy'),
    (Icons.checkroom_rounded, 'Fashion'),
    (Icons.devices_rounded, 'Electronics'),
    (Icons.more_horiz_rounded, 'And more'),
  ];

  @override
  Widget build(BuildContext context) {
    return PressableScale(
      onTap: onExplore,
      borderRadius: Vq.r2xl,
      child: VqMesh(
        borderRadius: BorderRadius.circular(Vq.r2xl),
        shadow: Vq.glowStrong,
        border: Border.all(color: const Color(0x4759DBC0)),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'MARKETPLACE',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Vq.eyebrow(color: AppColors.teal200),
                  ),
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: onSignIn,
                    child: VqGlass(
                      fill: const Color(0x29FFFFFF),
                      line: const Color(0x47FFFFFF),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 7,
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.person_rounded,
                            size: 14,
                            color: AppColors.teal300,
                          ),
                          const SizedBox(width: 6),
                          Flexible(
                            child: Text(
                              'Sign in',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Vq.sans(
                                14,
                                color: const Color(0xFFF4FFFB),
                                weight: 600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const Spacer(),
            Text(
              'Everything you need, from stores near you.',
              style: Vq.display(
                28,
                color: const Color(0xFFF4FFFB),
                height: 1.06,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              'Food, groceries, medicine, clothes and electronics. Pin your location, pick a store and order for delivery or pickup.',
              style: Vq.sans(14, color: const Color(0xD1EAFBF5), height: 1.5),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final c in _categories)
                  VqGlass(
                    fill: const Color(0x1AFFFFFF),
                    line: const Color(0x29FFFFFF),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(c.$1, size: 14, color: AppColors.teal200),
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            c.$2,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Vq.sans(
                              13.5,
                              color: const Color(0xFFF4FFFB),
                              weight: 600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            const Spacer(),
            VqButton(
              label: 'Find stores near me',
              icon: Icons.location_on_rounded,
              trailing: Icons.arrow_forward_rounded,
              kind: VqButtonKind.white,
              height: 50,
              onTap: onExplore,
            ),
          ],
        ),
      ),
    );
  }
}

class _StoreCard extends StatelessWidget {
  const _StoreCard({required this.onSignIn, required this.onCreate});

  final VoidCallback onSignIn;
  final VoidCallback onCreate;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(Vq.rXl),
        border: Border.all(color: AppColors.line),
        boxShadow: Vq.elev2,
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.teal50,
                  borderRadius: BorderRadius.circular(Vq.rMd),
                  border: Border.all(color: AppColors.teal200),
                ),
                child: const Icon(
                  Icons.storefront_rounded,
                  size: 18,
                  color: AppColors.teal700,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Own or work at a store?',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Vq.display(16),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Owners, staff & riders',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Vq.sans(
                        13,
                        color: AppColors.inkFaint,
                        weight: 500,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 6),
              const SizedBox(
                width: 54,
                height: 24,
                child: Stack(
                  children: [
                    Positioned(
                      left: 0,
                      child: VqAvatar(
                        name: 'Owner',
                        size: 24,
                        color: AppColors.teal400,
                      ),
                    ),
                    Positioned(
                      left: 15,
                      child: VqAvatar(
                        name: 'Staff',
                        size: 24,
                        color: Vq.butter400,
                      ),
                    ),
                    Positioned(
                      left: 30,
                      child: VqAvatar(
                        name: 'Rider',
                        size: 24,
                        color: Vq.coral400,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: VqButton(
                  label: 'Store sign in',
                  icon: Icons.lock_outline_rounded,
                  kind: VqButtonKind.plain,
                  height: 38,
                  onTap: onSignIn,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: VqButton(
                  label: 'New store',
                  icon: Icons.add_rounded,
                  kind: VqButtonKind.quiet,
                  height: 38,
                  onTap: onCreate,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
