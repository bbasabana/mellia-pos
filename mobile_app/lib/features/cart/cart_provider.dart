import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:mellia_pos_mobile/features/products/data/product_model.dart';
import 'package:mellia_pos_mobile/features/clients/data/client_model.dart';
import 'package:mellia_pos_mobile/features/sales/data/sales_repository.dart';

part 'cart_provider.freezed.dart';
part 'cart_provider.g.dart';

@freezed
abstract class CartItem with _$CartItem {
  const factory CartItem({
    required Product product,
    required int quantity,
    required double unitPriceUsd,
    required double unitPriceCdf,
  }) = _CartItem;

  // Computed properties helpers
  const CartItem._();
  double get totalUsd => unitPriceUsd * quantity;
  double get totalCdf => unitPriceCdf * quantity;
}

@freezed
abstract class DeliveryInfo with _$DeliveryInfo {
  const factory DeliveryInfo({
    required String address,
    required String phone,
    String? instructions,
  }) = _DeliveryInfo;

  factory DeliveryInfo.fromJson(Map<String, dynamic> json) =>
      _$DeliveryInfoFromJson(json);
}

@freezed
abstract class CartState with _$CartState {
  const factory CartState({
    @Default({}) Map<String, CartItem> items,
    Client? selectedClient,
    @Default(false) bool isLoading,
    String? activeDraftId,
    @Default("DINE_IN") String orderType, // DINE_IN, TAKEAWAY, DELIVERY
    DeliveryInfo? deliveryInfo,
  }) = _CartState;

  const CartState._();

  double get totalUsd =>
      items.values.fold(0, (sum, item) => sum + item.totalUsd);
  double get totalCdf =>
      items.values.fold(0, (sum, item) => sum + item.totalCdf);
  int get itemCount => items.values.fold(0, (sum, item) => sum + item.quantity);
}

@Riverpod(keepAlive: true)
class CartNotifier extends _$CartNotifier {
  @override
  CartState build() {
    return const CartState();
  }

  void setClient(Client? client) {
    state = state.copyWith(selectedClient: client);
  }

  void setOrderType(String type) {
    state = state.copyWith(orderType: type);
    if (type != 'DELIVERY') {
      state = state.copyWith(deliveryInfo: null);
    }
  }

  void setDeliveryInfo(DeliveryInfo info) {
    state = state.copyWith(deliveryInfo: info, orderType: 'DELIVERY');
  }

  void addItem(Product product) {
    // Determine price based on context (e.g. SaleSpace). For MVP we take the first price or 0.
    // Ideally we need to know the 'Selected Sale Space'.
    // For now, we pick: first price found, or 0.
    double priceUsd = 0;
    double priceCdf = 0;

    if (product.prices.isNotEmpty) {
      // Take first price
      priceUsd = product.prices.first.priceUsd;
      priceCdf = product.prices.first.priceCdf;
    } else {
      // Fallback to flattened fields if API provided them
      priceUsd = product.priceUsd ?? 0;
      priceCdf = product.priceCdf ?? 0;
    }

    state = state.copyWith(
      items: {
        ...state.items,
        product.id: CartItem(
          product: product,
          quantity: (state.items[product.id]?.quantity ?? 0) + 1,
          unitPriceUsd: priceUsd,
          unitPriceCdf: priceCdf,
        ),
      },
    );
  }

  void removeItem(String productId) {
    final currentQty = state.items[productId]?.quantity ?? 0;
    if (currentQty <= 1) {
      final newItems = Map<String, CartItem>.from(state.items);
      newItems.remove(productId);
      state = state.copyWith(items: newItems);
    } else {
      state = state.copyWith(
        items: {
          ...state.items,
          productId: state.items[productId]!.copyWith(quantity: currentQty - 1),
        },
      );
    }
  }

  void restoreCart(CartState savedState) {
    state = savedState;
  }

  Future<void> saveDraft() async {
    if (state.items.isEmpty) return;

    state = state.copyWith(isLoading: true);
    try {
      final repo = await ref.read(salesRepositoryProvider.future);

      if (state.activeDraftId != null) {
        // Update existing draft
        await repo.updateSale(
          id: state.activeDraftId!,
          items: state.items.values.toList(),
        );
      } else {
        // Create new draft
        final result = await repo.createSale(
          items: state.items.values.toList(),
          paymentMethod: "CASH", // Default for draft
          clientId: state.selectedClient?.id,
          orderType: state.orderType,
          status: "DRAFT",
        );
        state = state.copyWith(activeDraftId: result['id']);
      }
    } catch (e) {
      // Handle error (e.g. notify user)
    } finally {
      state = state.copyWith(isLoading: false);
    }
  }

  void clearCart() {
    state = const CartState();
  }
}
