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
import 'package:mellia_pos_mobile/shared/widgets/motion.dart';
import 'package:mellia_pos_mobile/core/services/receipt_name.dart';

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
      // Finds the printer (built-in Sunmi or saved Bluetooth) without printing a test page.
      final result = await ref
          .read(printerServiceProvider.notifier)
          .autoConnect();
      if (result != null && mounted) {
        NotificationService.showSuccess(context, result);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final cartItemCount = ref.watch(cartNotifierProvider).itemCount;

    return LayoutBuilder(
      builder: (context, constraints) {
        final isTablet = constraints.maxWidth > 800;
        final user = ref.watch(authNotifierProvider).asData?.value;

        return Scaffold(
          appBar: AppBar(
            toolbarHeight: 62,
            titleSpacing: isTablet ? 20 : 0,
            leading: isTablet
                ? null
                : Builder(
                    builder: (context) => IconButton(
                      icon: const Icon(Icons.menu_rounded, size: 26),
                      onPressed: () => Scaffold.of(context).openDrawer(),
                    ),
                  ),
            automaticallyImplyLeading: !isTablet,
            title: Row(
              children: [
                Image.asset(AppAssets.logo, height: 34),
                const SizedBox(width: 10),
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Caisse',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.3,
                      ),
                    ),
                    Text(
                      'Mellia Restaurant',
                      style: TextStyle(
                        fontSize: 11.5,
                        color: AppTheme.muted,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            actions: [
              if (user != null)
                Padding(
                  padding: const EdgeInsets.only(right: 14),
                  child: _Avatar(name: user.name, size: 34),
                ),
            ],
          ),
          drawer: Drawer(
            backgroundColor: const Color(0xFFF7F9FB),
            surfaceTintColor: Colors.transparent,
            shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.horizontal(right: Radius.circular(26)),
            ),
            child: _buildNavigationList(context, user, isTablet: false),
          ),
          body: isTablet
              ? Row(
                  children: [
                    Container(
                      width: 260,
                      decoration: const BoxDecoration(
                        color: Color(0xFFF7F9FB),
                        border: Border(right: BorderSide(color: AppTheme.line)),
                      ),
                      child: _buildNavigationList(
                        context,
                        user,
                        isTablet: true,
                      ),
                    ),
                    const Expanded(flex: 3, child: ProductGridScreen()),
                    const VerticalDivider(width: 1),
                    const Expanded(flex: 1, child: CartWidget()),
                  ],
                )
              : const ProductGridScreen(),
          floatingActionButtonLocation:
              FloatingActionButtonLocation.centerFloat,
          floatingActionButton: isTablet
              ? null
              : AnimatedSwitcher(
                  duration: AppTheme.medium,
                  switchInCurve: Curves.easeOutBack,
                  switchOutCurve: Curves.easeInCubic,
                  transitionBuilder: (child, anim) => FadeTransition(
                    opacity: anim,
                    child: ScaleTransition(
                      scale: Tween(begin: 0.85, end: 1.0).animate(anim),
                      child: child,
                    ),
                  ),
                  child: cartItemCount == 0
                      ? const SizedBox.shrink(key: ValueKey('empty'))
                      : _CartButton(
                          key: const ValueKey('cart'),
                          count: cartItemCount,
                          onTap: () => _openCart(context),
                        ),
                ),
        );
      },
    );
  }

  void _openCart(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      showDragHandle: false,
      backgroundColor: Colors.transparent,
      barrierColor: AppTheme.ink.withValues(alpha: 0.35),
      sheetAnimationStyle: const AnimationStyle(
        duration: Duration(milliseconds: 380),
        reverseDuration: Duration(milliseconds: 240),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          top: MediaQuery.of(context).viewPadding.top + 20,
        ),
        child: const ClipRRect(
          borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
          child: CartWidget(),
        ),
      ),
    );
  }

  Widget _buildNavigationList(
    BuildContext context,
    UserState? user, {
    required bool isTablet,
  }) {
    final canKitchen =
        user?.role == 'ADMIN' ||
        user?.role == 'MANAGER' ||
        user?.role == 'KITCHEN';
    void go(String path) {
      if (!isTablet) Navigator.pop(context);
      context.push(path);
    }

    final entries = <Widget>[
      _NavEntry(
        icon: Icons.point_of_sale_rounded,
        label: 'Caisse',
        color: AppTheme.cyanDark,
        selected: true,
        onTap: () {
          if (!isTablet) Navigator.pop(context);
        },
      ),
      _NavEntry(
        icon: Icons.hourglass_bottom_rounded,
        label: 'Brouillons / attente',
        color: AppTheme.brandOrange,
        onTap: () => go('/drafts'),
      ),
      if (canKitchen)
        _NavEntry(
          icon: Icons.restaurant_menu_rounded,
          label: 'Cuisine',
          color: AppTheme.limeDark,
          onTap: () => go('/kitchen'),
        ),
      _NavEntry(
        icon: Icons.receipt_long_rounded,
        label: 'Historique des ventes',
        color: const Color(0xFF7C5CFF),
        onTap: () => go('/transactions'),
      ),
      _NavEntry(
        icon: Icons.tune_rounded,
        label: 'Paramètres',
        color: AppTheme.muted,
        onTap: () => go('/settings'),
      ),
    ];

    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 6),
            child: Image.asset(
              AppAssets.logo,
              height: 46,
              alignment: Alignment.centerLeft,
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
            child: SoftCard(
              padding: const EdgeInsets.all(12),
              radius: 16,
              child: Row(
                children: [
                  _Avatar(name: user?.name, size: 40),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.name ?? 'Utilisateur',
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 15,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _roleLabel(user?.role),
                          style: const TextStyle(
                            color: AppTheme.muted,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        if (ref.watch(receiptNameProvider).isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 2),
                            child: Text(
                              "Ticket : ${ref.watch(receiptNameProvider)}",
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: AppTheme.cyanDark,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const Padding(
            padding: EdgeInsets.fromLTRB(24, 14, 24, 6),
            child: Text(
              'NAVIGATION',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: AppTheme.subtle,
                letterSpacing: 0.8,
              ),
            ),
          ),
          for (var i = 0; i < entries.length; i++)
            FadeSlideIn(index: i, offset: 8, child: entries[i]),
          const Spacer(),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: _NavEntry(
              icon: Icons.logout_rounded,
              label: 'Déconnexion',
              color: AppTheme.error,
              onTap: () => _showLogoutDialog(context),
              padded: false,
            ),
          ),
          const SizedBox(height: 14),
        ],
      ),
    );
  }

  static String _roleLabel(String? role) {
    switch (role) {
      case 'ADMIN':
        return 'Administrateur';
      case 'MANAGER':
        return 'Gérant';
      case 'CASHIER':
        return 'Caissier';
      case 'KITCHEN':
        return 'Cuisine';
      default:
        return role ?? 'Session';
    }
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
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
            child: const Text("Déconnecter"),
          ),
        ],
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  final String? name;
  final double size;
  const _Avatar({required this.name, required this.size});

  @override
  Widget build(BuildContext context) {
    final letter = (name != null && name!.isNotEmpty)
        ? name!.substring(0, 1).toUpperCase()
        : 'U';
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppTheme.cyan, AppTheme.cyanDark],
        ),
      ),
      child: Text(
        letter,
        style: TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w700,
          fontSize: size * 0.42,
        ),
      ),
    );
  }
}

class _NavEntry extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  final bool selected;
  final bool padded;

  const _NavEntry({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
    this.selected = false,
    this.padded = true,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padded
          ? const EdgeInsets.symmetric(horizontal: 14, vertical: 2)
          : EdgeInsets.zero,
      child: Pressable(
        scale: 0.98,
        onTap: onTap,
        child: AnimatedContainer(
          duration: AppTheme.fast,
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
          decoration: BoxDecoration(
            color: selected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            boxShadow: selected ? AppTheme.softShadow : null,
          ),
          child: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Icon(icon, color: color, size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 14.5,
                    fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                    color: AppTheme.ink,
                  ),
                ),
              ),
              if (selected)
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    color: AppTheme.cyan,
                    shape: BoxShape.circle,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CartButton extends StatelessWidget {
  final int count;
  final VoidCallback onTap;
  const _CartButton({super.key, required this.count, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Pressable(
      onTap: onTap,
      child: Container(
        height: 56,
        padding: const EdgeInsets.only(left: 8, right: 22),
        decoration: BoxDecoration(
          color: AppTheme.ink,
          borderRadius: BorderRadius.circular(30),
          boxShadow: [
            BoxShadow(
              color: AppTheme.ink.withValues(alpha: 0.28),
              blurRadius: 24,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(
                color: AppTheme.lime,
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: AnimatedSwitcher(
                duration: AppTheme.fast,
                transitionBuilder: (c, a) =>
                    ScaleTransition(scale: a, child: c),
                child: Text(
                  '$count',
                  key: ValueKey(count),
                  style: const TextStyle(
                    color: AppTheme.ink,
                    fontWeight: FontWeight.w800,
                    fontSize: 15,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'Voir le panier',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
            ),
            const SizedBox(width: 8),
            const Icon(
              Icons.arrow_forward_rounded,
              color: Colors.white70,
              size: 18,
            ),
          ],
        ),
      ),
    );
  }
}
