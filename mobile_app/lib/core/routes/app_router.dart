import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mellia_pos_mobile/features/auth/providers/auth_provider.dart';
import 'package:mellia_pos_mobile/features/auth/screens/login_screen.dart';
import 'package:mellia_pos_mobile/features/kitchen/screens/kitchen_screen.dart';
import 'package:mellia_pos_mobile/features/sales/screens/dashboard_screen.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'app_router.g.dart';

class RouterNotifier extends ChangeNotifier {
  final Ref _ref;
  RouterNotifier(this._ref) {
    _ref.listen(authNotifierProvider, (_, __) => notifyListeners());
  }
}

@Riverpod(keepAlive: true)
GoRouter appRouter(AppRouterRef ref) {
  final notifier = RouterNotifier(ref);

  return GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: true,
    refreshListenable: notifier,
    redirect: (context, state) {
      final authState = ref.read(authNotifierProvider);
      final user = authState.asData?.value;
      final isLoggedIn = user != null;
      final isLoggingIn = state.uri.toString() == '/login';

      if (!isLoggedIn) {
        return isLoggingIn ? null : '/login';
      }

      // Role Based Redirect
      if (user!.role == 'KITCHEN') {
        if (state.uri.toString() != '/kitchen') return '/kitchen';
        return null;
      }

      if (user.role == 'CASHIER' ||
          user.role == 'ADMIN' ||
          user.role == 'MANAGER') {
        if (state.uri.toString() == '/kitchen') return '/';
      }

      if (isLoggingIn) {
        return '/';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/', builder: (context, state) => const DashboardScreen()),
      GoRoute(
        path: '/kitchen',
        builder: (context, state) => const KitchenScreen(),
      ),
    ],
  );
}
