import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mellia_pos_mobile/features/cart/drafts_provider.dart';
import 'package:mellia_pos_mobile/features/cart/cart_provider.dart';
import 'package:mellia_pos_mobile/features/products/data/product_model.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';

class DraftsScreen extends ConsumerWidget {
  const DraftsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draftsAsync = ref.watch(draftsNotifierProvider);
    final dateFormat = DateFormat('dd/MM HH:mm');

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: const Text("Brouillons (Web & Local)"),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () =>
                ref.read(draftsNotifierProvider.notifier).refresh(),
          ),
        ],
      ),
      body: draftsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text("Erreur: $err")),
        data: (drafts) => drafts.isEmpty
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.hourglass_empty_rounded,
                      size: 80,
                      color: Colors.grey[300],
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      "Aucun brouillon trouvé",
                      style: TextStyle(color: Colors.grey),
                    ),
                  ],
                ),
              )
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: drafts.length,
                itemBuilder: (context, index) {
                  final draft = drafts[index];
                  final items = draft.rawData['items'] as List? ?? [];
                  final totalUsd =
                      double.tryParse(draft.rawData['totalBrut'].toString()) ??
                      0.0;
                  final totalCdf =
                      double.tryParse(draft.rawData['totalCdf'].toString()) ??
                      0.0;

                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ListTile(
                      contentPadding: const EdgeInsets.all(16),
                      title: Text(
                        "Commande #${draft.ticketNum}",
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      subtitle: Text(
                        "${items.length} articles • ${dateFormat.format(draft.createdAt)}",
                      ),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            "\$${totalUsd.toStringAsFixed(2)}",
                            style: const TextStyle(
                              fontWeight: FontWeight.w900,
                              color: Colors.blue,
                            ),
                          ),
                          Text(
                            "${totalCdf.toInt()} FC",
                            style: const TextStyle(
                              fontSize: 10,
                              color: Colors.orange,
                            ),
                          ),
                        ],
                      ),
                      onTap: () => _resumeDraft(context, ref, draft),
                    ),
                  );
                },
              ),
      ),
    );
  }

  void _resumeDraft(BuildContext context, WidgetRef ref, DraftOrder draft) {
    // Convert JSON to CartState
    final cartState = _mapJsonToCartState(draft.rawData);

    // Confirm if current cart is not empty
    final currentCart = ref.read(cartNotifierProvider);
    if (currentCart.items.isNotEmpty) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text("Reprendre la commande ?"),
          content: const Text(
            "Votre panier actuel sera remplacé par cette commande en brouillon.",
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text("Annuler"),
            ),
            ElevatedButton(
              onPressed: () {
                ref.read(cartNotifierProvider.notifier).restoreCart(cartState);
                ref.read(draftsNotifierProvider.notifier).removeDraft(draft.id);
                Navigator.pop(ctx);
                context.go('/');
              },
              child: const Text("Confirmer"),
            ),
          ],
        ),
      );
    } else {
      ref.read(cartNotifierProvider.notifier).restoreCart(cartState);
      ref.read(draftsNotifierProvider.notifier).removeDraft(draft.id);
      context.go('/');
    }
  }

  CartState _mapJsonToCartState(Map<String, dynamic> json) {
    final List<dynamic> itemsJson = json['items'] ?? [];
    final Map<String, CartItem> items = {};

    for (var i in itemsJson) {
      final productJson = i['product'];
      if (productJson == null) continue;

      final product = Product.fromJson(
        productJson,
      ); // Ensure Product.fromJson exists
      final productId = product.id;

      items[productId] = CartItem(
        product: product,
        quantity: int.tryParse(i['quantity'].toString()) ?? 1,
        unitPriceUsd: double.tryParse(i['unitPrice'].toString()) ?? 0.0,
        unitPriceCdf: double.tryParse(i['unitPriceCdf'].toString()) ?? 0.0,
      );
    }

    return CartState(
      items: items,
      activeDraftId: json['id'],
      // Note: Client mapping could be added here if needed
    );
  }
}
