import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mellia_pos_mobile/features/auth/providers/auth_provider.dart';
import 'package:mellia_pos_mobile/features/cart/cart_provider.dart';
import 'package:mellia_pos_mobile/features/cart/widgets/cart_widget.dart';
import 'package:mellia_pos_mobile/features/products/screens/product_grid_screen.dart';
import 'package:mellia_pos_mobile/core/constants/app_assets.dart';
import 'package:mellia_pos_mobile/core/theme/app_theme.dart';
import 'package:mellia_pos_mobile/core/services/printer_service.dart';
import 'package:mellia_pos_mobile/core/services/notification_service.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    // Auto-detect printer and test print on app startup
    _autoConfigPrinter();
  }

  Future<void> _autoConfigPrinter() async {
    Future.delayed(const Duration(seconds: 2), () async {
      final result = await ref
          .read(printerServiceProvider.notifier)
          .autoConnectAndTest();
      if (result != null && mounted) {
        if (result.contains("Erreur") || result.contains("Échec")) {
          // Fallback notification or just log
          debugPrint("Printer Auto-config: $result");
        } else {
          NotificationService.showSuccess(context, result);
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    // Responsive Layout: Tablet vs Phone
    final cartItemCount = ref.watch(cartNotifierProvider).itemCount;

    return LayoutBuilder(
      builder: (context, constraints) {
        final isTablet = constraints.maxWidth > 800; // Arbitrary breakpoint
        final user = ref.watch(authNotifierProvider).asData?.value;

        final scaffold = Scaffold(
          appBar: AppBar(
            leading: Builder(
              builder: (context) => IconButton(
                icon: const Icon(Icons.menu_open_rounded, size: 28),
                onPressed: () => Scaffold.of(context).openDrawer(),
              ),
            ),
            title: Image.asset(AppAssets.logo, height: 32),
            centerTitle: true,
            actions: [
              if (user != null)
                Padding(
                  padding: const EdgeInsets.only(right: 16.0),
                  child: Chip(
                    label: Text(
                      user.role ?? "User",
                      style: const TextStyle(fontSize: 10, color: Colors.white),
                    ),
                    backgroundColor: AppTheme.primaryBlue,
                    side: BorderSide.none,
                    padding: EdgeInsets.zero,
                    visualDensity: VisualDensity.compact,
                  ),
                ),
            ],
          ),
          drawer: Drawer(
            child: Column(
              children: [
                UserAccountsDrawerHeader(
                  accountName: Text(user?.name ?? "Utilisateur"),
                  accountEmail: Text(user?.email ?? ""),
                  decoration: const BoxDecoration(color: Color(0xFF1E293B)),
                  currentAccountPicture: CircleAvatar(
                    backgroundColor: Colors.white,
                    child: Text(
                      user?.name?.substring(0, 1).toUpperCase() ?? "U",
                      style: const TextStyle(
                        color: Color(0xFF1E293B),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(
                    Icons.shopping_basket_outlined,
                    color: AppTheme.primaryBlue,
                  ),
                  title: const Text("Caisse"),
                  onTap: () => Navigator.pop(context),
                ),
                ListTile(
                  leading: const Icon(
                    Icons.hourglass_bottom_rounded,
                    color: Colors.orange,
                  ),
                  title: const Text("Commandes en attente"),
                  onTap: () => context.push('/drafts'),
                ),
                if (user?.role == 'ADMIN' ||
                    user?.role == 'MANAGER' ||
                    user?.role == 'KITCHEN')
                  ListTile(
                    leading: const Icon(
                      Icons.restaurant_menu_rounded,
                      color: Color(0xFF10B981),
                    ),
                    title: const Text("Cuisine"),
                    onTap: () => context.push('/kitchen'),
                  ),
                ListTile(
                  leading: const Icon(
                    Icons.receipt_long_rounded,
                    color: Colors.blueGrey,
                  ),
                  title: const Text("Transactions"),
                  onTap: () => context.push('/transactions'),
                ),
                ListTile(
                  leading: const Icon(
                    Icons.settings_outlined,
                    color: Colors.grey,
                  ),
                  title: const Text("Paramètres"),
                  onTap: () => context.push('/settings'),
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.logout, color: Colors.red),
                  title: const Text(
                    "Déconnexion",
                    style: TextStyle(
                      color: Colors.red,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  onTap: () {
                    showDialog(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text("Déconnexion"),
                        content: const Text(
                          "Êtes-vous sûr de vouloir vous déconnecter ?",
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(ctx),
                            child: const Text("Annuler"),
                          ),
                          ElevatedButton(
                            onPressed: () {
                              Navigator.pop(ctx);
                              ref.read(authNotifierProvider.notifier).logout();
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.red,
                            ),
                            child: const Text("Déconnecter"),
                          ),
                        ],
                      ),
                    );
                  },
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
          body: isTablet
              ? const Row(
                  children: [
                    Expanded(flex: 3, child: ProductGridScreen()),
                    VerticalDivider(width: 1),
                    Expanded(flex: 1, child: CartWidget()),
                  ],
                )
              : const ProductGridScreen(),
          floatingActionButton: !isTablet && cartItemCount > 0
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
        );

        return scaffold;
      },
    );
  }
}
