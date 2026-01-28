import 'package:elegant_notification/elegant_notification.dart';
import 'package:elegant_notification/resources/arrays.dart';
import 'package:flutter/material.dart';

class NotificationService {
  static void showSuccess(
    BuildContext context,
    String message, {
    String? title,
  }) {
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
