import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Name printed as "Caissier" on the receipts of this device, chosen in Settings.
/// Empty = the name of the logged-in account. Every screen watching it updates at once.
class ReceiptNameNotifier extends Notifier<String> {
  static const prefKey = 'mellia_receipt_name';

  @override
  String build() {
    _load();
    return '';
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(prefKey) ?? '';
    if (saved != state) state = saved;
  }

  Future<void> set(String value) async {
    state = value.trim();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(prefKey, state);
  }
}

final receiptNameProvider = NotifierProvider<ReceiptNameNotifier, String>(
  ReceiptNameNotifier.new,
);

/// The name to show on a receipt: the one set in Settings, else the account's name.
String? receiptCashier(String custom, String? accountName) =>
    custom.isNotEmpty ? custom : accountName;
