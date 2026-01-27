import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mellia_pos_mobile/features/auth/providers/auth_provider.dart';
import 'package:mellia_pos_mobile/features/auth/screens/login_screen.dart';
import 'package:mellia_pos_mobile/features/kitchen/screens/kitchen_screen.dart';
import 'package:mellia_pos_mobile/features/sales/screens/dashboard_screen.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'app_router.g.dart';

@Riverpod(keepAlive: true)
GoRouter appRouter(AppRouterRef ref) {
  final authState = ref.watch(authNotifierProvider);

  return GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: true,
    redirect: (context, state) {
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

      if (user.role == 'CASHIER') {
        if (state.uri.toString() == '/kitchen') return '/';
        // Allow other routes for Cashier (Settings, etc.)
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
      ), // Import will be needed
    ],
  );
}
