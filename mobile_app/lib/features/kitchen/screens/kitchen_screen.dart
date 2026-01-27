import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mellia_pos_mobile/features/auth/providers/auth_provider.dart';

class KitchenScreen extends ConsumerWidget {
  const KitchenScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Cuisine'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              ref.read(authNotifierProvider.notifier).logout();
            },
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.kitchen, size: 64, color: Colors.orange),
            SizedBox(height: 16),
            Text(
              'Menu Cuisine',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            Text('Commandes à préparer...'),
          ],
        ),
      ),
    );
  }
}
