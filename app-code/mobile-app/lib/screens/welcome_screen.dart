import 'package:flutter/material.dart';

import 'side_choice_screen.dart';

/// Where a signed-out person lands (after sign-out or "return to start"): the same front door as the first
/// launch, with the marketplace on top and the store entrance below.
class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) => const SideChoiceScreen();
}
