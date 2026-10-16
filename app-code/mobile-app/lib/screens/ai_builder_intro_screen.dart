import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../widgets/thinking_orb.dart';
import 'business_web_screen.dart';
import 'help_screen.dart';

/// Redesigned VenQore V6 AI Workspace Builder.
/// Features the 3D rotating ThinkingOrb, interactive prompt suggestions,
/// and responsive V6 card architecture matching the web builder.
class AiBuilderIntroScreen extends StatefulWidget {
  const AiBuilderIntroScreen({super.key});

  @override
  State<AiBuilderIntroScreen> createState() => _AiBuilderIntroScreenState();
}

class _AiBuilderIntroScreenState extends State<AiBuilderIntroScreen> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  String? _error;

  static const _examples = <Map<String, dynamic>>[
    {
      'title': 'Grocery Store',
      'icon': Icons.local_grocery_store_outlined,
      'prompt':
          'I run a grocery store with two POS counters, barcode scanning and customer ledger credit.',
    },
    {
      'title': 'Restaurant & Cafe',
      'icon': Icons.restaurant_rounded,
      'prompt':
          'Cafe & kitchen with table service, takeaway orders, rider delivery and split bills.',
    },
    {
      'title': 'Repair Workshop',
      'icon': Icons.build_circle_outlined,
      'prompt':
          'Phone and electronics repair shop with parts inventory, service jobs and walk-in sales.',
    },
    {
      'title': 'Salon & Spa',
      'icon': Icons.spa_outlined,
      'prompt':
          'Salon with 4 chairs, appointment scheduling, staff commission tracking and product sales.',
    },
    {
      'title': 'Wholesale & B2B',
      'icon': Icons.local_shipping_outlined,
      'prompt':
          'Wholesale distributor selling goods to shops on 30-day payment terms with van deliveries.',
    },
  ];

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _useExample(String prompt) {
    setState(() {
      _controller.text = prompt;
      _controller.selection = TextSelection.collapsed(offset: prompt.length);
      _error = null;
    });
    _focusNode.requestFocus();
  }

  void _continue() {
    final prompt = _controller.text.trim();
    if (prompt.length < 10) {
      setState(
        () => _error =
            'Please describe your business in a few words so the AI can build your workspace.',
      );
      _focusNode.requestFocus();
      return;
    }

    final path = Uri(
      path: '/build-workspace',
      queryParameters: {'prompt': prompt},
    ).toString();

    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => BusinessWebScreen(
          initialPath: path,
          initialTitle: 'Build your workspace',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: const BackButton(color: AppColors.ink),
        title: const Text(
          'AI Workspace Builder',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.ink,
          ),
        ),
        actions: [
          IconButton(
            tooltip: 'Help',
            icon: const Icon(
              Icons.help_outline_rounded,
              color: AppColors.inkMuted,
            ),
            onPressed: () => Navigator.of(
              context,
            ).push(MaterialPageRoute<void>(builder: (_) => const HelpScreen())),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Hero Card featuring the live 3D ThinkingOrb
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [
                      AppColors.teal950,
                      AppColors.teal900,
                      Color(0xFF082622),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: AppColors.tealBright.withValues(alpha: 0.35),
                    width: 1.2,
                  ),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x44062421),
                      blurRadius: 24,
                      offset: Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // The animated 3D Thinking Orb
                        const ThinkingOrb(
                          size: 74,
                          state: OrbState.solving,
                          speed: 1.1,
                          accentColor: AppColors.tealBright,
                          showCore: true,
                        ),
                        const SizedBox(width: 16),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Describe the business you run.',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 20,
                                  height: 1.15,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              SizedBox(height: 6),
                              Text(
                                'VenQore synthesizes your custom catalog, receipt format, and workflow stack automatically.',
                                style: TextStyle(
                                  color: Color(0xFFC6F5E9),
                                  fontSize: 13,
                                  height: 1.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 22),

              const Text(
                'What does your business do?',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppColors.ink,
                  letterSpacing: -0.4,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Mention what you sell, how customers pay, and if you deliver or hold stock.',
                style: TextStyle(
                  color: AppColors.inkMuted,
                  fontSize: 14,
                  height: 1.4,
                ),
              ),

              const SizedBox(height: 14),

              // Interactive Text Area Card
              Container(
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: _error != null ? AppColors.danger : AppColors.line,
                    width: _error != null ? 1.5 : 1.0,
                  ),
                  boxShadow: AppColors.cardShadow,
                ),
                child: TextField(
                  controller: _controller,
                  focusNode: _focusNode,
                  maxLines: 4,
                  minLines: 3,
                  style: const TextStyle(
                    fontSize: 15,
                    color: AppColors.ink,
                    height: 1.45,
                  ),
                  decoration: const InputDecoration(
                    hintText:
                        'e.g. I run a boutique bakery with counter sales, customer pre-orders, table orders, and local bike deliveries...',
                    hintStyle: TextStyle(
                      color: AppColors.inkFaint,
                      fontSize: 14,
                      height: 1.45,
                    ),
                    contentPadding: EdgeInsets.all(18),
                    border: InputBorder.none,
                  ),
                  onChanged: (_) {
                    if (_error != null) setState(() => _error = null);
                  },
                ),
              ),

              if (_error != null) ...[
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.only(left: 4),
                  child: Text(
                    _error!,
                    style: const TextStyle(
                      color: AppColors.danger,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],

              const SizedBox(height: 20),

              // Trade Presets / Examples
              const Text(
                'Or choose a trade example to start:',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.inkMuted,
                ),
              ),
              const SizedBox(height: 10),

              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _examples.map((ex) {
                  return ActionChip(
                    avatar: Icon(
                      ex['icon'] as IconData,
                      size: 16,
                      color: AppColors.teal,
                    ),
                    label: Text(ex['title'] as String),
                    labelStyle: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.ink,
                    ),
                    backgroundColor: AppColors.surface,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: AppColors.line),
                    ),
                    onPressed: () => _useExample(ex['prompt'] as String),
                  );
                }).toList(),
              ),

              const SizedBox(height: 28),

              // Action button
              FilledButton.icon(
                onPressed: _continue,
                icon: const Icon(Icons.auto_awesome_rounded, size: 20),
                label: const Text(
                  'Build my workspace',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                ),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.teal,
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(54),
                  elevation: 2,
                  shadowColor: const Color(0x660BAA8F),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),

              const SizedBox(height: 14),

              const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.tune_rounded, size: 18, color: AppColors.inkMuted),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'You will review the AI recommendation, modify modules, and preview your dashboard before account creation.',
                      style: TextStyle(
                        color: AppColors.inkMuted,
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
