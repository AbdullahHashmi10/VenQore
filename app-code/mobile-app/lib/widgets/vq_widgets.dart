import 'dart:ui';

import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/vq.dart';
import 'motion.dart';

/// The dark mesh surface used by heroes and headers: midnight base, teal and sky glows that drift slowly.
class VqMesh extends StatefulWidget {
  const VqMesh({
    required this.child,
    this.borderRadius = BorderRadius.zero,
    this.padding = EdgeInsets.zero,
    this.animate = true,
    this.shadow,
    this.border,
    super.key,
  });

  final Widget child;
  final BorderRadius borderRadius;
  final EdgeInsets padding;
  final bool animate;
  final List<BoxShadow>? shadow;
  final BoxBorder? border;

  @override
  State<VqMesh> createState() => _VqMeshState();
}

class _VqMeshState extends State<VqMesh> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 8),
  );

  @override
  void initState() {
    super.initState();
    if (widget.animate) _c.repeat(reverse: true);
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: widget.borderRadius,
        boxShadow: widget.shadow,
        border: widget.border,
        color: Vq.meshBase,
      ),
      child: ClipRRect(
        borderRadius: widget.borderRadius,
        child: Stack(
          children: [
            Positioned.fill(
              child: AnimatedBuilder(
                animation: _c,
                builder: (context, _) {
                  final t = Curves.easeInOut.transform(_c.value);
                  return DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: RadialGradient(
                        center: Alignment(-0.64 + 0.2 * t, -0.76 + 0.12 * t),
                        radius: 1.0,
                        colors: const [Color(0x9423C4A6), Color(0x0023C4A6)],
                      ),
                    ),
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: RadialGradient(
                          center: Alignment(0.68 - 0.18 * t, 0.6 - 0.1 * t),
                          radius: 1.0,
                          colors: const [Color(0xAD076B5E), Color(0x00076B5E)],
                        ),
                      ),
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: RadialGradient(
                            center: const Alignment(0.24, -0.56),
                            radius: 0.8,
                            colors: const [
                              Color(0x4055C4EC),
                              Color(0x0055C4EC),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            Padding(padding: widget.padding, child: widget.child),
          ],
        ),
      ),
    );
  }
}

/// A frosted pill/panel that sits on a mesh.
class VqGlass extends StatelessWidget {
  const VqGlass({
    required this.child,
    this.radius = 999,
    this.padding = EdgeInsets.zero,
    this.fill = const Color(0x1FFFFFFF),
    this.line = const Color(0x3DFFFFFF),
    super.key,
  });

  final Widget child;
  final double radius;
  final EdgeInsets padding;
  final Color fill;
  final Color line;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            color: fill,
            borderRadius: BorderRadius.circular(radius),
            border: Border.all(color: line),
          ),
          child: child,
        ),
      ),
    );
  }
}

enum VqTone { neutral, accent, success, warning, danger, info }

class VqBadge extends StatelessWidget {
  const VqBadge(
    this.label, {
    this.tone = VqTone.neutral,
    this.dot = true,
    this.onDark = false,
    super.key,
  });

  final String label;
  final VqTone tone;
  final bool dot;
  final bool onDark;

  @override
  Widget build(BuildContext context) {
    final (bg, fg, bd) = onDark
        ? (
            const Color(0x2E23C4A6),
            const Color(0xFF93EBD6),
            const Color(0x5923C4A6),
          )
        : switch (tone) {
            VqTone.accent => (
              AppColors.teal50,
              AppColors.teal700,
              AppColors.teal200,
            ),
            VqTone.success => (
              AppColors.successBg,
              AppColors.success,
              const Color(0xFFA9E0C4),
            ),
            VqTone.warning => (
              AppColors.warningBg,
              AppColors.warning,
              const Color(0xFFF2D08A),
            ),
            VqTone.danger => (
              AppColors.dangerBg,
              AppColors.danger,
              const Color(0xFFF3B7AF),
            ),
            VqTone.info => (
              AppColors.infoBg,
              AppColors.info,
              const Color(0xFFA8DCF0),
            ),
            VqTone.neutral => (
              AppColors.sunken,
              AppColors.inkMuted,
              AppColors.line,
            ),
          };
    return Container(
      height: 28,
      padding: const EdgeInsets.symmetric(horizontal: 11),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: bd),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (dot) ...[
            Container(
              width: 5.5,
              height: 5.5,
              decoration: BoxDecoration(color: fg, shape: BoxShape.circle),
            ),
            const SizedBox(width: 5.5),
          ],
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Vq.sans(12.5, color: fg, weight: 600),
            ),
          ),
        ],
      ),
    );
  }
}

class VqAvatar extends StatelessWidget {
  const VqAvatar({required this.name, this.size = 28, this.color, super.key});

  final String name;
  final double size;
  final Color? color;

  static const _hues = [
    AppColors.teal400,
    Vq.coral400,
    Vq.sky400,
    Vq.butter400,
    Vq.lime400,
  ];

  @override
  Widget build(BuildContext context) {
    final parts = name.trim().split(RegExp(r'\s+')).where((w) => w.isNotEmpty);
    final initials = parts.take(2).map((w) => w[0]).join().toUpperCase();
    final sum = name.codeUnits.fold<int>(0, (a, c) => a + c);
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: color ?? _hues[sum % _hues.length],
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 2),
      ),
      child: Text(
        initials.isEmpty ? '?' : initials,
        style: Vq.sans(size * 0.38, color: AppColors.teal950, weight: 700),
      ),
    );
  }
}

class VqChip extends StatelessWidget {
  const VqChip(this.label, {this.selected = false, this.onTap, super.key});

  final String label;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return PressableScale(
      onTap: onTap,
      borderRadius: 999,
      child: Container(
        height: 36,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? AppColors.teal600 : AppColors.surface,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: selected ? Colors.transparent : AppColors.line,
          ),
          boxShadow: selected ? Vq.glow : null,
        ),
        child: Text(
          label,
          style: Vq.sans(
            13.5,
            weight: 600,
            color: selected ? Colors.white : AppColors.inkMuted,
          ),
        ),
      ),
    );
  }
}

/// A sliding two-or-more way switch (Sign in / New owner).
class VqTabs extends StatelessWidget {
  const VqTabs({
    required this.labels,
    required this.index,
    required this.onChanged,
    this.onDark = false,
    super.key,
  });

  final List<String> labels;
  final int index;
  final ValueChanged<int> onChanged;
  final bool onDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 48,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: onDark ? const Color(0x14FFFFFF) : AppColors.sunken,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: onDark ? const Color(0x1FFFFFFF) : AppColors.lineSoft,
        ),
      ),
      child: LayoutBuilder(
        builder: (context, box) {
          final w = box.maxWidth / labels.length;
          return Stack(
            children: [
              AnimatedPositioned(
                duration: const Duration(milliseconds: 320),
                curve: Curves.easeOutBack,
                left: w * index,
                width: w,
                top: 0,
                bottom: 0,
                child: Container(
                  decoration: BoxDecoration(
                    color: onDark ? AppColors.teal400 : AppColors.surface,
                    borderRadius: BorderRadius.circular(999),
                    boxShadow: onDark ? Vq.glow : Vq.elev1,
                  ),
                ),
              ),
              Row(
                children: [
                  for (var i = 0; i < labels.length; i++)
                    Expanded(
                      child: GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: () => onChanged(i),
                        child: Center(
                          child: Text(
                            labels[i],
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Vq.sans(
                              13.5,
                              weight: i == index ? 700 : 500,
                              color: onDark
                                  ? (i == index
                                        ? AppColors.teal950
                                        : const Color(0xB8EAFBF5))
                                  : (i == index
                                        ? AppColors.ink
                                        : AppColors.inkFaint),
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }
}

/// A full-width pill button: primary (teal), quiet (mint tint) or plain (outlined).
enum VqButtonKind { primary, quiet, plain, white }

class VqButton extends StatelessWidget {
  const VqButton({
    required this.label,
    required this.onTap,
    this.icon,
    this.trailing,
    this.kind = VqButtonKind.primary,
    this.height = 52,
    this.busy = false,
    super.key,
  });

  final String label;
  final VoidCallback? onTap;
  final IconData? icon;
  final IconData? trailing;
  final VqButtonKind kind;
  final double height;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    final (bg, fg, border, shadow) = switch (kind) {
      VqButtonKind.primary => (
        AppColors.teal600,
        Colors.white,
        Colors.transparent,
        Vq.glow,
      ),
      VqButtonKind.quiet => (
        AppColors.teal50,
        AppColors.teal700,
        AppColors.teal200,
        const <BoxShadow>[],
      ),
      VqButtonKind.white => (
        Colors.white,
        AppColors.teal950,
        Colors.transparent,
        Vq.elev2,
      ),
      VqButtonKind.plain => (
        AppColors.surface,
        AppColors.ink,
        AppColors.line,
        const <BoxShadow>[],
      ),
    };
    return PressableScale(
      onTap: busy ? null : onTap,
      borderRadius: Vq.rLg,
      child: Container(
        height: height,
        padding: const EdgeInsets.symmetric(horizontal: 18),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(Vq.rLg),
          border: Border.all(color: border),
          boxShadow: shadow,
        ),
        child: busy
            ? Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2.2, color: fg),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: 19, color: fg),
                    const SizedBox(width: 8),
                  ],
                  Flexible(
                    child: Text(
                      label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Vq.sans(15, color: fg, weight: 700),
                    ),
                  ),
                  if (trailing != null) ...[
                    const SizedBox(width: 8),
                    Icon(trailing, size: 19, color: fg),
                  ],
                ],
              ),
      ),
    );
  }
}

/// A labelled input in the prototype's soft card style.
class VqField extends StatelessWidget {
  const VqField({
    required this.label,
    required this.controller,
    this.icon,
    this.hint,
    this.obscure = false,
    this.keyboardType,
    this.textInputAction,
    this.autofillHints,
    this.focusNode,
    this.onSubmitted,
    this.suffix,
    this.fieldKey,
    super.key,
  });

  final String label;
  final TextEditingController controller;
  final IconData? icon;
  final String? hint;
  final bool obscure;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final Iterable<String>? autofillHints;
  final FocusNode? focusNode;
  final ValueChanged<String>? onSubmitted;
  final Widget? suffix;
  final Key? fieldKey;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Vq.sans(13.5, color: AppColors.inkMuted, weight: 600),
        ),
        const SizedBox(height: 6),
        Container(
          height: 52,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(Vq.rMd),
            border: Border.all(color: AppColors.line),
            boxShadow: Vq.elev1,
          ),
          child: Row(
            children: [
              if (icon != null) ...[
                Icon(icon, size: 20, color: AppColors.inkFaint),
                const SizedBox(width: 10),
              ],
              Expanded(
                child: TextField(
                  key: fieldKey,
                  controller: controller,
                  focusNode: focusNode,
                  obscureText: obscure,
                  keyboardType: keyboardType,
                  textInputAction: textInputAction,
                  autofillHints: autofillHints,
                  onSubmitted: onSubmitted,
                  cursorColor: AppColors.teal500,
                  style: Vq.sans(16, weight: 500),
                  decoration: InputDecoration(
                    isCollapsed: true,
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    filled: false,
                    hintText: hint,
                    hintStyle: Vq.sans(
                      16,
                      color: AppColors.inkFaint,
                      weight: 400,
                    ),
                  ),
                ),
              ),
              if (suffix != null) suffix!,
            ],
          ),
        ),
      ],
    );
  }
}

/// White card with the prototype's border and soft shadow.
class VqCard extends StatelessWidget {
  const VqCard({
    required this.child,
    this.padding = const EdgeInsets.all(14),
    this.radius = Vq.rLg,
    this.onTap,
    super.key,
  });

  final Widget child;
  final EdgeInsets padding;
  final double radius;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final body = Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: AppColors.line),
        boxShadow: Vq.elev1,
      ),
      child: child,
    );
    if (onTap == null) return body;
    return PressableScale(onTap: onTap, borderRadius: radius, child: body);
  }
}

/// The mesh header shared by every sign-in / register / builder screen: back, badge, title, and optional tabs.
class VqAuthHeader extends StatelessWidget {
  const VqAuthHeader({
    required this.badge,
    required this.title,
    required this.subtitle,
    this.tabs,
    this.tabIndex = 0,
    this.onTab,
    this.onHelp,
    this.onBack,
    super.key,
  });

  final String badge;
  final String title;
  final String subtitle;
  final List<String>? tabs;
  final int tabIndex;
  final ValueChanged<int>? onTab;
  final VoidCallback? onHelp;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    return VqMesh(
      borderRadius: const BorderRadius.only(
        bottomLeft: Radius.circular(Vq.rXl),
        bottomRight: Radius.circular(Vq.rXl),
      ),
      padding: EdgeInsets.fromLTRB(
        16,
        MediaQuery.paddingOf(context).top + 8,
        16,
        16,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              GestureDetector(
                onTap: onBack ?? () => Navigator.of(context).maybePop(),
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0x1AFFFFFF),
                    borderRadius: BorderRadius.circular(Vq.rSm),
                    border: Border.all(color: const Color(0x29FFFFFF)),
                  ),
                  child: const Icon(
                    Icons.arrow_back_rounded,
                    size: 18,
                    color: Color(0xFFEDF2EF),
                  ),
                ),
              ),
              const Spacer(),
              Flexible(child: VqBadge(badge, onDark: true)),
              if (onHelp != null) ...[
                const SizedBox(width: 6),
                GestureDetector(
                  onTap: onHelp,
                  child: const Padding(
                    padding: EdgeInsets.all(6),
                    child: Icon(
                      Icons.help_outline_rounded,
                      size: 20,
                      color: Color(0xCCEDF2EF),
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 14),
          Text(title, style: Vq.display(27, color: const Color(0xFFF4FFFB))),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: Vq.sans(14, color: const Color(0xFFA8B4AE), height: 1.5),
          ),
          if (tabs != null) ...[
            const SizedBox(height: 14),
            VqTabs(
              labels: tabs!,
              index: tabIndex,
              onChanged: onTab ?? (_) {},
              onDark: true,
            ),
          ],
        ],
      ),
    );
  }
}
