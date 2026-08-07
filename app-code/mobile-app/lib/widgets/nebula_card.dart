import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class NebulaCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double? width;
  final double? height;
  final BorderRadius? borderRadius;
  final List<Color>? orbColors;

  const NebulaCard({
    super.key,
    required this.child,
    this.padding,
    this.width,
    this.height,
    this.borderRadius,
    this.orbColors,
  });

  @override
  Widget build(BuildContext context) {
    final br = borderRadius ?? BorderRadius.circular(24);
    final orbs = orbColors ?? [
      AppColors.indigoOrb.withOpacity(0.4),
      AppColors.purpleOrb.withOpacity(0.3),
    ];

    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: AppColors.voidBase,
        borderRadius: br,
        border: Border.all(
          color: Colors.white.withOpacity(0.05),
          width: 0.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          // Layer 1: Ambient Orbs (Static positions like the web design)
          Positioned(
            top: -50,
            right: -50,
            child: Container(
              width: 150,
              height: 150,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: orbs[0],
              ),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 40, sigmaY: 40),
                child: Container(color: Colors.transparent),
              ),
            ),
          ),
          Positioned(
            bottom: -50,
            left: -50,
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: orbs[1],
              ),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
                child: Container(color: Colors.transparent),
              ),
            ),
          ),

          // Layer 2: Texture (Subtle Noise)
          // We can use a custom painter or a tiled image here. 
          // For now, let's keep it clean as requested.
          
          // Layer 3: Accent Gradient Line (Bottom 1px)
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 1.5,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.transparent,
                    AppColors.indigoOrb.withOpacity(0.8),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          
          // Layer 4: Content
          Padding(
            padding: padding ?? const EdgeInsets.all(20),
            child: child,
          ),
        ],
      ),
    );
  }
}
