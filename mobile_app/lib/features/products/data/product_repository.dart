import 'package:dio/dio.dart';
import 'package:mellia_pos_mobile/core/api/api_provider.dart';
import 'package:mellia_pos_mobile/core/constants/api_constants.dart';
import 'package:mellia_pos_mobile/features/products/data/product_model.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'product_repository.g.dart';

class ProductRepository {
  final Dio _dio;

  ProductRepository(this._dio);

  Future<List<Product>> getProducts() async {
    try {
      final response = await _dio.get(
        ApiConstants.products,
        queryParameters: {'vendable': 'true', 'active': 'true'},
      );

      // API returns { success: true, data: [...] } or just [...]
      // Based on typical Next.js API route pattern in this project:
      final data = response.data;

      List<dynamic> list;
      if (data is Map && data.containsKey('data')) {
        list = data['data'];
      } else if (data is List) {
        list = data;
      } else {
        return [];
      }

      return list.map((e) => Product.fromJson(e)).toList();
    } catch (e) {
      throw Exception("Failed to load products: $e");
    }
  }
}

@riverpod
Future<ProductRepository> productRepository(ProductRepositoryRef ref) async {
  final dio = await ref.watch(dioProvider.future);
  return ProductRepository(dio);
}

@riverpod
Future<List<Product>> products(ProductsRef ref) async {
  final repo = await ref.watch(productRepositoryProvider.future);
  return repo.getProducts();
}
