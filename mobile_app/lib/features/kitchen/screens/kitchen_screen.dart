import 'dart:async';
import 'package:flutter/material.dart';
import 'package:mellia_pos_mobile/core/theme/app_theme.dart';
import 'package:mellia_pos_mobile/shared/widgets/motion.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mellia_pos_mobile/features/kitchen/data/kitchen_model.dart';
import 'package:mellia_pos_mobile/features/kitchen/data/kitchen_repository.dart';
import 'package:mellia_pos_mobile/features/auth/providers/auth_provider.dart';

class KitchenScreen extends ConsumerStatefulWidget {
  const KitchenScreen({super.key});

  @override
  ConsumerState<KitchenScreen> createState() => _KitchenScreenState();
}

class _KitchenScreenState extends ConsumerState<KitchenScreen> {
  Timer? _refreshTimer;

  /// Cashier whose orders are shown; null = everyone.
  String? _cashier;
  bool _deleting = false;

  static String _cashierOf(KitchenOrder o) => o.sale.user?.name ?? 'Sans nom';

  bool _canManage() {
    final role = ref.read(authNotifierProvider).asData?.value?.role;
    return role == 'ADMIN' || role == 'MANAGER';
  }

  /// Deletes every order on screen (all of them, or only the selected cashier's), after a confirmation.
  Future<void> _deleteAll(List<KitchenOrder> visible) async {
    if (visible.isEmpty) return;
    final who = _cashier;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        icon: const Icon(
          Icons.delete_sweep_rounded,
          color: AppTheme.error,
          size: 32,
        ),
        title: Text(
          who == null
              ? "Vider la cuisine ?"
              : "Supprimer les commandes de $who ?",
        ),
        content: Text(
          "${visible.length} commande${visible.length > 1 ? 's' : ''} ${visible.length > 1 ? 'seront supprimées' : 'sera supprimée'} de la cuisine. "
          "Les ventes et les tickets ne sont pas touchés.",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text("Annuler"),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text("Supprimer"),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    setState(() => _deleting = true);
    try {
      final repo = await ref.read(kitchenRepositoryProvider.future);
      final n = await repo.deleteMany(
        visible.map((o) => o.id).toList(),
        all: who == null,
      );
      if (mounted) {
        setState(() => _cashier = null);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              "$n commande${n > 1 ? 's' : ''} supprimée${n > 1 ? 's' : ''}.",
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Suppression impossible : $e"),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    } finally {
      ref.invalidate(kitchenOrdersProvider);
      if (mounted) setState(() => _deleting = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      if (mounted) {
        ref.invalidate(kitchenOrdersProvider);
      }
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ordersAsync = ref.watch(kitchenOrdersProvider);

    return Scaffold(
      backgroundColor: AppTheme.canvas,
      appBar: AppBar(
        title: const Text('Cuisine'),
        elevation: 0,
        actions: [
          IconButton(
            tooltip: "Actualiser",
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ref.invalidate(kitchenOrdersProvider),
          ),
          if (_canManage())
            _deleting
                ? const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : IconButton(
                    tooltip: "Tout supprimer",
                    icon: const Icon(
                      Icons.delete_sweep_rounded,
                      color: AppTheme.error,
                    ),
                    onPressed: () {
                      final orders =
                          ref.read(kitchenOrdersProvider).asData?.value ??
                          const <KitchenOrder>[];
                      final active = orders.where(
                        (o) => o.status != 'DELIVERED',
                      );
                      _deleteAll(
                        _cashier == null
                            ? active.toList()
                            : active
                                  .where((o) => _cashierOf(o) == _cashier)
                                  .toList(),
                      );
                    },
                  ),
          const SizedBox(width: 4),
        ],
      ),
      body: ordersAsync.when(
        data: (orders) {
          final allActive = orders
              .where((o) => o.status != 'DELIVERED')
              .toList();

          // Orders per cashier, for the filter chips
          final counts = <String, int>{};
          for (final o in allActive) {
            counts[_cashierOf(o)] = (counts[_cashierOf(o)] ?? 0) + 1;
          }
          final selected = counts.containsKey(_cashier) ? _cashier : null;
          final activeOrders = selected == null
              ? allActive
              : allActive.where((o) => _cashierOf(o) == selected).toList();

          final filters = counts.length < 2
              ? const SizedBox.shrink()
              : SizedBox(
                  height: 52,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                    children: [
                      _CashierChip(
                        label: "Tous",
                        count: allActive.length,
                        selected: selected == null,
                        onTap: () => setState(() => _cashier = null),
                      ),
                      for (final e in counts.entries)
                        _CashierChip(
                          label: e.key,
                          count: e.value,
                          selected: selected == e.key,
                          onTap: () => setState(() => _cashier = e.key),
                        ),
                    ],
                  ),
                );

          if (activeOrders.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.restaurant_menu,
                    size: 80,
                    color: Colors.grey[300],
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    "Aucune commande en cours",
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            );
          }

          return Column(
            children: [
              filters,
              Expanded(
                child: GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                    maxCrossAxisExtent: 400,
                    mainAxisExtent: 320,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                  ),
                  itemCount: activeOrders.length,
                  itemBuilder: (context, index) {
                    final order = activeOrders[index];
                    return FadeSlideIn(
                      index: index,
                      child: _KitchenOrderCard(order: order),
                    );
                  },
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Erreur: $err')),
      ),
    );
  }
}

class _KitchenOrderCard extends ConsumerWidget {
  final KitchenOrder order;
  const _KitchenOrderCard({required this.order});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final elapsed = DateTime.now().difference(order.createdAt).inMinutes;
    final isLate = elapsed > 20;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: _getStatusColor(order.status).withOpacity(0.2),
          width: 2,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: _getStatusColor(order.status).withOpacity(0.05),
              border: Border(
                bottom: BorderSide(
                  color: _getStatusColor(order.status).withOpacity(0.1),
                ),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: _getStatusColor(order.status).withOpacity(0.2),
                    ),
                  ),
                  child: Icon(
                    Icons.receipt_rounded,
                    size: 14,
                    color: _getStatusColor(order.status),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  "#${order.sale.ticketNum.split('-').last}",
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 20,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: _getStatusColor(order.status),
                    borderRadius: BorderRadius.circular(4),
                    boxShadow: [
                      BoxShadow(
                        color: _getStatusColor(order.status).withOpacity(0.3),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Text(
                    _getStatusText(order.status),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Sub-header with order type and time
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                _buildOrderTypeBadge(order.orderType),
                if (order.sale.user?.name != null) ...[
                  const SizedBox(width: 8),
                  Flexible(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.person_outline_rounded,
                          size: 14,
                          color: AppTheme.muted,
                        ),
                        const SizedBox(width: 3),
                        Flexible(
                          child: Text(
                            order.sale.user!.name,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.muted,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const Spacer(),
                Icon(
                  Icons.access_time_rounded,
                  size: 14,
                  color: isLate ? Colors.red : Colors.grey[600],
                ),
                const SizedBox(width: 4),
                Text(
                  _elapsedLabel(elapsed),
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: isLate ? FontWeight.w900 : FontWeight.bold,
                    color: isLate ? Colors.red : Colors.grey[700],
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, thickness: 1, indent: 16, endIndent: 16),

          // Items
          Expanded(
            child: Consumer(
              builder: (context, ref, child) {
                final foodItems = order.sale.items
                    .where((i) => i.product.type == 'FOOD')
                    .toList();
                final otherItems = order.sale.items
                    .where((i) => i.product.type != 'FOOD')
                    .toList();
                final displayItems = foodItems.isNotEmpty
                    ? foodItems
                    : order.sale.items;

                return ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount:
                      displayItems.length +
                      (foodItems.isNotEmpty && otherItems.isNotEmpty ? 1 : 0),
                  itemBuilder: (context, idx) {
                    if (idx == displayItems.length) {
                      return Padding(
                        padding: const EdgeInsets.only(top: 8.0),
                        child: Text(
                          "+ ${otherItems.length} Boissons/Autres",
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey[500],
                          ),
                        ),
                      );
                    }
                    final item = displayItems[idx];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 6.0),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.black,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              "${item.quantity.toInt()}x",
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              item.product.name,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                );
              },
            ),
          ),
          // Footer Actions
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(child: _buildActionButton(context, ref)),
                Consumer(
                  builder: (context, ref, child) {
                    final user = ref.watch(authNotifierProvider).value;
                    if (user?.role == 'ADMIN') {
                      return Padding(
                        padding: const EdgeInsets.only(left: 8.0),
                        child: IconButton(
                          onPressed: () => _confirmDelete(context, ref),
                          icon: const Icon(
                            Icons.delete_outline,
                            color: Colors.redAccent,
                          ),
                          style: IconButton.styleFrom(
                            backgroundColor: Colors.red[50],
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                      );
                    }
                    return const SizedBox.shrink();
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(BuildContext context, WidgetRef ref) {
    if (order.status == 'PENDING') {
      return ElevatedButton.icon(
        onPressed: () => _updateStatus(ref, 'IN_PREPARATION'),
        icon: const Icon(Icons.local_fire_department),
        label: const Text("LANCER"),
        style: ElevatedButton.styleFrom(backgroundColor: AppTheme.brandOrange),
      );
    }
    if (order.status == 'IN_PREPARATION') {
      return ElevatedButton.icon(
        onPressed: () => _updateStatus(ref, 'READY'),
        icon: const Icon(Icons.check_circle),
        label: const Text("PRÊT"),
        style: ElevatedButton.styleFrom(backgroundColor: AppTheme.limeDark),
      );
    }
    return ElevatedButton(
      onPressed: () => _updateStatus(ref, 'DELIVERED'),
      style: ElevatedButton.styleFrom(backgroundColor: AppTheme.ink),
      child: const Text("TERMINER"),
    );
  }

  Future<void> _updateStatus(WidgetRef ref, String status) async {
    final repo = await ref.read(kitchenRepositoryProvider.future);
    await repo.updateStatus(order.id, status);
    ref.invalidate(kitchenOrdersProvider);
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Supprimer la commande"),
        content: const Text(
          "Êtes-vous sûr de vouloir supprimer définitivement cette commande en cuisine ?",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text("ANNULER"),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text("SUPPRIMER"),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final repo = await ref.read(kitchenRepositoryProvider.future);
      await repo.deleteOrder(order.id);
      ref.invalidate(kitchenOrdersProvider);
    }
  }

  Widget _buildOrderTypeBadge(String type) {
    IconData icon;
    String label;
    Color color;

    switch (type) {
      case 'DELIVERY':
        icon = Icons.delivery_dining_rounded;
        label = "LIVRAISON";
        color = Colors.orange[700]!;
        break;
      case 'TAKEAWAY':
        icon = Icons.shopping_bag_outlined;
        label = "À EMPORTER";
        color = Colors.blue[700]!;
        break;
      default:
        icon = Icons.restaurant_rounded;
        label = "SUR PLACE";
        color = Colors.green[700]!;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 10,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'PENDING':
        return Colors.red;
      case 'IN_PREPARATION':
        return Colors.orange;
      case 'READY':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'PENDING':
        return 'ATTENTE';
      case 'IN_PREPARATION':
        return 'EN COURS';
      case 'READY':
        return 'PRÊT';
      default:
        return status;
    }
  }
}

/// "12 min", "2 h 05", "3 j" — old orders stay readable.
String _elapsedLabel(int minutes) {
  if (minutes < 60) return '$minutes min';
  if (minutes < 24 * 60) {
    return '${minutes ~/ 60} h ${(minutes % 60).toString().padLeft(2, '0')}';
  }
  return '${minutes ~/ (24 * 60)} j';
}

class _CashierChip extends StatelessWidget {
  final String label;
  final int count;
  final bool selected;
  final VoidCallback onTap;

  const _CashierChip({
    required this.label,
    required this.count,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Pressable(
        onTap: onTap,
        child: AnimatedContainer(
          duration: AppTheme.fast,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected ? AppTheme.ink : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: selected ? AppTheme.ink : AppTheme.line),
          ),
          child: Text(
            "$label · $count",
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 13,
              color: selected ? Colors.white : AppTheme.ink,
            ),
          ),
        ),
      ),
    );
  }
}
