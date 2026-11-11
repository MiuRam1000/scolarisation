# Maquette Scolia
## Décisions
- Plan et référence approuvés. Web responsive seulement ; client Desktop futur.
- Prototype local, profils et données fictifs, pas de sécurité serveur ni transactions réelles.
- Ensemble du périmètre représenté par écrans spécialisés et référentiels.
## Travail
- [x] Cahier des charges lu et plan validé
- [x] Initialisation et design
- [x] Navigation, dashboard, 31 écrans, portails et profils de démonstration
- [x] Parcours inscription, notes, bulletin, planning, paiement et import CSV
- [x] Build réussi, TypeScript vérifié, lint sans erreur
- [x] Tests Playwright : 31 écrans desktop et 10 écrans mobile sans débordement, 11 groupes de contrôles réussis, aucune erreur JavaScript
- [x] Dialogues natifs, focus contenu et fermeture Échap, données familiales publiées distinctes des brouillons pour la note de démonstration
- [ ] Livraison
## Limites assumées
- Données locales : aucune API métier, isolation serveur, authentification ou transaction réelle.
- Génération de planning, publication et notifications simulées.
- Import CSV simple seulement ; XLSX non traité.
- Bulletins illustratifs imprimables ; pas de modèle officiel ou génération PDF serveur.
- Établissement secondaire et année archivée présentés avec avertissement de données réutilisées.
- Navigation par rôle illustrative, aucun contrôle d'accès serveur.