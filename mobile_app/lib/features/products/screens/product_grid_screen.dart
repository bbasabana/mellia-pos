import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:mellia_pos_mobile/core/theme/app_theme.dart';
import 'package:mellia_pos_mobile/features/cart/cart_provider.dart';
import 'package:mellia_pos_mobile/features/products/data/product_model.dart';
import 'package:mellia_pos_mobile/features/products/data/product_repository.dart';
import 'package:mellia_pos_mobile/features/products/widgets/price_choice_sheet.dart';
import 'package:mellia_pos_mobile/shared/widgets/motion.dart';

final _fc = NumberFormat.decimalPattern('fr');

class ProductGridScreen extends ConsumerWidget {
  const ProductGridScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(productsProvider);

    return AnimatedSwitcher(
      duration: AppTheme.medium,
      switchInCurve: AppTheme.curve,
      child: productsAsync.when(
        data: (products) => _ProductGridContent(
          key: const ValueKey('grid'),
          allProducts: products,
        ),
        error: (err, stack) => Center(
          key: const ValueKey('error'),
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: FadeSlideIn(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF1F1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Icon(
                      Icons.wifi_off_rounded,
                      size: 30,
                      color: AppTheme.error,
                    ),
                  ),
                  const SizedBox(height: 18),
                  const Text(
                    'Impossible de charger les produits',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    err.toString().replaceFirst('Exception: ', ''),
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: AppTheme.muted, fontSize: 13),
                  ),
                  const SizedBox(height: 22),
                  ElevatedButton.icon(
                    onPressed: () => ref.invalidate(productsProvider),
                    icon: const Icon(Icons.refresh_rounded, size: 18),
                    label: const Text('Réessayer'),
                  ),
                ],
              ),
            ),
          ),
        ),
        loading: () => const Center(
          key: ValueKey('loading'),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(strokeWidth: 2.6),
              ),
              SizedBox(height: 14),
              Text(
                'Chargement des produits…',
                style: TextStyle(color: AppTheme.muted),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProductGridContent extends ConsumerStatefulWidget {
  final List<Product> allProducts;
  const _ProductGridContent({super.key, required this.allProducts});

  @override
  ConsumerState<_ProductGridContent> createState() =>
      _ProductGridContentState();
}

class _ProductGridContentState extends ConsumerState<_ProductGridContent> {
  String selectedType = 'ALL';
  String query = '';
  final _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final q = query.trim().toLowerCase();
    final filtered = widget.allProducts.where((p) {
      if (!p.active || !p.vendable)
        return false; // non-vendable items never appear in the POS
      if (q.isNotEmpty && !p.name.toLowerCase().contains(q)) return false;
      if (selectedType == 'BOISSON') return p.type == 'BEVERAGE';
      if (selectedType == 'NOURRITURE') return p.type == 'FOOD';
      return true;
    }).toList();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 6, 14, 10),
          child: Column(
            children: [
              // Search
              Container(
                height: 46,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.line),
                ),
                child: Row(
                  children: [
                    const SizedBox(width: 12),
                    const Icon(
                      Icons.search_rounded,
                      color: AppTheme.subtle,
                      size: 21,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _search,
                        onChanged: (v) => setState(() => query = v),
                        textInputAction: TextInputAction.search,
                        style: const TextStyle(fontSize: 15),
                        decoration: const InputDecoration(
                          hintText: 'Rechercher un produit',
                          isCollapsed: true,
                          filled: false,
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                        ),
                      ),
                    ),
                    AnimatedOpacity(
                      opacity: query.isEmpty ? 0 : 1,
                      duration: AppTheme.fast,
                      child: IconButton(
                        icon: const Icon(
                          Icons.cancel_rounded,
                          color: AppTheme.subtle,
                          size: 19,
                        ),
                        onPressed: query.isEmpty
                            ? null
                            : () {
                                _search.clear();
                                setState(() => query = '');
                              },
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              _Segmented(
                value: selectedType,
                options: const {
                  'ALL': 'Tout',
                  'BOISSON': 'Boissons',
                  'NOURRITURE': 'Plats',
                },
                onChanged: (v) => setState(() => selectedType = v),
              ),
            ],
          ),
        ),
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

              if (filtered.isEmpty) {
                return const Center(
                  child: FadeSlideIn(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.search_off_rounded,
                          size: 40,
                          color: AppTheme.subtle,
                        ),
                        SizedBox(height: 10),
                        Text(
                          'Aucun produit',
                          style: TextStyle(
                            color: AppTheme.muted,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }

              return RefreshIndicator(
                color: AppTheme.cyanDark,
                onRefresh: () async {
                  ref.invalidate(productsProvider);
                  await ref.read(productsProvider.future);
                },
                child: GridView.builder(
                  key: ValueKey('$selectedType|$q'),
                  padding: const EdgeInsets.fromLTRB(14, 2, 14, 100),
                  physics: const AlwaysScrollableScrollPhysics(
                    parent: BouncingScrollPhysics(),
                  ),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: crossAxisCount,
                    childAspectRatio: 0.82,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) => FadeSlideIn(
                    index: index,
                    child: _ProductCard(product: filtered[index]),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

/// macOS-style segmented control: the white thumb glides to the selected option.
class _Segmented extends StatelessWidget {
  final String value;
  final Map<String, String> options;
  final ValueChanged<String> onChanged;

  const _Segmented({
    required this.value,
    required this.options,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final keys = options.keys.toList();
    final index = keys.indexOf(value).clamp(0, keys.length - 1);
    return Container(
      height: 40,
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: const Color(0xFFE3E8EE),
        borderRadius: BorderRadius.circular(12),
      ),
      child: LayoutBuilder(
        builder: (context, c) {
          final w = c.maxWidth / keys.length;
          return Stack(
            children: [
              AnimatedPositioned(
                duration: AppTheme.medium,
                curve: AppTheme.curve,
                left: w * index,
                top: 0,
                bottom: 0,
                width: w,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(9),
                    boxShadow: AppTheme.softShadow,
                  ),
                ),
              ),
              Row(
                children: [
                  for (final k in keys)
                    Expanded(
                      child: GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: () => onChanged(k),
                        child: Center(
                          child: AnimatedDefaultTextStyle(
                            duration: AppTheme.fast,
                            style: TextStyle(
                              fontFamily: DefaultTextStyle.of(
                                context,
                              ).style.fontFamily,
                              fontSize: 13.5,
                              fontWeight: k == value
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                              color: k == value ? AppTheme.ink : AppTheme.muted,
                            ),
                            child: Text(options[k]!),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }
}

class _ProductCard extends ConsumerWidget {
  final Product product;
  const _ProductCard({required this.product});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stockQty = product.totalStock;
    final isDrink = product.type == 'BEVERAGE';
    final isOutOfStock = product.isOutOfStock && isDrink;
    final accent = isDrink ? AppTheme.cyanDark : AppTheme.brandOrange;
    final tint = isDrink ? const Color(0xFFECFCFF) : const Color(0xFFFFF4ED);
    final sorted = [...product.prices]
      ..sort((a, b) => a.priceCdf.compareTo(b.priceCdf));
    final price = sorted.isNotEmpty ? sorted.first : null;
    final choices = sorted.length;

    return Pressable(
      onTap: isOutOfStock ? null : () => _add(context, ref),
      child: AnimatedOpacity(
        duration: AppTheme.fast,
        opacity: isOutOfStock ? 0.55 : 1,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppTheme.line.withValues(alpha: 0.7)),
            boxShadow: AppTheme.softShadow,
          ),
          padding: const EdgeInsets.all(8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Stack(
                  children: [
                    Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: tint,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Center(
                        child: Icon(
                          isDrink
                              ? Icons.local_bar_rounded
                              : Icons.restaurant_rounded,
                          color: accent.withValues(alpha: 0.75),
                          size: 36,
                        ),
                      ),
                    ),
                    if (isDrink)
                      Positioned(
                        top: 6,
                        right: 6,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 7,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: isOutOfStock
                                ? const Color(0xFFFFE4E4)
                                : Colors.white.withValues(alpha: 0.9),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            isOutOfStock
                                ? 'Épuisé'
                                : '${stockQty.toInt()} en stock',
                            style: TextStyle(
                              color: isOutOfStock
                                  ? AppTheme.error
                                  : AppTheme.muted,
                              fontSize: 9.5,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(4, 10, 4, 2),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.name,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13.5,
                        height: 1.2,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    if (price != null)
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Flexible(
                            child: Text(
                              price.priceCdf > 0
                                  ? '${_fc.format(price.priceCdf.round())} FC'
                                  : '',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 14,
                                color: AppTheme.ink,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            choices > 1
                                ? '$choices prix'
                                : '\$${price.priceUsd.toStringAsFixed(2)}',
                            style: TextStyle(
                              color: choices > 1
                                  ? AppTheme.brandOrange
                                  : AppTheme.muted,
                              fontSize: 11.5,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      )
                    else
                      const Text(
                        'Prix non défini',
                        style: TextStyle(color: AppTheme.subtle, fontSize: 12),
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

  /// One price: straight into the cart. Several (Terrasse, VIP...): the cashier picks one.
  Future<void> _add(BuildContext context, WidgetRef ref) async {
    final cart = ref.read(cartNotifierProvider.notifier);
    if (product.prices.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("${product.name} n'a pas de prix défini.")),
      );
      return;
    }
    if (product.prices.length == 1) {
      cart.addItem(product, price: product.prices.first);
      return;
    }
    final picked = await showPriceChoice(context, product);
    if (picked != null) cart.addItem(product, price: picked);
  }
}
