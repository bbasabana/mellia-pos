import 'package:freezed_annotation/freezed_annotation.dart';

part 'product_model.freezed.dart';
part 'product_model.g.dart';

double toDouble(dynamic value) {
  if (value == null) return 0.0;
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0.0;
  return 0.0;
}

@freezed
abstract class Product with _$Product {
  const factory Product({
    required String id,
    required String name,
    required String type, // BEVERAGE, FOOD, etc.
    String? imageUrl,
    String? description,

    // Category (can be null if not set)
    String? beverageCategory,
    String? foodCategory,

    // Sizes & Units
    @Default('STANDARD') String size,
    required String saleUnit, // BOTTLE, PLATE...
    // Status
    @Default(true) bool active,
    @Default(true) bool vendable,

    // Virtual Fields (computed by API usually, or frontend logic)
    // The API /api/products returns `prices` array. We will map it.
    @Default([]) List<ProductPrice> prices,

    // Flattened price for Grid (optional, helper)
    @JsonKey(fromJson: toDouble) double? priceUsd,
    @JsonKey(fromJson: toDouble) double? priceCdf,

    // Stock (from API /api/products/stock or embedded)
    // If API returns stockItems
    @Default([]) List<StockItem> stockItems,
  }) = _Product;

  const Product._();

  double get totalStock =>
      stockItems.fold(0.0, (sum, item) => sum + item.quantity);
  bool get isOutOfStock => totalStock <= 0;

  factory Product.fromJson(Map<String, dynamic> json) =>
      _$ProductFromJson(json);
}

@freezed
abstract class ProductPrice with _$ProductPrice {
  const factory ProductPrice({
    required String id,
    required String spaceId,
    @JsonKey(fromJson: toDouble) required double priceUsd,
    @JsonKey(fromJson: toDouble) required double priceCdf,
    @Default('BOTTLE') String forUnit,
  }) = _ProductPrice;

  factory ProductPrice.fromJson(Map<String, dynamic> json) =>
      _$ProductPriceFromJson(json);
}

@freezed
abstract class StockItem with _$StockItem {
  const factory StockItem({
    required String location,
    @JsonKey(fromJson: toDouble) required double quantity,
  }) = _StockItem;

  factory StockItem.fromJson(Map<String, dynamic> json) =>
      _$StockItemFromJson(json);
}
