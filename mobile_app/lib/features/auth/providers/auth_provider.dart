import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:mellia_pos_mobile/features/auth/data/auth_repository.dart';

part 'auth_provider.g.dart';
part 'auth_provider.freezed.dart';

@freezed
abstract class UserState with _$UserState {
  const factory UserState({
    required String? id,
    required String? name,
    required String? email,
    required String? role,
  }) = _UserState;

  factory UserState.fromJson(Map<String, dynamic> json) =>
      _$UserStateFromJson(json);
}

@Riverpod(keepAlive: true)
class AuthNotifier extends _$AuthNotifier {
  @override
  Future<UserState?> build() async {
    // Check if session exists on boot
    final repo = await ref.watch(authRepositoryProvider.future);
    try {
      final sessionData = await repo.getSession();
      if (sessionData.containsKey('user')) {
        // Map user data
        final user = sessionData['user'];
        return UserState(
          id: user['id'],
          name: user['name'],
          email: user['email'],
          role: user['role'],
        );
      }
    } catch (e) {
      // Not logged in or offline
    }
    return null;
  }

  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final repo = await ref.read(authRepositoryProvider.future);
      await repo.login(email, password);

      // We still try to get the session to see if cookies worked
      // but if it fails, we shouldn't necessarily block if we trust the custom login
      try {
        final session = await repo.getSession();
        final user = session['user'];
        final role = user['role'];

        if (role != 'CASHIER' &&
            role != 'KITCHEN' &&
            role != 'ADMIN' &&
            role != 'MANAGER') {
          await repo.logout();
          throw Exception(
            'Cet utilisateur n\'a pas les permissions pour l\'application mobile',
          );
        }
      } catch (e) {
        // If session fails, it might be a cookie issue, but the login was successful.
        // For MVP, we'll try to proceed or show a warning.
        print("Session check failed after login: $e");
      }

      // Refresh state to fetch session
      ref.invalidateSelf();
      await future; // Wait for rebuild
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> logout() async {
    state = const AsyncValue.loading();
    try {
      final repo = await ref.read(authRepositoryProvider.future);
      await repo.logout();
      state = const AsyncValue.data(null);
    } catch (e) {
      // Force logout anyway
      state = const AsyncValue.data(null);
    }
  }
}
