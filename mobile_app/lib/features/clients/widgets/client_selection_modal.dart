import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mellia_pos_mobile/core/theme/app_theme.dart';
import 'package:mellia_pos_mobile/features/clients/data/client_repository.dart';
import 'package:mellia_pos_mobile/shared/widgets/motion.dart';

/// Picks the client of the order: live search by name or phone, and when the client is not
/// in the list yet, creates it on the spot (name + phone) and selects it.
class ClientSelectionModal extends ConsumerStatefulWidget {
  const ClientSelectionModal({super.key});

  @override
  ConsumerState<ClientSelectionModal> createState() =>
      _ClientSelectionModalState();
}

class _ClientSelectionModalState extends ConsumerState<ClientSelectionModal> {
  final _searchController = TextEditingController();
  Timer? _debounce;
  String _query = "";

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onChanged(String v) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      if (mounted) setState(() => _query = v.trim());
    });
  }

  Future<void> _createClient() async {
    final typed = _searchController.text.trim();
    final looksLikePhone = RegExp(r'^[+0-9 ]{6,}$').hasMatch(typed);
    final name = TextEditingController(text: looksLikePhone ? '' : typed);
    final phone = TextEditingController(text: looksLikePhone ? typed : '');
    String? error;
    bool saving = false;

    final created = await showSoftDialog(
      context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => AlertDialog(
          title: const Text("Nouveau client"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: name,
                autofocus: name.text.isEmpty,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  hintText: "Nom du client",
                  prefixIcon: Icon(Icons.person_outline_rounded),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phone,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  hintText: "Téléphone",
                  prefixIcon: Icon(Icons.phone_outlined),
                ),
              ),
              if (error != null) ...[
                const SizedBox(height: 10),
                Text(
                  error!,
                  style: const TextStyle(color: AppTheme.error, fontSize: 13),
                ),
              ],
            ],
          ),
          actions: [
            TextButton(
              onPressed: saving ? null : () => Navigator.pop(ctx),
              child: const Text("Annuler"),
            ),
            ElevatedButton(
              onPressed: saving
                  ? null
                  : () async {
                      if (name.text.trim().isEmpty ||
                          phone.text.trim().isEmpty) {
                        setLocal(() => error = "Nom et téléphone requis.");
                        return;
                      }
                      setLocal(() {
                        saving = true;
                        error = null;
                      });
                      try {
                        final repo = await ref.read(
                          clientRepositoryProvider.future,
                        );
                        final client = await repo.createClient(
                          name.text.trim(),
                          phone.text.trim(),
                        );
                        if (ctx.mounted) Navigator.pop(ctx, client);
                      } catch (e) {
                        setLocal(() {
                          saving = false;
                          error = e.toString().replaceFirst('Exception: ', '');
                        });
                      }
                    },
              child: Text(saving ? "…" : "Créer"),
            ),
          ],
        ),
      ),
    );

    if (created != null && mounted) {
      ref.invalidate(clientsProvider);
      context.pop(created); // select the new client right away
    }
  }

  @override
  Widget build(BuildContext context) {
    final clientsAsync = ref.watch(clientsProvider(query: _query));

    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      padding: EdgeInsets.fromLTRB(
        20,
        10,
        20,
        16 + MediaQuery.of(context).viewInsets.bottom,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
      ),
      child: Column(
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
          Row(
            children: [
              const Expanded(
                child: Text(
                  "Client",
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.3,
                  ),
                ),
              ),
              TextButton.icon(
                onPressed: _createClient,
                icon: const Icon(Icons.person_add_alt_1_rounded, size: 18),
                label: const Text("Nouveau"),
              ),
            ],
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _searchController,
            onChanged: _onChanged,
            autofocus: true,
            textInputAction: TextInputAction.search,
            onSubmitted: (v) => setState(() => _query = v.trim()),
            decoration: const InputDecoration(
              hintText: "Nom ou téléphone",
              prefixIcon: Icon(Icons.search_rounded, color: AppTheme.subtle),
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: clientsAsync.when(
              data: (clients) {
                if (clients.isEmpty) {
                  return Center(
                    child: FadeSlideIn(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.person_search_rounded,
                            size: 40,
                            color: AppTheme.subtle,
                          ),
                          const SizedBox(height: 10),
                          Text(
                            _query.isEmpty
                                ? "Aucun client enregistré"
                                : "« $_query » introuvable",
                            style: const TextStyle(
                              color: AppTheme.muted,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 14),
                          ElevatedButton.icon(
                            onPressed: _createClient,
                            icon: const Icon(
                              Icons.person_add_alt_1_rounded,
                              size: 18,
                            ),
                            label: const Text("Créer ce client"),
                          ),
                        ],
                      ),
                    ),
                  );
                }
                return ListView.separated(
                  itemCount: clients.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final client = clients[index];
                    return FadeSlideIn(
                      index: index,
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 4,
                        ),
                        leading: CircleAvatar(
                          backgroundColor: AppTheme.cyan.withValues(
                            alpha: 0.15,
                          ),
                          child: Text(
                            client.name.isNotEmpty
                                ? client.name[0].toUpperCase()
                                : '?',
                            style: const TextStyle(
                              color: AppTheme.cyanDark,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        title: Text(
                          client.name,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        subtitle: Text(
                          "${client.phone ?? 'Pas de téléphone'} · ${client.points} pts",
                        ),
                        trailing: const Icon(
                          Icons.chevron_right_rounded,
                          color: AppTheme.subtle,
                        ),
                        onTap: () => context.pop(client),
                      ),
                    );
                  },
                );
              },
              error: (err, stack) => Center(child: Text("Erreur : $err")),
              loading: () => const Center(
                child: CircularProgressIndicator(strokeWidth: 2.4),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
