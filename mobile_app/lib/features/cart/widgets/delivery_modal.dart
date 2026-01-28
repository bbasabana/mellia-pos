import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mellia_pos_mobile/core/theme/app_theme.dart';
import 'package:mellia_pos_mobile/features/cart/cart_provider.dart';
import 'package:mellia_pos_mobile/shared/widgets/primary_button.dart';

class DeliveryModal extends ConsumerStatefulWidget {
  const DeliveryModal({super.key});

  @override
  ConsumerState<DeliveryModal> createState() => _DeliveryModalState();
}

class _DeliveryModalState extends ConsumerState<DeliveryModal> {
  final _formKey = GlobalKey<FormState>();
  final _addressController = TextEditingController();
  final _phoneController = TextEditingController();
  final _instructionsController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final info = ref.read(cartNotifierProvider).deliveryInfo;
    if (info != null) {
      _addressController.text = info.address;
      _phoneController.text = info.phone;
      _instructionsController.text = info.instructions ?? "";
    }
  }

  @override
  void dispose() {
    _addressController.dispose();
    _phoneController.dispose();
    _instructionsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  "Infos de Livraison",
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _addressController,
              decoration: AppTheme.inputDecoration(
                label: "Adresse complète",
                prefixIcon: Icons.location_on_outlined,
              ),
              validator: (v) =>
                  v == null || v.isEmpty ? "L'adresse est requise" : null,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _phoneController,
              decoration: AppTheme.inputDecoration(
                label: "Téléphone",
                prefixIcon: Icons.phone_outlined,
              ),
              keyboardType: TextInputType.phone,
              validator: (v) =>
                  v == null || v.isEmpty ? "Le téléphone est requis" : null,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _instructionsController,
              decoration: AppTheme.inputDecoration(
                label: "Instructions (Optionnel)",
                prefixIcon: Icons.notes_outlined,
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 24),
            PrimaryButton(
              text: "VALIDER",
              onPressed: () {
                if (_formKey.currentState!.validate()) {
                  ref
                      .read(cartNotifierProvider.notifier)
                      .setDeliveryInfo(
                        DeliveryInfo(
                          address: _addressController.text,
                          phone: _phoneController.text,
                          instructions: _instructionsController.text.isEmpty
                              ? null
                              : _instructionsController.text,
                        ),
                      );
                  Navigator.pop(context);
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}
