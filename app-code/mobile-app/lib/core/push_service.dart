import 'dart:async';
import 'dart:convert';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';

import '../config/app_config.dart';
import '../screens/business_web_screen.dart';

/// Notifications for the app, through Firebase Cloud Messaging.
///
/// Firebase only carries the message. Who gets it is decided on the VenQore server: the phone gives
/// its address to the signed-in person's account (from inside the signed-in web view, so it uses the
/// same session) and the server sends rider and order alerts to it. If Firebase is not set up, nothing
/// here throws and the app works as before.
class PushService {
  PushService._();

  static final navigatorKey = GlobalKey<NavigatorState>();
  static final messengerKey = GlobalKey<ScaffoldMessengerState>();

  static bool _ready = false;
  static String? _token;

  /// Web screens that can open a page for a tapped notification; the newest one wins.
  static final List<void Function(String path)> _openers = [];

  static Future<void> init() async {
    try {
      await Firebase.initializeApp();
      _ready = true;
      FirebaseMessaging.onMessage.listen(_showInApp);
      FirebaseMessaging.onMessageOpenedApp.listen(_openFrom);
      // ignore: deprecated_member_use
      FirebaseMessaging.instance.onTokenRefresh.listen((t) => _token = t);
      final first = await FirebaseMessaging.instance.getInitialMessage();
      if (first != null) {
        // The app was closed: wait for the first frame so there is a navigator to use.
        WidgetsBinding.instance.addPostFrameCallback((_) => _openFrom(first));
      }
    } catch (_) {
      _ready = false;
    }
  }

  static void addOpener(void Function(String path) opener) =>
      _openers.add(opener);
  static void removeOpener(void Function(String path) opener) =>
      _openers.remove(opener);

  /// Asks (once, in plain words) and returns the phone's notification address, or null.
  static Future<String?> token(BuildContext context) async {
    if (!_ready) return null;
    try {
      final messaging = FirebaseMessaging.instance;
      var settings = await messaging.getNotificationSettings();

      if (settings.authorizationStatus == AuthorizationStatus.notDetermined) {
        if (!context.mounted) return null;
        final agree = await showDialog<bool>(
          context: context,
          builder: (c) => AlertDialog(
            title: const Text('Get alerts on this phone?'),
            content: const Text(
              'VenQore can alert you when a delivery is given to you or a new order arrives, even when the app is closed. You can turn this off any time in the phone settings.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(c, false),
                child: const Text('Not now'),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(c, true),
                style: FilledButton.styleFrom(minimumSize: const Size(0, 44)),
                child: const Text('Allow alerts'),
              ),
            ],
          ),
        );
        if (agree != true) return null;
        settings = await messaging.requestPermission();
      }

      if (settings.authorizationStatus == AuthorizationStatus.denied)
        return null;
      // ignore: deprecated_member_use
      _token ??= await messaging.getToken();
      return _token;
    } catch (_) {
      return null;
    }
  }

  /// JavaScript, run inside the signed-in web view, that gives (or removes) this phone's address.
  static String registerScript(String token) =>
      _call('/app/device-token', token);
  static String removeScript(String token) =>
      _call('/app/device-token/off', token);

  static String _call(String path, String token) {
    final t = jsonEncode(token);
    return "(function(){var m=document.cookie.match(/XSRF-TOKEN=([^;]+)/);"
        "fetch('$path',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',"
        "'Accept':'application/json','X-XSRF-TOKEN':m?decodeURIComponent(m[1]):''},"
        "body:JSON.stringify({token:$t,platform:'android'})}).catch(function(){});})();";
  }

  static String? get currentToken => _token;

  static void _showInApp(RemoteMessage message) {
    final n = message.notification;
    if (n == null) return;
    messengerKey.currentState
      ?..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 6),
          content: Text([n.title, n.body].whereType<String>().join(': ')),
          action: SnackBarAction(
            label: 'Open',
            onPressed: () => _openFrom(message),
          ),
        ),
      );
  }

  static void _openFrom(RemoteMessage message) {
    final path = message.data['url'] as String?;
    if (path == null || !path.startsWith('/')) return;
    if (_openers.isNotEmpty) {
      _openers.last(path);
      return;
    }
    navigatorKey.currentState?.push(
      MaterialPageRoute<void>(
        builder: (_) =>
            BusinessWebScreen(initialPath: path, initialTitle: 'VenQore'),
      ),
    );
  }

  /// A relative path only: a notification can never send the app to another site.
  static Uri resolve(String path) => AppConfig.baseUri.resolve(path);
}
