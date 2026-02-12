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

    return productsAsync.when(
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
      if (!p.vendable) {
        return false; // Ensure non-vendable items are never shown in POS
      }
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
          child: LayoutBuilder(
            builder: (context, constraints) {
              final crossAxisCount = constraints.maxWidth > 1000
                  ? 5
                  : constraints.maxWidth > 700
                  ? 4
                  : constraints.maxWidth > 400
                  ? 3
                  : 2;

              return RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(productsProvider);
                  await ref.read(productsProvider.future);
                },
                child: GridView.builder(
                  padding: const EdgeInsets.all(12),
                  physics: const AlwaysScrollableScrollPhysics(),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: crossAxisCount,
                    childAspectRatio: 0.8,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final product = filtered[index];
                    return _ProductCard(product: product);
                  },
                ),
              );
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
    final stockQty = product.totalStock;
    final isOutOfStock = product.isOutOfStock && product.type == 'BEVERAGE';

    return Container(
      decoration: BoxDecoration(
        color: isOutOfStock ? Colors.grey[50] : Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isOutOfStock
              ? null
              : () {
                  ref.read(cartNotifierProvider.notifier).addItem(product);
                },
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryBlue.withOpacity(0.05),
                  ),
                  child: Center(
                    child: Icon(
                      product.type == 'BEVERAGE'
                          ? Icons.local_bar_rounded
                          : Icons.restaurant_rounded,
                      color: AppTheme.primaryBlue.withOpacity(0.5),
                      size: 40,
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.name,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                        color: Color(0xFF1E293B),
                        height: 1.2,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        if (product.prices.isNotEmpty)
                          Text(
                            "\$${product.prices.first.priceUsd.toStringAsFixed(2)}",
                            style: const TextStyle(
                              color: AppTheme.primaryBlue,
                              fontWeight: FontWeight.w900,
                              fontSize: 15,
                            ),
                          )
                        else
                          const Text(
                            "---",
                            style: TextStyle(color: Colors.grey, fontSize: 12),
                          ),
                        Flexible(
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: isOutOfStock
                                  ? Colors.red[50]
                                  : Colors.green[50],
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              isOutOfStock ? "EP" : "${stockQty.toInt()}",
                              style: TextStyle(
                                color: isOutOfStock ? Colors.red : Colors.green,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
