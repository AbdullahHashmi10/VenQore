import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class MobilePageAction {
  const MobilePageAction({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.path,
    this.emphasized = false,
    this.badge,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final String path;
  final bool emphasized;
  final String? badge;
}

class MobileSectionPage extends StatelessWidget {
  const MobileSectionPage({
    required this.title,
    required this.introduction,
    required this.icon,
    required this.actions,
    super.key,
  });

  final String title;
  final String introduction;
  final IconData icon;
  final List<MobilePageAction> actions;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis),
      ),
      body: SafeArea(
        child: Align(
          alignment: Alignment.topCenter,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 720),
            child: ListView(
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
              children: [
                LayoutBuilder(
                  builder: (context, constraints) {
                    final compact = constraints.maxWidth < 330;
                    final message = Text(
                      introduction,
                      style: const TextStyle(
                        color: Color(0xFFD8E9E4),
                        fontSize: 15,
                        height: 1.45,
                        fontWeight: FontWeight.w500,
                      ),
                    );
                    final mark = Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppColors.tealBright.withValues(alpha: .16),
                        borderRadius: BorderRadius.circular(15),
                      ),
                      child: Icon(icon, color: AppColors.tealBright),
                    );
                    return Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppColors.pine,
                        borderRadius: BorderRadius.circular(22),
                      ),
                      child: compact
                          ? Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                mark,
                                const SizedBox(height: 14),
                                message,
                              ],
                            )
                          : Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                mark,
                                const SizedBox(width: 15),
                                Expanded(child: message),
                              ],
                            ),
                    );
                  },
                ),
                const SizedBox(height: 18),
                ...actions.map((action) => _ActionRow(action: action)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ActionRow extends StatelessWidget {
  const _ActionRow({required this.action});

  final MobilePageAction action;

  @override
  Widget build(BuildContext context) {
    final color = action.emphasized ? AppColors.teal : AppColors.ink;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: AppColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(17),
          side: BorderSide(
            color: action.emphasized
                ? AppColors.teal.withValues(alpha: .45)
                : AppColors.line,
          ),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(17),
          onTap: () => Navigator.pop(context, action.path),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(15, 14, 12, 14),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: action.emphasized
                        ? const Color(0xFFE3F8F2)
                        : AppColors.canvas,
                    borderRadius: BorderRadius.circular(13),
                  ),
                  child: Icon(action.icon, color: color, size: 22),
                ),
                const SizedBox(width: 13),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        action.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: color,
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        action.subtitle,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppColors.inkMuted,
                          fontSize: 13,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
                if (action.badge != null) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE3F8F2),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      action.badge!,
                      style: const TextStyle(
                        color: AppColors.teal,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
                const Icon(
                  Icons.chevron_right_rounded,
                  color: AppColors.inkMuted,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
