import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import 'business_web_screen.dart';
import 'help_screen.dart';

class AiBuilderIntroScreen extends StatefulWidget {
  const AiBuilderIntroScreen({super.key});

  @override
  State<AiBuilderIntroScreen> createState() => _AiBuilderIntroScreenState();
}

class _AiBuilderIntroScreenState extends State<AiBuilderIntroScreen> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  String? _error;

  static const _examples = <String>[
    'Grocery store with two counters and customer credit',
    'Salon with appointments, staff and product sales',
    'Phone repair shop with parts and service jobs',
    'Wholesale distributor selling to shops on 30-day terms',
    'Freelance designer invoicing clients every month',
  ];

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _useExample(String example) {
    setState(() {
      _controller.text = example;
      _controller.selection = TextSelection.collapsed(offset: example.length);
      _error = null;
    });
    _focusNode.requestFocus();
  }

  void _continue() {
    final prompt = _controller.text.trim();
    if (prompt.length < 10) {
      setState(
        () => _error =
            'Tell us a little more so VenQore can recommend the right setup.',
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
      appBar: AppBar(
        title: const Text('AI workspace builder'),
        actions: [
          IconButton(
            tooltip: 'Help',
            onPressed: () => Navigator.of(
              context,
            ).push(MaterialPageRoute<void>(builder: (_) => const HelpScreen())),
            icon: const Icon(Icons.help_outline_rounded),
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 22, 20, 32),
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.pine,
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _BuilderMark(),
                  SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Describe the business you actually run.',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            height: 1.12,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        SizedBox(height: 9),
                        Text(
                          'VenQore will propose the tools, wording and workflow that fit it.',
                          style: TextStyle(
                            color: Color(0xFFD8ECE7),
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 26),
            const Text(
              'What does your business do?',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 7),
            const Text(
              'Mention what you sell, how customers pay, and anything you need to track.',
              style: TextStyle(color: AppColors.inkMuted, height: 1.4),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _controller,
              focusNode: _focusNode,
              minLines: 4,
              maxLines: 7,
              maxLength: 600,
              textCapitalization: TextCapitalization.sentences,
              keyboardType: TextInputType.multiline,
              textInputAction: TextInputAction.newline,
              onChanged: (_) {
                if (_error != null) setState(() => _error = null);
              },
              decoration: InputDecoration(
                hintText:
                    'For example: I run a bakery with walk-in sales, custom cake orders and daily ingredient stock…',
                errorText: _error,
                alignLabelWithHint: true,
                contentPadding: const EdgeInsets.all(17),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Try an example',
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 9,
              children: _examples
                  .map(
                    (example) => ActionChip(
                      avatar: const Icon(Icons.add_rounded, size: 17),
                      label: Text(example),
                      labelStyle: const TextStyle(
                        fontSize: 13,
                        color: AppColors.ink,
                      ),
                      backgroundColor: AppColors.surface,
                      side: const BorderSide(color: AppColors.line),
                      onPressed: () => _useExample(example),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 28),
            FilledButton.icon(
              onPressed: _continue,
              icon: const Icon(Icons.auto_awesome_rounded),
              label: const Text('Build my workspace'),
            ),
            const SizedBox(height: 13),
            const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.tune_rounded, size: 18, color: AppColors.inkMuted),
                SizedBox(width: 9),
                Expanded(
                  child: Text(
                    'You will review the recommendation, answer a few questions and change any feature before creating the account.',
                    style: TextStyle(
                      color: AppColors.inkMuted,
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _BuilderMark extends StatelessWidget {
  const _BuilderMark();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: AppColors.teal,
        borderRadius: BorderRadius.circular(15),
      ),
      child: const Icon(
        Icons.auto_awesome_rounded,
        color: Colors.white,
        size: 25,
      ),
    );
  }
}
