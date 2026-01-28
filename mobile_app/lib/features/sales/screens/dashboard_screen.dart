import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mellia_pos_mobile/features/auth/providers/auth_provider.dart';
import 'package:mellia_pos_mobile/features/cart/cart_provider.dart';
import 'package:mellia_pos_mobile/features/cart/widgets/cart_widget.dart';
import 'package:mellia_pos_mobile/features/products/screens/product_grid_screen.dart';
import 'package:mellia_pos_mobile/features/products/data/product_repository.dart';
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
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    // Auto-detect printer and test print on app startup
    _autoConfigPrinter();
    // Setup background auto-refresh every 3 minutes
    _refreshTimer = Timer.periodic(const Duration(minutes: 3), (timer) {
      ref.invalidate(productsProvider);
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
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
          drawer: _buildPremiumDrawer(context, user),
          body: isTablet
              ? Row(
                  children: [
                    _buildFixedSidebar(context, user),
                    const Expanded(flex: 3, child: ProductGridScreen()),
                    const VerticalDivider(width: 1, color: Colors.black12),
                    const Expanded(flex: 1, child: CartWidget()),
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

  Widget _buildFixedSidebar(BuildContext context, UserState? user) {
    return Container(
      width: 280,
      decoration: const BoxDecoration(
        color: Color(0xFF1E293B),
        border: Border(right: BorderSide(color: Colors.black12)),
      ),
      child: _buildNavigationList(context, user, isTablet: true),
    );
  }

  Widget _buildPremiumDrawer(BuildContext context, UserState? user) {
    return Drawer(
      backgroundColor: const Color(0xFF1E293B),
      child: _buildNavigationList(context, user, isTablet: false),
    );
  }

  Widget _buildNavigationList(
    BuildContext context,
    UserState? user, {
    required bool isTablet,
  }) {
    return Column(
      children: [
        if (!isTablet)
          UserAccountsDrawerHeader(
            accountName: Text(user?.name ?? "Utilisateur"),
            accountEmail: Text(user?.email ?? ""),
            decoration: const BoxDecoration(color: Color(0xFF0F172A)),
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
          )
        else
          Container(
            padding: const EdgeInsets.fromLTRB(24, 64, 24, 32),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: Colors.white.withOpacity(0.1),
                  child: Text(
                    user?.name?.substring(0, 1).toUpperCase() ?? "U",
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user?.name ?? "Utilisateur",
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        user?.role ?? "Session",
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.5),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        _buildNavEntry(
          icon: Icons.store_rounded,
          label: "Caisse Principal",
          color: Colors.blueAccent,
          onTap: () {
            if (!isTablet) Navigator.pop(context);
          },
        ),
        _buildNavEntry(
          icon: Icons.hourglass_bottom_rounded,
          label: "Brouillons / Attente",
          color: Colors.orange,
          onTap: () => context.push('/drafts'),
        ),
        if (user?.role == 'ADMIN' ||
            user?.role == 'MANAGER' ||
            user?.role == 'KITCHEN')
          _buildNavEntry(
            icon: Icons.restaurant_menu_rounded,
            label: "Cuisine (KDS)",
            color: const Color(0xFF10B981),
            onTap: () => context.push('/kitchen'),
          ),
        _buildNavEntry(
          icon: Icons.receipt_long_rounded,
          label: "Historique Ventes",
          color: Colors.purpleAccent,
          onTap: () => context.push('/transactions'),
        ),
        _buildNavEntry(
          icon: Icons.settings_rounded,
          label: "Paramètres App",
          color: Colors.grey,
          onTap: () => context.push('/settings'),
        ),
        const Spacer(),
        const Divider(color: Colors.white10, indent: 24, endIndent: 24),
        _buildNavEntry(
          icon: Icons.logout_rounded,
          label: "Déconnexion",
          color: Colors.redAccent,
          onTap: () => _showLogoutDialog(context),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildNavEntry({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        leading: Icon(icon, color: color, size: 22),
        title: Text(
          label,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        onTap: onTap,
        dense: true,
        hoverColor: Colors.white10,
        visualDensity: VisualDensity.compact,
      ),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Déconnexion"),
        content: const Text("Voulez-vous vraiment vous déconnecter ?"),
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
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text("Déconnecter"),
          ),
        ],
      ),
    );
  }
}
