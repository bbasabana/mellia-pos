import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:mellia_pos_mobile/core/theme/app_theme.dart';
import 'package:mellia_pos_mobile/features/products/data/product_model.dart';
import 'package:mellia_pos_mobile/shared/widgets/motion.dart';

final _fcFormat = NumberFormat.decimalPattern('fr');

const _unitLabels = {
  'BOTTLE': 'Bouteille',
  'GLASS': 'Verre',
  'MEASURE': 'Mesure',
  'PLATE': 'Plat',
  'HALF_PLATE': 'Demi-plat',
  'PORTION': 'Portion',
};

/// Accent of a sale space, so Terrasse and VIP are told apart at a glance.
Color spaceColor(String? name) {
  final n = (name ?? '').toLowerCase();
  if (n.contains('vip')) return AppTheme.brandOrange;
  if (n.contains('terrasse')) return AppTheme.cyanDark;
  return AppTheme.limeDark;
}

/// Small tag with the sale space of a cart line ("VIP", "Terrasse").
class SpaceBadge extends StatelessWidget {
  final String name;
  const SpaceBadge(this.name, {super.key});

  @override
  Widget build(BuildContext context) {
    final color = spaceColor(name);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        name.toUpperCase(),
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

/// Asks where the product is sold (Terrasse, VIP...) when it has several prices, like the web
/// till. Returns the chosen price, or null when the cashier cancels.
Future<ProductPrice?> showPriceChoice(BuildContext context, Product product) {
  final prices = [...product.prices]
    ..sort((a, b) => a.priceCdf.compareTo(b.priceCdf));
  return showModalBottomSheet<ProductPrice>(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (ctx) => _PriceChoiceSheet(product: product, prices: prices),
  );
}

class _PriceChoiceSheet extends StatelessWidget {
  final Product product;
  final List<ProductPrice> prices;
  const _PriceChoiceSheet({required this.product, required this.prices});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
      ),
      padding: EdgeInsets.fromLTRB(
        20,
        10,
        20,
        16 + MediaQuery.of(context).viewPadding.bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 38,
              height: 5,
              decoration: BoxDecoration(
                color: AppTheme.line,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ),
          const SizedBox(height: 14),
          const Text(
            "Choisir le prix",
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            product.name,
            style: const TextStyle(color: AppTheme.muted, fontSize: 14),
          ),
          const SizedBox(height: 16),
          for (var i = 0; i < prices.length; i++) ...[
            if (i > 0) const SizedBox(height: 10),
            FadeSlideIn(
              delay: Duration(milliseconds: 40 * i),
              child: _PriceTile(
                price: prices[i],
                unit: prices[i].forUnit != product.saleUnit
                    ? _unitLabels[prices[i].forUnit] ?? prices[i].forUnit
                    : null,
                onTap: () {
                  HapticFeedback.selectionClick();
                  Navigator.of(context).pop(prices[i]);
                },
              ),
            ),
          ],
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text("Annuler"),
          ),
        ],
      ),
    );
  }
}

class _PriceTile extends StatelessWidget {
  final ProductPrice price;
  final String? unit;
  final VoidCallback onTap;
  const _PriceTile({
    required this.price,
    required this.unit,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = spaceColor(price.spaceName);
    final name = price.spaceName ?? 'Standard';
    return Pressable(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.35), width: 1.5),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
              child: Icon(
                name.toLowerCase().contains('vip')
                    ? Icons.star_rounded
                    : Icons.deck_rounded,
                color: Colors.white,
                size: 22,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name.toUpperCase(),
                    style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                      letterSpacing: 1,
                    ),
                  ),
                  if (unit != null)
                    Text(
                      unit!,
                      style: const TextStyle(
                        color: AppTheme.muted,
                        fontSize: 12,
                      ),
                    ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${_fcFormat.format(price.priceCdf.round())} FC',
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.ink,
                    letterSpacing: -0.5,
                  ),
                ),
                Text(
                  '\$${price.priceUsd.toStringAsFixed(2)}',
                  style: const TextStyle(color: AppTheme.muted, fontSize: 12.5),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
