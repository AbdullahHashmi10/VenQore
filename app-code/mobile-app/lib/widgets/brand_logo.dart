import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../theme/app_colors.dart';

class BrandLogo extends StatelessWidget {
  const BrandLogo({
    this.size = 42,
    this.withContainer = true,
    this.borderRadius = 13,
    super.key,
  });

  final double size;
  final bool withContainer;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    final markSize = withContainer ? size * 0.68 : size;
    final iconWidget = SvgPicture.asset(
      'assets/brand/venqore-icon.svg',
      width: markSize,
      height: markSize,
      fit: BoxFit.contain,
      placeholderBuilder: (_) => Image.asset(
        'assets/brand/venqore-icon.png',
        width: markSize,
        height: markSize,
        fit: BoxFit.contain,
      ),
    );

    if (!withContainer) {
      return SizedBox(
        width: size,
        height: size,
        child: Center(child: iconWidget),
      );
    }

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.pine,
        borderRadius: BorderRadius.circular(borderRadius),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1F062421),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      alignment: Alignment.center,
      child: iconWidget,
    );
  }
}
