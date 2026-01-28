import 'package:freezed_annotation/freezed_annotation.dart';

part 'kitchen_model.freezed.dart';
part 'kitchen_model.g.dart';

@freezed
abstract class KitchenOrder with _$KitchenOrder {
  const factory KitchenOrder({
    required String id,
    required String orderType,
    required String status, // PENDING, IN_PREPARATION, READY, DELIVERED
    required DateTime createdAt,
    required int priority,
    required KitchenSale sale,
  }) = _KitchenOrder;

  factory KitchenOrder.fromJson(Map<String, dynamic> json) =>
      _$KitchenOrderFromJson(json);
}

@freezed
abstract class KitchenSale with _$KitchenSale {
  const factory KitchenSale({
    required String ticketNum,
    required List<KitchenItem> items,
    KitchenClient? client,
  }) = _KitchenSale;

  factory KitchenSale.fromJson(Map<String, dynamic> json) =>
      _$KitchenSaleFromJson(json);
}

@freezed
abstract class KitchenItem with _$KitchenItem {
  const factory KitchenItem({
    required String id,
    required KitchenProduct product,
    required double quantity,
  }) = _KitchenItem;

  factory KitchenItem.fromJson(Map<String, dynamic> json) =>
      _$KitchenItemFromJson(json);
}

@freezed
abstract class KitchenProduct with _$KitchenProduct {
  const factory KitchenProduct({required String name, required String type}) =
      _KitchenProduct;

  factory KitchenProduct.fromJson(Map<String, dynamic> json) =>
      _$KitchenProductFromJson(json);
}

@freezed
abstract class KitchenClient with _$KitchenClient {
  const factory KitchenClient({required String name}) = _KitchenClient;

  factory KitchenClient.fromJson(Map<String, dynamic> json) =>
      _$KitchenClientFromJson(json);
}
