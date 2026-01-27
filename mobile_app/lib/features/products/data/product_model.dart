import 'package:freezed_annotation/freezed_annotation.dart';

part 'product_model.freezed.dart';
part 'product_model.g.dart';

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
    double? priceUsd,
    double? priceCdf,

    // Stock (from API /api/products/stock or embedded)
    // If API returns stockItems
    @Default([]) List<StockItem> stockItems,
  }) = _Product;

  factory Product.fromJson(Map<String, dynamic> json) =>
      _$ProductFromJson(json);
}

@freezed
abstract class ProductPrice with _$ProductPrice {
  const factory ProductPrice({
    required String id,
    required String spaceId,
    required double priceUsd,
    required double priceCdf,
    @Default('BOTTLE') String forUnit,
  }) = _ProductPrice;

  factory ProductPrice.fromJson(Map<String, dynamic> json) =>
      _$ProductPriceFromJson(json);
}

@freezed
abstract class StockItem with _$StockItem {
  const factory StockItem({
    required String location,
    required double quantity,
  }) = _StockItem;

  factory StockItem.fromJson(Map<String, dynamic> json) =>
      _$StockItemFromJson(json);
}
