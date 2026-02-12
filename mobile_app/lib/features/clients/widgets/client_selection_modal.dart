import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mellia_pos_mobile/core/theme/app_theme.dart';
import 'package:mellia_pos_mobile/features/clients/data/client_repository.dart';
import 'package:mellia_pos_mobile/shared/widgets/custom_text_field.dart';

class ClientSelectionModal extends ConsumerStatefulWidget {
  const ClientSelectionModal({super.key});

  @override
  ConsumerState<ClientSelectionModal> createState() =>
      _ClientSelectionModalState();
}

class _ClientSelectionModalState extends ConsumerState<ClientSelectionModal> {
  final _searchController = TextEditingController();
  String _query = "";

  @override
  Widget build(BuildContext context) {
    final clientsAsync = ref.watch(clientsProvider(query: _query));

    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            "Sélectionner un Client",
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          CustomTextField(
            label: "",
            hint: "Rechercher par nom ou téléphone...",
            controller: _searchController,
            prefixIcon: Icons.search,
            // Simple debounce logic could be added, for MVP we trigger on submitted or changed
            // For simplicity, we just use onChanged with a small delay or ref.invalidate on submit
            // Using onChanged here directly will trigger rebuilds fast.
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {
              setState(() {
                _query = _searchController.text;
              });
            },
            child: const Text("Rechercher"),
          ),

          const SizedBox(height: 16),
          Expanded(
            child: clientsAsync.when(
              data: (clients) {
                if (clients.isEmpty) {
                  return const Center(child: Text("Aucun client trouvé"));
                }
                return ListView.builder(
                  itemCount: clients.length,
                  itemBuilder: (context, index) {
                    final client = clients[index];
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: AppTheme.primaryBlue,
                        child: Text(
                          client.name[0].toUpperCase(),
                          style: const TextStyle(color: Colors.white),
                        ),
                      ),
                      title: Text(client.name),
                      subtitle: Text(
                        "${client.phone ?? 'Pas de tél'} • ${client.points} pts",
                      ),
                      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                      onTap: () {
                        context.pop(client); // Return selected client
                      },
                    );
                  },
                );
              },
              error: (err, stack) => Center(child: Text("Erreur: $err")),
              loading: () => const Center(child: CircularProgressIndicator()),
            ),
          ),
        ],
      ),
    );
  }
}
