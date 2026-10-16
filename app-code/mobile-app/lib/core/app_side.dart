import 'package:shared_preferences/shared_preferences.dart';

/// The app has two separate sides. A person picks one on the first screen and stays on it:
///
///  * customer: stores, orders and the customer account. No store-management page ever opens.
///  * store: sign in to, run or create a business. No customer page ever opens.
///
/// Changing sides is an explicit button on the account sheet, never a link the pages can reach.
enum AppSide {
  customer,
  store;

  String get label => this == customer ? 'customer' : 'store';
  AppSide get other => this == customer ? store : customer;
}

class AppSideStore {
  AppSideStore._();

  static const _key = 'app_side';

  /// The side chosen on this phone, or null before the first choice.
  static AppSide? current;

  static Future<void> load() async {
    try {
      final saved = (await SharedPreferences.getInstance()).getString(_key);
      current = AppSide.values.where((s) => s.name == saved).firstOrNull;
    } catch (_) {
      current = null;
    }
  }

  static Future<void> set(AppSide side) async {
    current = side;
    try {
      await (await SharedPreferences.getInstance()).setString(_key, side.name);
    } catch (_) {
      // Kept in memory for this run if storage is unavailable.
    }
  }
}
