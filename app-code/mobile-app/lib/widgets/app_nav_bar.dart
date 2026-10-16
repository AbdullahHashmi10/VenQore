import 'dart:ui';

import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// The phone bar, drawn natively. It is the same bar as the website's phone bar
/// (`BottomNavBar.jsx`): a floating pill with Dashboard, Contacts, a raised "+" for quick
/// actions, Stock and Settings; the active tab opens up to show its name. The server sends the
/// tabs and the quick actions (`/s/{store}/app-nav`), already filtered for the signed-in role.
class AppNavConfig {
  const AppNavConfig({
    required this.tabs,
    required this.actions,
    required this.hideOn,
  });

  final List<AppNavTab> tabs;
  final List<AppNavAction> actions;
  final List<String> hideOn;

  factory AppNavConfig.fromJson(Map<String, dynamic> json) {
    return AppNavConfig(
      tabs: ((json['tabs'] as List?) ?? const [])
          .map((t) => AppNavTab.fromJson(t as Map<String, dynamic>))
          .toList(),
      actions: ((json['actions'] as List?) ?? const [])
          .map((a) => AppNavAction.fromJson(a as Map<String, dynamic>))
          .toList(),
      hideOn: ((json['hide_on'] as List?) ?? const []).cast<String>(),
    );
  }

  /// Where the website hides its bar: the till, checkout, and create/edit forms.
  bool hiddenAt(String path) {
    final p = path.toLowerCase();
    final isReturnsList =
        p.contains('/returns-history') &&
        !p.contains('/create') &&
        !p.contains('/edit') &&
        !p.contains('/return-detail');
    if (isReturnsList) return false;
    return hideOn.any(p.contains);
  }
}

class AppNavTab {
  const AppNavTab({
    required this.id,
    required this.label,
    required this.path,
    required this.match,
  });

  final String id;
  final String label;
  final String path;
  final List<String> match;

  factory AppNavTab.fromJson(Map<String, dynamic> json) => AppNavTab(
    id: json['id'] as String,
    label: json['label'] as String,
    path: json['path'] as String,
    match: ((json['match'] as List?) ?? const []).cast<String>(),
  );

  bool isActiveAt(String path) {
    final p = path.toLowerCase();
    if (id == 'home') return p.endsWith('/dashboard');
    return match.any(p.contains);
  }

  IconData get icon => switch (id) {
    'home' => Icons.home_rounded,
    'contacts' => Icons.people_alt_rounded,
    'stock' => Icons.inventory_2_rounded,
    'settings' => Icons.settings_rounded,
    _ => Icons.circle,
  };
}

class AppNavAction {
  const AppNavAction({
    required this.label,
    required this.icon,
    required this.tone,
    required this.path,
  });

  final String label;
  final String icon;
  final String tone;
  final String path;

  factory AppNavAction.fromJson(Map<String, dynamic> json) => AppNavAction(
    label: json['label'] as String,
    icon: json['icon'] as String,
    tone: json['tone'] as String,
    path: json['path'] as String,
  );

  IconData get iconData => switch (icon) {
    'cart' => Icons.shopping_cart_outlined,
    'bag' => Icons.shopping_bag_outlined,
    'arrow_down' => Icons.south_west_rounded,
    'arrow_up' => Icons.north_east_rounded,
    'box' => Icons.inventory_2_outlined,
    'file' => Icons.description_outlined,
    'package_in' => Icons.move_to_inbox_outlined,
    'package_out' => Icons.outbox_outlined,
    'refresh' => Icons.sync_alt_rounded,
    'bank' => Icons.account_balance_outlined,
    'tag' => Icons.sell_outlined,
    'check' => Icons.check_circle_outline_rounded,
    _ => Icons.bolt_rounded,
  };

  ({Color bg, Color fg}) get colors => switch (tone) {
    'emerald' => (bg: const Color(0xFFE6F8F0), fg: const Color(0xFF059669)),
    'amber' => (bg: const Color(0xFFFFF3D6), fg: const Color(0xFFD97706)),
    'rose' => (bg: const Color(0xFFFFE8EC), fg: const Color(0xFFE11D48)),
    'indigo' => (bg: const Color(0xFFEAEBFF), fg: const Color(0xFF4F46E5)),
    'orange' => (bg: const Color(0xFFFFEDDD), fg: const Color(0xFFEA580C)),
    'sky' => (bg: const Color(0xFFE0F2FE), fg: const Color(0xFF0284C7)),
    _ => (bg: AppColors.teal50, fg: AppColors.teal600),
  };
}

/// The floating pill. [path] is the page showing now; the matching tab is the open one.
class AppNavBar extends StatelessWidget {
  const AppNavBar({
    required this.config,
    required this.path,
    required this.onOpen,
    required this.onPlus,
    super.key,
  });

  final AppNavConfig config;
  final String path;
  final ValueChanged<String> onOpen;
  final VoidCallback onPlus;

  @override
  Widget build(BuildContext context) {
    final byId = {for (final t in config.tabs) t.id: t};
    final left = [byId['home'], byId['contacts']].whereType<AppNavTab>();
    final right = [byId['stock'], byId['settings']].whereType<AppNavTab>();

    return Padding(
      padding: EdgeInsets.fromLTRB(
        16,
        0,
        16,
        12 + MediaQuery.of(context).padding.bottom,
      ),
      child: Center(
        heightFactor: 1,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 448),
          child: Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: AppColors.surface.withValues(alpha: 0.96),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: AppColors.line),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x2A0D1412),
                  blurRadius: 24,
                  offset: Offset(0, 8),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                for (final t in left)
                  Flexible(
                    child: _TabButton(
                      tab: t,
                      active: t.isActiveAt(path),
                      onTap: () => onOpen(t.path),
                    ),
                  ),
                _PlusButton(onTap: onPlus),
                for (final t in right)
                  Flexible(
                    child: _TabButton(
                      tab: t,
                      active: t.isActiveAt(path),
                      onTap: () => onOpen(t.path),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  const _TabButton({
    required this.tab,
    required this.active,
    required this.onTap,
  });

  final AppNavTab tab;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: active,
      label: tab.label,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOutCubic,
          constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: active
                ? AppColors.teal500.withValues(alpha: 0.15)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(999),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedScale(
                scale: active ? 1.1 : 1,
                duration: const Duration(milliseconds: 220),
                child: Icon(
                  tab.icon,
                  size: 20,
                  color: active ? AppColors.teal600 : AppColors.inkMuted,
                ),
              ),
              Flexible(
                child: AnimatedSize(
                  duration: const Duration(milliseconds: 220),
                  curve: Curves.easeOutCubic,
                  child: active
                      ? Padding(
                          padding: const EdgeInsets.only(left: 6),
                          child: Text(
                            tab.label,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w700,
                              color: AppColors.teal600,
                            ),
                          ),
                        )
                      : const SizedBox.shrink(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PlusButton extends StatelessWidget {
  const _PlusButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Transform.translate(
      offset: const Offset(0, -14),
      child: Semantics(
        button: true,
        label: 'Open quick actions',
        child: GestureDetector(
          onTap: onTap,
          child: Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: AppColors.mintGradient,
              // The ring that cuts the button out of the bar.
              border: Border.all(color: AppColors.canvas, width: 4),
              boxShadow: AppColors.accentGlow,
            ),
            child: const Icon(Icons.add_rounded, color: Colors.white, size: 30),
          ),
        ),
      ),
    );
  }
}

/// The quick-action sheet that fills the screen when "+" is pressed (mirrors `PhoneActionMenu.jsx`).
Future<void> showQuickActions(
  BuildContext context, {
  required List<AppNavAction> actions,
  required ValueChanged<String> onOpen,
  required VoidCallback onAccount,
}) {
  return showGeneralDialog<void>(
    context: context,
    barrierDismissible: true,
    barrierLabel: 'Close quick actions',
    barrierColor: Colors.transparent,
    transitionDuration: const Duration(milliseconds: 220),
    pageBuilder: (dialogContext, _, _) => _QuickActionsView(
      actions: actions,
      onOpen: (path) {
        Navigator.of(dialogContext).pop();
        onOpen(path);
      },
      onAccount: () {
        Navigator.of(dialogContext).pop();
        onAccount();
      },
      onClose: () => Navigator.of(dialogContext).pop(),
    ),
    transitionBuilder: (context, animation, _, child) =>
        FadeTransition(opacity: animation, child: child),
  );
}

class _QuickActionsView extends StatelessWidget {
  const _QuickActionsView({
    required this.actions,
    required this.onOpen,
    required this.onAccount,
    required this.onClose,
  });

  final List<AppNavAction> actions;
  final ValueChanged<String> onOpen;
  final VoidCallback onAccount;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    final tiles = <Widget>[
      for (var i = 0; i < actions.length; i++)
        _ActionTile(
          index: i,
          icon: actions[i].iconData,
          label: actions[i].label,
          bg: actions[i].colors.bg,
          fg: actions[i].colors.fg,
          onTap: () => onOpen(actions[i].path),
        ),
      _ActionTile(
        index: actions.length,
        icon: Icons.account_circle_outlined,
        label: 'Account',
        bg: AppColors.sunken,
        fg: AppColors.ink,
        onTap: onAccount,
      ),
    ];

    return Material(
      color: Colors.transparent,
      child: GestureDetector(
        onTap: onClose,
        behavior: HitTestBehavior.opaque,
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            color: const Color(0x8C0D1412),
            child: SafeArea(
              child: Column(
                children: [
                  Expanded(
                    child: Center(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Text(
                              'QUICK ACTIONS',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1.2,
                              ),
                            ),
                            const SizedBox(height: 12),
                            GridView.count(
                              crossAxisCount: 3,
                              mainAxisSpacing: 8,
                              crossAxisSpacing: 8,
                              childAspectRatio: 1.02,
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              children: tiles,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 20, top: 8),
                    child: GestureDetector(
                      onTap: onClose,
                      child: Container(
                        width: 56,
                        height: 56,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: AppColors.mintGradient,
                          boxShadow: AppColors.accentGlow,
                        ),
                        child: const Icon(
                          Icons.close_rounded,
                          color: Colors.white,
                          size: 28,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.index,
    required this.icon,
    required this.label,
    required this.bg,
    required this.fg,
    required this.onTap,
  });

  final int index;
  final IconData icon;
  final String label;
  final Color bg;
  final Color fg;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0, end: 1),
      duration: Duration(milliseconds: 220 + index * 18),
      curve: Curves.easeOutBack,
      builder: (context, t, child) => Opacity(
        opacity: t.clamp(0, 1),
        child: Transform.scale(scale: 0.88 + 0.12 * t, child: child),
      ),
      child: Material(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        elevation: 3,
        shadowColor: const Color(0x33000000),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: bg,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: fg, size: 22),
                ),
                const SizedBox(height: 8),
                Text(
                  label,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12,
                    height: 1.15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
