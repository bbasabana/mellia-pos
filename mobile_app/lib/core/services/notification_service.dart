import 'package:elegant_notification/elegant_notification.dart';
import 'package:elegant_notification/resources/arrays.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class NotificationService {
  static const _prefKey = 'mellia_notifications';

  /// Success / info pop-ups on or off (errors always show). Loaded at start-up.
  static bool enabled = true;

  static Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    enabled = prefs.getBool(_prefKey) ?? true;
  }

  static Future<void> setEnabled(bool value) async {
    enabled = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefKey, value);
  }

  static void showSuccess(
    BuildContext context,
    String message, {
    String? title,
  }) {
    if (!enabled) return;
    ElegantNotification.success(
      title: Text(
        title ?? "Succès",
        style: const TextStyle(fontWeight: FontWeight.bold),
      ),
      description: Text(message),
      animation: AnimationType.fromTop,
      position: Alignment.topRight,
      width: 360,
    ).show(context);
  }

  static void showError(BuildContext context, String message, {String? title}) {
    ElegantNotification.error(
      title: Text(
        title ?? "Erreur",
        style: const TextStyle(fontWeight: FontWeight.bold),
      ),
      description: Text(message),
      animation: AnimationType.fromTop,
      position: Alignment.topRight,
      width: 360,
    ).show(context);
  }

  static void showInfo(BuildContext context, String message, {String? title}) {
    if (!enabled) return;
    ElegantNotification.info(
      title: Text(
        title ?? "Info",
        style: const TextStyle(fontWeight: FontWeight.bold),
      ),
      description: Text(message),
      animation: AnimationType.fromTop,
      position: Alignment.topRight,
      width: 360,
    ).show(context);
  }
}
