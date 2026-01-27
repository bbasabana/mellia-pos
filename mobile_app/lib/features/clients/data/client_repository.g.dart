// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'client_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$clientRepositoryHash() => r'455477e8db73cfc09c83272cd1db0b0997a310b4';

/// See also [clientRepository].
@ProviderFor(clientRepository)
final clientRepositoryProvider =
    AutoDisposeFutureProvider<ClientRepository>.internal(
      clientRepository,
      name: r'clientRepositoryProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$clientRepositoryHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef ClientRepositoryRef = AutoDisposeFutureProviderRef<ClientRepository>;
String _$clientsHash() => r'8c444f7adde2b57f951d26c5fd0c214fb6343861';

/// Copied from Dart SDK
class _SystemHash {
  _SystemHash._();

  static int combine(int hash, int value) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + value);
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x0007ffff & hash) << 10));
    return hash ^ (hash >> 6);
  }

  static int finish(int hash) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x03ffffff & hash) << 3));
    // ignore: parameter_assignments
    hash = hash ^ (hash >> 11);
    return 0x1fffffff & (hash + ((0x00003fff & hash) << 15));
  }
}

/// See also [clients].
@ProviderFor(clients)
const clientsProvider = ClientsFamily();

/// See also [clients].
class ClientsFamily extends Family<AsyncValue<List<Client>>> {
  /// See also [clients].
  const ClientsFamily();

  /// See also [clients].
  ClientsProvider call({String query = ""}) {
    return ClientsProvider(query: query);
  }

  @override
  ClientsProvider getProviderOverride(covariant ClientsProvider provider) {
    return call(query: provider.query);
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'clientsProvider';
}

/// See also [clients].
class ClientsProvider extends AutoDisposeFutureProvider<List<Client>> {
  /// See also [clients].
  ClientsProvider({String query = ""})
    : this._internal(
        (ref) => clients(ref as ClientsRef, query: query),
        from: clientsProvider,
        name: r'clientsProvider',
        debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
            ? null
            : _$clientsHash,
        dependencies: ClientsFamily._dependencies,
        allTransitiveDependencies: ClientsFamily._allTransitiveDependencies,
        query: query,
      );

  ClientsProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.query,
  }) : super.internal();

  final String query;

  @override
  Override overrideWith(
    FutureOr<List<Client>> Function(ClientsRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: ClientsProvider._internal(
        (ref) => create(ref as ClientsRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        query: query,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<Client>> createElement() {
    return _ClientsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is ClientsProvider && other.query == query;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, query.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin ClientsRef on AutoDisposeFutureProviderRef<List<Client>> {
  /// The parameter `query` of this provider.
  String get query;
}

class _ClientsProviderElement
    extends AutoDisposeFutureProviderElement<List<Client>>
    with ClientsRef {
  _ClientsProviderElement(super.provider);

  @override
  String get query => (origin as ClientsProvider).query;
}

// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
