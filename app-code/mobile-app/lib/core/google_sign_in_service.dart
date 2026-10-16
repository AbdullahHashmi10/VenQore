import 'dart:async';
import 'dart:convert';

import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;

import '../config/app_config.dart';

enum GoogleSignInOutcome {
  /// Signed in with Google; [GoogleSignInResult.ticketPath] opens the person's workspace.
  ready,

  /// The person closed the account picker.
  cancelled,

  /// This email already has a VenQore account that has not been linked to Google yet.
  /// The browser flow proves ownership once with an emailed code.
  linkRequired,

  /// Native sign-in is not available (not set up on the server, or the device cannot do it).
  /// The caller falls back to the browser flow.
  unavailable,

  /// Google or our server refused the sign-in; [GoogleSignInResult.message] says why.
  failed,
}

class GoogleSignInResult {
  const GoogleSignInResult(this.outcome, {this.ticketPath, this.message});

  final GoogleSignInOutcome outcome;
  final String? ticketPath;
  final String? message;
}

/// "Continue with Google" using the Google accounts already on the phone (the account picker),
/// instead of a web page. The ID token Google returns is verified by our server, which answers with a
/// one-time ticket the app opens to start the session.
class GoogleSignInService {
  GoogleSignInService({http.Client? client})
    : _client = client ?? http.Client();

  final http.Client _client;

  static const _timeout = Duration(seconds: 12);

  Future<GoogleSignInResult> signIn() async {
    final clientId = await _serverClientId();
    if (clientId == null) {
      return const GoogleSignInResult(GoogleSignInOutcome.unavailable);
    }

    final google = GoogleSignIn(
      scopes: const <String>['email', 'profile'],
      serverClientId: clientId,
    );

    try {
      // Always show the picker so a different Google account can be chosen.
      await google.signOut();
      final account = await google.signIn();
      if (account == null) {
        return const GoogleSignInResult(GoogleSignInOutcome.cancelled);
      }
      final idToken = (await account.authentication).idToken;
      if (idToken == null || idToken.isEmpty) {
        return const GoogleSignInResult(GoogleSignInOutcome.unavailable);
      }
      return await _exchange(idToken);
    } on TimeoutException {
      return const GoogleSignInResult(
        GoogleSignInOutcome.failed,
        message:
            'Could not reach VenQore. Check your connection and try again.',
      );
    } catch (_) {
      // Most often "the app is not registered with Google yet" or Play services missing.
      return const GoogleSignInResult(GoogleSignInOutcome.unavailable);
    } finally {
      // Nothing from Google is kept on the phone: the session is the server's.
      unawaited(google.signOut().then<void>((_) {}, onError: (_) {}));
    }
  }

  Future<String?> _serverClientId() async {
    try {
      final res = await _client
          .get(AppConfig.baseUri.resolve('/api/mobile/config'))
          .timeout(_timeout);
      if (res.statusCode != 200) return null;
      final id =
          (jsonDecode(res.body)
              as Map<String, dynamic>)['google_server_client_id'];
      return id is String && id.isNotEmpty ? id : null;
    } catch (_) {
      return null;
    }
  }

  Future<GoogleSignInResult> _exchange(String idToken) async {
    final res = await _client
        .post(
          AppConfig.baseUri.resolve('/api/mobile/auth/google'),
          headers: const {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: jsonEncode({'id_token': idToken}),
        )
        .timeout(_timeout);

    final body = res.body.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(res.body) as Map<String, dynamic>;

    if (res.statusCode == 401) {
      return GoogleSignInResult(
        GoogleSignInOutcome.failed,
        message:
            (body['message'] as String?) ??
            'Google could not confirm this sign-in.',
      );
    }
    if (res.statusCode != 200) {
      return const GoogleSignInResult(
        GoogleSignInOutcome.failed,
        message:
            'VenQore could not finish the Google sign-in. Please try again.',
      );
    }

    switch (body['status']) {
      case 'ok':
        // Use only the path: the app must stay on its own configured host.
        final path = Uri.parse(body['ticket_url'] as String).path;
        return GoogleSignInResult(GoogleSignInOutcome.ready, ticketPath: path);
      case 'link_required':
        return const GoogleSignInResult(GoogleSignInOutcome.linkRequired);
      default:
        return const GoogleSignInResult(GoogleSignInOutcome.unavailable);
    }
  }
}
