import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mellia_pos_mobile/features/auth/providers/auth_provider.dart';
import 'package:mellia_pos_mobile/features/cart/cart_provider.dart';
import 'package:mellia_pos_mobile/features/cart/widgets/cart_widget.dart';
import 'package:mellia_pos_mobile/features/products/screens/product_grid_screen.dart';
import 'package:mellia_pos_mobile/features/settings/screens/settings_screen.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Responsive Layout: Tablet vs Phone
    // For Tablet: Row(ProductGrid, CartWidget)
    // For Phone: ProductGrid with FAB to open Cart Drawer

    final cartItemCount = ref.watch(cartNotifierProvider).itemCount;

    return LayoutBuilder(
      builder: (context, constraints) {
        final isTablet = constraints.maxWidth > 800; // Arbitrary breakpoint

        if (isTablet) {
          return const Scaffold(
            body: Row(
              children: [
                Expanded(child: ProductGridScreen()),
                VerticalDivider(width: 1),
                CartWidget(),
              ],
            ),
          );
        } else {
          return Scaffold(
            body: const ProductGridScreen(),
            floatingActionButton: cartItemCount > 0
                ? FloatingActionButton.extended(
                    onPressed: () {
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (ctx) => Padding(
                          padding: EdgeInsets.only(
                            top: MediaQuery.of(context).viewPadding.top + 20,
                          ),
                          child: const ClipRRect(
                            borderRadius: BorderRadius.vertical(
                              top: Radius.circular(16),
                            ),
                            child: CartWidget(),
                          ),
                        ),
                      );
                    },
                    icon: const Icon(Icons.shopping_cart),
                    label: Text("$cartItemCount articles"),
                  )
                : null,
            drawer: Drawer(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  UserAccountsDrawerHeader(
                    accountName: Text(
                      ref.watch(authNotifierProvider).asData?.value?.name ??
                          "Utilisateur",
                    ),
                    accountEmail: Text(
                      "${ref.watch(authNotifierProvider).asData?.value?.email} (${ref.watch(authNotifierProvider).asData?.value?.role})",
                    ),
                    decoration: const BoxDecoration(color: Color(0xFF1E293B)),
                    currentAccountPicture: const CircleAvatar(
                      backgroundColor: Colors.white,
                      child: Icon(Icons.person, color: Color(0xFF1E293B)),
                    ),
                  ),
                  ListTile(
                    leading: const Icon(Icons.settings),
                    title: const Text("Paramètres / Imprimante"),
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (c) => const SettingsScreen(),
                        ),
                      );
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.logout),
                    title: const Text("Déconnexion"),
                    onTap: () =>
                        ref.read(authNotifierProvider.notifier).logout(),
                  ),
                ],
              ),
            ),
          );
        }
      },
    );
  }
}
