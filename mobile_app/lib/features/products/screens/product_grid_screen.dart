import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mellia_pos_mobile/core/theme/app_theme.dart';
import 'package:mellia_pos_mobile/features/cart/cart_provider.dart';
import 'package:mellia_pos_mobile/features/products/data/product_model.dart';
import 'package:mellia_pos_mobile/features/products/data/product_repository.dart';

class ProductGridScreen extends ConsumerWidget {
  const ProductGridScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(productsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Caisse")),
      body: productsAsync.when(
        data: (products) => _ProductGridContent(allProducts: products),
        error: (err, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 64, color: Colors.red),
                const SizedBox(height: 16),
                const Text(
                  "Oups ! Une erreur est survenue lors du chargement des produits.",
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  err.toString(),
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey[600]),
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () => ref.invalidate(productsProvider),
                  icon: const Icon(Icons.refresh),
                  label: const Text("Réessayer"),
                ),
              ],
            ),
          ),
        ),
        loading: () => const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text("Chargement des produits..."),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProductGridContent extends ConsumerStatefulWidget {
  final List<Product> allProducts;
  const _ProductGridContent({required this.allProducts});

  @override
  ConsumerState<_ProductGridContent> createState() =>
      _ProductGridContentState();
}

class _ProductGridContentState extends ConsumerState<_ProductGridContent> {
  String selectedType = 'ALL';

  @override
  Widget build(BuildContext context) {
    // Filter Logic
    final filtered = widget.allProducts.where((p) {
      if (!p.active) return false;
      if (selectedType == 'ALL') return true;
      if (selectedType == 'BOISSON') return p.type == 'BEVERAGE';
      if (selectedType == 'NOURRITURE') return p.type == 'FOOD';
      return true;
    }).toList();

    return Column(
      children: [
        // Categories Tabs
        SizedBox(
          height: 50,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.all(8),
            children: [
              _CategoryChip(
                label: "Tout",
                isSelected: selectedType == 'ALL',
                onTap: () => setState(() => selectedType = 'ALL'),
              ),
              const SizedBox(width: 8),
              _CategoryChip(
                label: "Boissons",
                isSelected: selectedType == 'BOISSON',
                onTap: () => setState(() => selectedType = 'BOISSON'),
              ),
              const SizedBox(width: 8),
              _CategoryChip(
                label: "Plats",
                isSelected: selectedType == 'NOURRITURE',
                onTap: () => setState(() => selectedType = 'NOURRITURE'),
              ),
            ],
          ),
        ),

        // Grid
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.all(8),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3, // Adapt for Tablet
              childAspectRatio: 0.8,
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
            ),
            itemCount: filtered.length,
            itemBuilder: (context, index) {
              final product = filtered[index];
              return _ProductCard(product: product);
            },
          ),
        ),
      ],
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _CategoryChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => onTap(),
      selectedColor: AppTheme.orange500,
      labelStyle: TextStyle(color: isSelected ? Colors.white : Colors.black),
    );
  }
}

class _ProductCard extends ConsumerWidget {
  final Product product;
  const _ProductCard({required this.product});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Calculate stock display logic
    // For MVP: if stockItems is empty, assume available? Or strict?
    // Usually standard POS shows inventory.
    final stockQty = product.stockItems.fold(
      0.0,
      (sum, item) => sum + item.quantity,
    );
    final isOutOfStock =
        stockQty <= 0 &&
        product.type == 'BEVERAGE'; // Food often tracked differently

    return GestureDetector(
      onTap: isOutOfStock
          ? null
          : () {
              ref.read(cartNotifierProvider.notifier).addItem(product);
            },
      child: Card(
        elevation: 2,
        color: isOutOfStock ? Colors.grey[200] : Colors.white,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: Container(
                color: const Color(0xFFF1F5F9), // Slate-100 placeholder
                child: Icon(
                  product.type == 'BEVERAGE'
                      ? Icons.local_bar
                      : Icons.restaurant,
                  color: Colors.grey[400],
                  size: 32,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  // Price display
                  if ((product.prices.isNotEmpty))
                    Text(
                      "\$${product.prices.first.priceUsd.toStringAsFixed(2)}",
                      style: const TextStyle(
                        color: AppTheme.primaryBlue,
                        fontWeight: FontWeight.bold,
                      ),
                    )
                  else
                    const Text(
                      "N/A",
                      style: TextStyle(color: Colors.grey, fontSize: 10),
                    ),

                  if (isOutOfStock)
                    const Text(
                      "Epuisé",
                      style: TextStyle(
                        color: Colors.red,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    )
                  else
                    Text(
                      "$stockQty en stock",
                      style: const TextStyle(color: Colors.green, fontSize: 10),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
