import 'package:dio/dio.dart';
import 'package:mellia_pos_mobile/core/api/api_provider.dart';
import 'package:mellia_pos_mobile/core/constants/api_constants.dart';
import 'package:mellia_pos_mobile/features/cart/cart_provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'sales_repository.g.dart';

class SalesRepository {
  final Dio _dio;

  SalesRepository(this._dio);

  Future<void> createSale({
    required List<CartItem> items,
    required String paymentMethod, // CASH, CARD, etc.
    String? clientId,
    String orderType = "DINE_IN", // DINE_IN, TAKEAWAY
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
        "status": status,
      };

      // Usually POST to /api/sales, based on analysis the route file was likely src/app/api/sales/route.ts
      await _dio.post("/api/sales", data: payload);
    } catch (e) {
      throw Exception("Echec de la vente: ${e.toString()}");
    }
  }

  Future<List<dynamic>> getTransactions({String status = "COMPLETED"}) async {
    try {
      final res = await _dio.get(
        ApiConstants.transactions,
        queryParameters: {'status': status, 'limit': 20},
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
