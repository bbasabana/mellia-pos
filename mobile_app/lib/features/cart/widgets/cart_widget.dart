import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:mellia_pos_mobile/core/theme/app_theme.dart';
import 'package:mellia_pos_mobile/features/cart/cart_provider.dart';
import 'package:mellia_pos_mobile/features/cart/drafts_provider.dart';
import 'package:mellia_pos_mobile/core/services/notification_service.dart';
import 'package:mellia_pos_mobile/shared/widgets/primary_button.dart';
import 'package:mellia_pos_mobile/features/sales/widgets/payment_modal.dart';
import 'package:mellia_pos_mobile/features/clients/widgets/client_selection_modal.dart';
import 'package:mellia_pos_mobile/features/cart/widgets/delivery_modal.dart';

class CartWidget extends ConsumerStatefulWidget {
  const CartWidget({super.key});

  @override
  ConsumerState<CartWidget> createState() => _CartWidgetState();
}

class _CartWidgetState extends ConsumerState<CartWidget> {
  final GlobalKey<AnimatedListState> _listKey = GlobalKey<AnimatedListState>();
  List<CartItem> _displayedItems = [];

  @override
  void initState() {
    super.initState();
    _displayedItems = ref.read(cartNotifierProvider).items.values.toList();
  }

  void _syncItems(List<CartItem> newItems) {
    if (!mounted) return;

    // 1. Handle Deletions
    for (int i = 0; i < _displayedItems.length; i++) {
      final item = _displayedItems[i];
      if (!newItems.any((ni) => ni.product.id == item.product.id)) {
        final removedItem = _displayedItems[i];
        setState(() {
          _displayedItems.removeAt(i);
        });
        _listKey.currentState?.removeItem(
          i,
          (context, animation) => _buildItem(removedItem, animation),
          duration: const Duration(milliseconds: 300),
        );
        i--;
      }
    }

    // 2. Handle Additions & Updates
    for (var ni in newItems) {
      final existsIndex = _displayedItems.indexWhere(
        (di) => di.product.id == ni.product.id,
      );
      if (existsIndex == -1) {
        setState(() {
          _displayedItems.add(ni);
        });
        _listKey.currentState?.insertItem(
          _displayedItems.length - 1,
          duration: const Duration(milliseconds: 400),
        );
      } else {
        // Quantity update: just update data and trigger rebuild via setState
        if (_displayedItems[existsIndex].quantity != ni.quantity) {
          setState(() {
            _displayedItems[existsIndex] = ni;
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cartState = ref.watch(cartNotifierProvider);
    final cartItems = cartState.items.values.toList();

    // Sync if lengths or content change
    bool shouldSync = _displayedItems.length != cartItems.length;
    if (!shouldSync) {
      for (int i = 0; i < _displayedItems.length; i++) {
        if (_displayedItems[i] != cartItems[i]) {
          shouldSync = true;
          break;
        }
      }
    }

    if (shouldSync) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _syncItems(cartItems);
      });
    }

    return Stack(
      children: [
        Container(
          constraints: const BoxConstraints(minWidth: 320, maxWidth: 450),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(-5, 0),
              ),
            ],
          ),
          child: Column(
            children: [
              _buildHeader(cartState),
              _buildClientSelector(cartState),
              _buildOrderTypeSelector(cartState),
              Expanded(
                child: cartItems.isEmpty
                    ? _buildEmptyState()
                    : AnimatedList(
                        key: _listKey,
                        initialItemCount: _displayedItems.length,
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        itemBuilder: (context, index, animation) {
                          if (index >= _displayedItems.length) {
                            return const SizedBox();
                          }
                          return _buildItem(_displayedItems[index], animation);
                        },
                      ),
              ),
              if (cartItems.isNotEmpty) _buildFooter(cartState),
            ],
          ),
        ),
        if (cartState.isLoading)
          Positioned.fill(
            child: Container(
              color: Colors.white.withOpacity(0.7),
              child: const Center(
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildHeader(CartState state) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 24, 16, 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              const Text(
                "Panier",
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.primaryBlue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  "${state.itemCount}",
                  style: const TextStyle(
                    color: AppTheme.primaryBlue,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          if (state.items.isNotEmpty)
            IconButton(
              onPressed: () =>
                  ref.read(cartNotifierProvider.notifier).clearCart(),
              icon: const Icon(Icons.delete_sweep_outlined, color: Colors.grey),
              tooltip: "Vider le panier",
            ),
        ],
      ),
    );
  }

  Widget _buildClientSelector(CartState state) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: InkWell(
        onTap: () async {
          final selected = await showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (ctx) => Padding(
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).viewPadding.top + 50,
              ),
              child: const ClientSelectionModal(),
            ),
          );
          if (selected != null) {
            ref.read(cartNotifierProvider.notifier).setClient(selected);
          }
        },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: state.selectedClient != null
                ? AppTheme.primaryBlue.withOpacity(0.05)
                : Colors.grey[50],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: state.selectedClient != null
                  ? AppTheme.primaryBlue.withOpacity(0.3)
                  : Colors.grey[200]!,
            ),
          ),
          child: Row(
            children: [
              Icon(
                state.selectedClient != null
                    ? Icons.person
                    : Icons.person_add_outlined,
                size: 20,
                color: state.selectedClient != null
                    ? AppTheme.primaryBlue
                    : Colors.grey,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  state.selectedClient?.name ?? "Ajouter un client",
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: state.selectedClient != null
                        ? FontWeight.bold
                        : FontWeight.normal,
                    color: state.selectedClient != null
                        ? AppTheme.primaryBlue
                        : Colors.black54,
                  ),
                ),
              ),
              if (state.selectedClient != null)
                GestureDetector(
                  onTap: () =>
                      ref.read(cartNotifierProvider.notifier).setClient(null),
                  child: const Icon(Icons.close, size: 16, color: Colors.grey),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOrderTypeSelector(CartState state) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          _orderTypeButton("SUR PLACE", "DINE_IN", Icons.restaurant, state),
          _orderTypeButton("EMPORTER", "TAKEAWAY", Icons.shopping_bag, state),
          _orderTypeButton(
            "LIVRAISON",
            "DELIVERY",
            Icons.delivery_dining,
            state,
          ),
        ],
      ),
    );
  }

  Widget _orderTypeButton(
    String label,
    String type,
    IconData icon,
    CartState state,
  ) {
    final isSelected = state.orderType == type;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          if (type == 'DELIVERY' && state.deliveryInfo == null) {
            _showDeliveryModal();
          } else {
            ref.read(cartNotifierProvider.notifier).setOrderType(type);
          }
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 18,
                color: isSelected ? AppTheme.primaryBlue : Colors.grey,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  color: isSelected ? AppTheme.primaryBlue : Colors.grey,
                ),
              ),
              if (type == 'DELIVERY' &&
                  state.deliveryInfo != null &&
                  isSelected)
                GestureDetector(
                  onTap: _showDeliveryModal,
                  child: Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      "Editer",
                      style: TextStyle(
                        fontSize: 8,
                        color: AppTheme.primaryBlue.withOpacity(0.7),
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  void _showDeliveryModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const DeliveryModal(),
    );
  }

  Widget _buildItem(CartItem item, Animation<double> animation) {
    return SizeTransition(
      sizeFactor: animation,
      child: FadeTransition(
        opacity: animation,
        child: Slidable(
          key: ValueKey(item.product.id),
          endActionPane: ActionPane(
            motion: const ScrollMotion(),
            extentRatio: 0.25,
            children: [
              SlidableAction(
                onPressed: (context) => ref
                    .read(cartNotifierProvider.notifier)
                    .removeItem(item.product.id),
                backgroundColor: Colors.redAccent,
                foregroundColor: Colors.white,
                icon: Icons.delete_outline,
                label: 'Sup.',
              ),
            ],
          ),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: Colors.grey[100]!)),
            ),
            child: Row(
              children: [
                _buildQuantityControl(item),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.product.name,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        "${item.unitPriceUsd}\$ • ${item.unitPriceCdf.toInt()} FC",
                        style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      "${item.totalUsd.toStringAsFixed(1)}\$",
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      "${item.totalCdf.toInt()} FC",
                      style: const TextStyle(
                        fontSize: 10,
                        color: AppTheme.orange600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildQuantityControl(CartItem item) {
    return Container(
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _qtyIcon(
            Icons.remove,
            () => ref
                .read(cartNotifierProvider.notifier)
                .removeItem(item.product.id),
          ),
          SizedBox(
            width: 30,
            child: Center(
              child: Text(
                "${item.quantity}",
                style: const TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                ),
              ),
            ),
          ),
          _qtyIcon(
            Icons.add,
            () => ref.read(cartNotifierProvider.notifier).addItem(item.product),
          ),
        ],
      ),
    );
  }

  Widget _qtyIcon(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Icon(icon, size: 14, color: Colors.black87),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.shopping_bag_outlined, size: 64, color: Colors.grey[200]),
          const SizedBox(height: 16),
          Text(
            "Votre panier est vide",
            style: TextStyle(
              color: Colors.grey[400],
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter(CartState state) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey[200]!)),
      ),
      child: Column(
        children: [
          _totalRow(
            "Total USD",
            "\$${state.totalUsd.toStringAsFixed(2)}",
            isPrimary: true,
          ),
          const SizedBox(height: 8),
          _totalRow(
            "Total CDF",
            "${state.totalCdf.toInt()} FC",
            color: AppTheme.orange600,
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () async {
                    final notifier = ref.read(cartNotifierProvider.notifier);
                    await notifier.saveDraft();
                    ref.invalidate(draftsNotifierProvider);
                    notifier.clearCart();
                    if (mounted) {
                      NotificationService.showInfo(
                        context,
                        "Mise en attente synchronisée.",
                      );
                    }
                  },
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    side: const BorderSide(color: Colors.grey),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text(
                    "Attente",
                    style: TextStyle(
                      color: Colors.black87,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: PrimaryButton(
                  text: "Encaisser (\$${state.totalUsd.toStringAsFixed(1)})",
                  onPressed: () {
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (ctx) => Padding(
                        padding: EdgeInsets.only(
                          bottom: MediaQuery.of(context).viewInsets.bottom,
                        ),
                        child: const PaymentModal(),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _totalRow(
    String label,
    String value, {
    bool isPrimary = false,
    Color? color,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Colors.grey,
            fontWeight: FontWeight.w500,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isPrimary ? 20 : 16,
            fontWeight: FontWeight.w900,
            color: color ?? (isPrimary ? AppTheme.primaryBlue : Colors.black87),
          ),
        ),
      ],
    );
  }
}
