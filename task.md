# Scolia
## Décisions
- Plan et référence approuvés. Web responsive seulement ; client Desktop futur.
- Socle réel : base libSQL/SQLite locale (`packages/web/.data/scolia.db`), comptes, sessions et API oRPC SCOLARITÉ. Turso possible via `DATABASE_URL`.
- Interface en français ; les modules non encore branchés restent des écrans de démonstration clairement identifiables.
## Travail
- [x] Cahier des charges lu et plan validé
- [x] Initialisation et design
- [x] Navigation, dashboard, 31 écrans, portails et profils de démonstration
- [x] Parcours inscription, notes, bulletin, planning, paiement et import CSV
- [x] Build réussi, TypeScript vérifié, lint sans erreur
- [x] Tests Playwright : 31 écrans desktop et 10 écrans mobile sans débordement, 11 groupes de contrôles réussis, aucune erreur JavaScript
- [x] Dialogues natifs, focus contenu et fermeture Échap, données familiales publiées distinctes des brouillons pour la note de démonstration
- [x] Base de données réelle, migrations Drizzle versionnées et schéma appliqué
- [x] Authentification serveur : inscription établissement + directeur, connexion, session cookie httpOnly, déconnexion, contrôle d'origine
- [x] API SCOLARITÉ réelle : classes, élèves, responsables, personnel, avec isolation par établissement et contrôle de rôle
- [x] Front branché sur l'API pour la connexion et les listes/créations SCOLARITÉ
- [x] Lot 1 : journal d'audit, restrictions d'accès, écran d'audit
- [x] Lot 2 : années, périodes, matières, salles et paramètres persistés
- [x] Lot 3 : admission, réinscription, responsables multiples, transferts et archivage
- [x] Lot 4 : évaluations, notes, moyennes pondérées, génération/validation/publication des bulletins
- [x] Lot 4 : cahier de textes réel (séances, contenus, devoirs, statuts) avec accès famille limité à la classe
- [x] Lot 5 : créneaux, emploi du temps, génération, conflits, validation/publication
- [x] Lot 6 : appels, absences, retards, motifs, validation et suivi éducatif
- [x] Lot 7 : frais, échéances, paiements, reçus, soldes, annulations tracées et clôtures de caisse
- [x] Lot 8 (partiel) : portail famille réel, annonces publiables, notifications internes, import CSV serveur, documents administratifs numérotés et export serveur du journal d’audit
- [x] Lot 9 (partiel) : sauvegarde, restauration et vérification d’intégrité outillées
- [x] Lot 9 (partiel) : tests d'intégration API sur base temporaire (`bun run test:api`, 8 scénarios : isolation/documents/notifications/audit/cahier de textes, pédagogie-bulletins-famille, finance, planning, scolarité admission/réinscription/transferts, limitation des tentatives de connexion, exports serveur élèves/paiements/frais/présences/discipline/examens, examens/délibérations)
- [x] Tableau de bord établissement branché sur les indicateurs réels disponibles (§27, partiel)
- [x] Jeu de données de démonstration inséré dans la base locale (`bun run db:seed`, `bun run db:seed:reset`) avec comptes direction/administration/enseignant/surveillant/comptable/parent/élève (mot de passe `Demo1234!`) — voir `docs/donnees-demo.md`
- [ ] Livraison

## Limites assumées
- Les modules d’administration SaaS (tenants, abonnements, support) restent simulés côté client.
- Documents administratifs réels (certificat, attestation, liste de classe) ; modèles officiels, logotype et signature électronique non encore produits.
- Pas encore d'invitation de membres, de réinitialisation de mot de passe, ni de pagination. Limitation des tentatives de connexion (verrouillage temporaire en mémoire) en place.
- Le rôle est choisi à l'inscription (directeur) ; les autres rôles se créent pour l'instant côté base.
- Import CSV d’élèves prévalidé et inséré côté serveur ; exports serveur tracés du journal d’audit, des élèves, des paiements/reçus, des frais/factures, des présences, de la discipline et des examens ; XLSX, autres référentiels et export serveur des autres jeux de données non traités.
- Bulletins r�els g�n�r�s/valid�s/publi�s ; notification interne � la publication. Aper�u d�taill� r�el (moyennes par mati�re) et impression navigateur/PDF disponibles. Export PDF serveur et mod�le officiel encore � produire.
- Cahier de textes réel ; pièces jointes des séances et rattachement au créneau du planning non encore produits.
- Appels et suivis éducatifs réels ; la validation d’un appel notifie les familles des élèves absents (alerte interne tous les 3 absences cumulées). E-mail/SMS et règles d’alerte paramétrables non branchés.
- Finance réelle ; échéanciers multiples, relances automatiques, remises avancées et export comptable non encore produits.
- Annonces réelles ; la publication génère des notifications internes par utilisateur (cloche, compteur, marquage lu). E-mail, SMS et notifications push non branchés.
- Portail famille réel ; documents administratifs téléchargeables côté famille, paiement en ligne et notifications non encore produits.
- Navigation par rôle illustrative ; les contrôles d'accès ne couvrent que les procédures serveur déjà branchées.
