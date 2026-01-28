import 'package:dio/dio.dart';
import 'package:mellia_pos_mobile/core/api/api_provider.dart';
import 'package:mellia_pos_mobile/core/constants/api_constants.dart';
import 'package:mellia_pos_mobile/features/cart/cart_provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'sales_repository.g.dart';

class SalesRepository {
  final Dio _dio;

  SalesRepository(this._dio);

  Future<Map<String, dynamic>> createSale({
    required List<CartItem> items,
    required String paymentMethod, // CASH, CARD, etc.
    String? clientId,
    String orderType = "DINE_IN", // DINE_IN, TAKEAWAY, DELIVERY
    DeliveryInfo? deliveryInfo,
    String status = "COMPLETED", // DRAFT, COMPLETED
  }) async {
    try {
      final payload = {
        "items": items
            .map(
              (item) => {
                "productId": item.product.id,
                "quantity": item.quantity,
                "price": item.unitPriceUsd,
                "priceCdf": item.unitPriceCdf,
                "saleUnit": item.product.saleUnit,
              },
            )
            .toList(),
        "clientId": clientId,
        "paymentMethod": paymentMethod,
        "orderType": orderType,
        "deliveryInfo": deliveryInfo?.toJson(),
        "status": status,
      };

      final res = await _dio.post("/api/sales", data: payload);
      return res.data;
    } catch (e) {
      throw Exception("Echec de la vente: ${e.toString()}");
    }
  }

  Future<Map<String, dynamic>> updateSale({
    required String id,
    required List<CartItem> items,
    String? status, // "COMPLETED" to finalize
    String? paymentMethod,
    String? paymentReference,
    String? orderType,
    DeliveryInfo? deliveryInfo,
  }) async {
    try {
      final payload = {
        "items": items
            .map(
              (item) => {
                "productId": item.product.id,
                "quantity": item.quantity,
                "unitPrice": item.unitPriceUsd,
                "unitPriceCdf": item.unitPriceCdf,
              },
            )
            .toList(),
        if (status != null) "status": status,
        if (paymentMethod != null) "paymentMethod": paymentMethod,
        if (paymentReference != null) "paymentReference": paymentReference,
        if (orderType != null) "orderType": orderType,
        if (deliveryInfo != null) "deliveryInfo": deliveryInfo.toJson(),
      };

      final res = await _dio.put("/api/transactions?id=$id", data: payload);
      return res.data;
    } catch (e) {
      throw Exception("Erreur de mise à jour: ${e.toString()}");
    }
  }

  Future<List<dynamic>> getTransactions({
    String status = "COMPLETED",
    String? startDate,
    String? endDate,
  }) async {
    try {
      final res = await _dio.get(
        ApiConstants.transactions,
        queryParameters: {
          'status': status,
          'limit': 50,
          if (startDate != null) 'startDate': startDate,
          if (endDate != null) 'endDate': endDate,
        },
      );
      return res.data['data'] ?? [];
    } catch (e) {
      return [];
    }
  }
}

@riverpod
Future<SalesRepository> salesRepository(SalesRepositoryRef ref) async {
  final dio = await ref.watch(dioProvider.future);
  return SalesRepository(dio);
}

final transactionsProvider =
    FutureProvider.family<List<dynamic>, Map<String, String>>((
      ref,
      params,
    ) async {
      final repo = await ref.watch(salesRepositoryProvider.future);
      return repo.getTransactions(
        status: params['status'] ?? 'COMPLETED',
        startDate: params['startDate'],
        endDate: params['endDate'],
      );
    });
