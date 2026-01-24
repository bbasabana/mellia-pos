"use client";

import { User, Mail, Lock, Trash2, ChevronRight, Shield, Bell } from "lucide-react";
import Image from "next/image";

export function AccountSettingsCard() {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Compte</h2>
                <p className="text-sm text-gray-500 mt-1">Gérez vos informations personnelles et la sécurité.</p>
            </div>

            <div className="divide-y divide-gray-50">
                {/* Profile Section */}
                <div className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                                {/* Placeholder for user avatar - ideally would use actual user data */}
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                    <User size={32} />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Profil</h3>
                                <p className="text-sm text-gray-500">Photo, nom et biographie</p>
                            </div>
                        </div>
                        <ChevronRight className="text-gray-300 group-hover:text-gray-500 transition-colors" size={20} />
                    </div>
                </div>

                {/* Contact Info */}
                <div className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                                <Mail size={20} />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Coordonnées</h3>
                                <p className="text-sm text-gray-500">admin@melliapos.com</p>
                            </div>
                        </div>
                        <ChevronRight className="text-gray-300 group-hover:text-gray-500 transition-colors" size={20} />
                    </div>
                </div>

                {/* Security */}
                <div className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-gray-100 text-gray-600 rounded-lg">
                                <Lock size={20} />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Sécurité</h3>
                                <p className="text-sm text-gray-500">Mot de passe et authentification</p>
                            </div>
                        </div>
                        <ChevronRight className="text-gray-300 group-hover:text-gray-500 transition-colors" size={20} />
                    </div>
                </div>

                {/* Notifications (Optional extra for "Google feel") */}
                <div className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg">
                                <Bell size={20} />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Notifications</h3>
                                <p className="text-sm text-gray-500">Alertes produits et mises à jour</p>
                            </div>
                        </div>
                        <ChevronRight className="text-gray-300 group-hover:text-gray-500 transition-colors" size={20} />
                    </div>
                </div>

                {/* Delete Account - Risk Zone */}
                <div className="p-6 mt-4">
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-red-700">Supprimer le compte</h3>
                                <p className="text-xs text-red-500 mt-0.5">Cette action est irréversible et supprimera toutes vos données.</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 bg-white text-red-600 text-sm font-medium border border-red-200 rounded-lg hover:bg-red-50 transition-colors shadow-sm">
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
