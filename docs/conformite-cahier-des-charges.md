# Conformité au cahier des charges — Scolia

Référence : `cahier_des_charges_complet_plateforme_scolaire_multi_etablissements.md` (version 2.0, novembre 2026).

Ce document suit l’avancement du projet par rapport aux 48 sections du cahier des charges.
Il sert de registre de conformité et de feuille de route.

## Légende

| Statut | Signification |
| --- | --- |
| ✅ Fait | Implémenté et vérifié côté serveur. |
| 🟡 Partiel | Existe mais incomplet ou non sécurisé. |
| 🔵 Démo | Interface présente avec des données fictives, sans logique réelle. |
| ⛔ À faire | Absent du projet. |

## Synthèse

Le projet est aujourd’hui un **prototype avancé** :
- socle multi-tenant et authentification réels ;
- modules Scolarité, Référentiels, Pédagogie et Planning branchés sur la base (élèves, responsables, classes, enseignants, documents, historique, notes, bulletins, emploi du temps) ;
- le module Vie scolaire (appels, absences, retards, suivi éducatif) est branché sur la base ;
- le cahier de textes (séances, contenus et devoirs) est branché sur la base ;
- le module Finance (frais, échéances, paiements, reçus, soldes, clôtures) est branché sur la base ;
- le portail famille, les annonces de communication et les notifications internes sont branchés sur les données réelles ;
- les documents administratifs (certificat, attestation, liste de classe) sont générés, numérotés, validés et imprimables côté serveur ;
- l’import CSV des élèves est prévalidé et exécuté côté serveur ;
- les modules d’administration SaaS (tenants, abonnements, support) restent des maquettes.

Le cahier des charges décrit une plateforme SaaS complète. La conformité totale nécessite une réalisation par lots (voir §44 du cahier). Ce registre est mis à jour à chaque lot.

## Registre de conformité

| § | Sujet | Statut | Constat / action attendue |
| --- | --- | --- | --- |
| 1 | Vision produit | 🟡 Partiel | Architecture SaaS présente ; modules métier à construire. |
| 2 | Objectifs et problèmes | 🟡 Partiel | Objectifs non mesurés ; indicateurs à instrumenter. |
| 3 | Périmètre | 🟡 Partiel | Périmètre affiché, non implémenté. |
| 4 | Isolation multi-tenant | 🟡 Partiel | `establishmentId` issu de la session ; contrôles renforcés sur classes, documents et documents administratifs. Scénarios croisés vérifiés manuellement ; suite automatisée à ajouter. |
| 5 | Rôles et permissions | 🟡 Partiel | Rôles réels + `MANAGE_ROLES` / `STAFF_ROLES`. Permissions granulaires et journalisation des actions sensibles à ajouter. |
| 6 | Cycle de vie établissement | 🔵 Démo | Écran tenants fictif ; invitations et états de tenant non réels. |
| 7 | Paramétrage établissement | 🟡 Partiel | Identité, devise, périodes et arrondis persistés en base via `referentiel.updateSettings`. Langue, notifications et 2FA à compléter. |
| 8 | Années scolaires et périodes | 🟡 Partiel | Tables `academic_years` et `periods`, création/mise à jour/suppression et écran « Années & calendrier ». Rattachement des notes/bulletins aux périodes à venir. |
| 9 | Niveaux, classes, salles | 🟡 Partiel | Classes réelles + référentiel `rooms` (capacité, équipement, bâtiment). Groupes, historique de classe et affectation automatique à ajouter. |
| 10 | Élèves et inscriptions | 🟡 Partiel | Dossier, matricule, statuts, doublons, capacité, documents, historique, décision d’admission, réinscription annuelle, transfert de classe, transfert sortant et archivage réels. Fiche d’inscription PDF et admission en ligne à compléter. |
| 11 | Parents et responsables | 🟡 Partiel | Plusieurs responsables par élève : ajout, modification, retrait, lien de parenté et coordonnées. Invitations et portail parent à compléter. |
| 12 | Enseignants et personnel | 🟡 Partiel | Fiche réelle (spécialité, affectations, heures). Disponibilités, remplacements et historique à ajouter. |
| 13 | Matières et coefficients | 🟡 Partiel | Référentiel `subjects` réel (niveau, coefficient, volume horaire) avec fichier de programme stocké en base (5 Mo max, import/remplacement/téléchargement contrôlés par rôle et audités). Affectation enseignant-matière-classe à ajouter. |
| 14 | Emploi du temps automatique | 🟡 Partiel | Créneaux et séances persistés (`time_slots`, `timetable_entries`), génération gloutonne par classe selon les volumes horaires, détection des conflits classe/enseignant/salle/capacité, validation et publication. Disponibilités enseignants, charge maximale, indisponibilités de salles et préférences souples à compléter. |
| 15 | Cours et cahier de textes | 🟡 Partiel | Séances réelles par classe, matière, date et créneau : titre, contenu, devoirs, enseignant et statut (planifié, réalisé, annulé), création/modification/suppression par la direction, l’administration et les enseignants, consultation par le personnel et les familles limitée à leur classe, journalisation. Pièces jointes et rattachement au créneau du planning à compléter. |
| 16 | Évaluations et notes | 🟡 Partiel | Évaluations réelles par classe, matière et période ; saisie et validation des notes côté serveur. Import de notes et corrections motivées à compléter. |
| 17 | Calculs et moyennes | 🟡 Partiel | Moyennes pondérées par évaluation et coefficient de matière, calculées à partir des évaluations validées. Versionnement historique à compléter. |
| 18 | Bulletins automatiques | 🟡 Partiel | Génération, validation et publication réelles ; les familles ne voient que les bulletins publiés et reçoivent une notification interne à la publication. Aperçu détaillé réel (moyennes par matière) et impression navigateur/PDF disponibles côté établissement et famille selon les droits ; export PDF serveur et modèle officiel à compléter. |
| 19 | Examens et délibérations | 🟡 Partiel | Planification réelle d'examens/délibérations (création, modification, suppression, statuts/types, classes, dates, candidats, notes) persistée et auditée, écran dédié. Convocations, barèmes/résultats détaillés et processus de délibération avancé à compléter. |
| 20 | Présences et absences | 🟡 Partiel | Sessions d’appel et statuts réels (présent, absent, retard, absence justifiée, dispensé), minutes de retard, motif, justificatif, auteur, validation et visibilité famille des appels validés. À la validation d’un appel, les familles des élèves absents reçoivent une notification interne « Absence signalée », avec alerte « Absences répétées » tous les 3 absences cumulées. Notifications e-mail/SMS et alertes paramétrables à ajouter. |
| 21 | Discipline | 🟡 Partiel | Incidents et observations réels avec type, gravité, lieu, responsable, mesures et statut ; accès filtré aux classes pour les enseignants et journalisation. Sanctions avancées et portail famille à préciser. |
| 22 | Frais et encaissements | 🟡 Partiel | Frais par élève, échéances, paiements partiels ou complets, reçus numérotés, soldes et statuts recalculés, annulation tracée, clôture quotidienne de caisse, visibilité limitée aux enfants du parent/élève. Restent les échéanciers multiples, relances, remises avancées et export comptable. |
| 23 | Portails parents/élèves | 🟡 Partiel | Portail réel limité aux dossiers associés au compte : identité, classe, bulletins publiés, assiduité validée, solde financier, annonces publiées et documents administratifs validés liés (certificat/attestation) consultables/téléchargeables via impression. Restent les autorisations et paiements en ligne. |
| 24 | Communication | 🟡 Partiel | Annonces réelles avec titre, contenu, audience (tous, parents, élèves, enseignants, personnel, classe), brouillon, publication, archivage, filtrage serveur et journalisation. La publication génère des notifications internes par utilisateur (cloche, compteur non lus, marquage lu/tout lu). E-mail et SMS non branchés (non requis à ce stade). |
| 25 | Documents administratifs | 🟡 Partiel | Certificat de scolarité, attestation d’inscription et liste de classe générés côté serveur avec instantané figé, numérotation par établissement, brouillon, validation, annulation tracée et impression papier/PDF via le navigateur. Modèles officiels et signature électronique à compléter. |
| 26 | Bibliothèque et transport | 🔵 Démo | Écrans fictifs, modules optionnels. |
| 27 | Tableaux de bord | 🟡 Partiel | Tableau de bord établissement branché sur les données réelles disponibles (élèves/classes, évaluations et bulletins, encaissements/solde, présence de la classe sélectionnée, suivis éducatifs ouverts, annonces, séances et notifications). Activité récente basée sur les appels/séances et annonces. Consolidation multi-établissements et graphiques historiques à ajouter. |
| 28 | Abonnements SaaS | 🔵 Démo | Écrans fictifs. |
| 29 | Support plateforme | 🔵 Démo | Écran fictif. |
| 30 | Import/export/migration | 🟡 Partiel | Export CSV côté client ; exports serveur tracés du journal d’audit, des élèves, des paiements/reçus, des frais/factures, des présences, de la discipline et des examens (contrôle de rôle, audit) ; import CSV d’élèves prévalidé et inséré côté serveur avec erreurs par ligne, liaison du responsable, historique et audit. XLSX, import des autres référentiels et export serveur des autres jeux de données à ajouter. |
| 31 | UX/UI et accessibilité | 🟡 Partiel | Responsive, focus modal, libellés ARIA. Pagination réelle, actions groupées et états réseau à ajouter. |
| 32 | Architecture technique | 🟡 Partiel | React/TypeScript + oRPC + Drizzle/SQLite. Transactions, workers et environnements à formaliser. |
| 33 | Modèle de données | 🟡 Partiel | Tenant sur les tables métier, index et clés étrangères. Entités pédagogiques, planning, vie scolaire, finance et communication créées. |
| 34 | Sécurité et conformité | 🟡 Partiel | Hash des mots de passe, sessions, origine de confiance, rôles serveur, isolation tenant, documents restreints au personnel, journal des connexions. Limitation des tentatives de connexion (verrouillage temporaire en mémoire) en place ; 2FA et politique de conservation à ajouter. |
| 35 | Sauvegarde et reprise | 🟡 Partiel | Scripts `db:backup`, `db:restore` et `db:verify-restore` avec contrôle d’intégrité, instantané `VACUUM INTO`, sauvegarde de sécurité avant restauration et procédure documentée (`docs/sauvegarde-restauration.md`). Planification automatique et sauvegarde distante à mettre en place en production. |
| 36 | Performance | 🟡 Partiel | Index de base ; pagination et traitements asynchrones à ajouter. |
| 37 | Application Desktop | ⏳ Non couvert | Hors périmètre de cette itération. |
| 38 | API et intégrations | 🟡 Partiel | API typée oRPC ; documentation, limitation de débit et clés API à ajouter. |
| 39 | Journalisation et audit | 🟡 Partiel | Historique élève réel + journal `audit_logs` (connexions, échecs, dossiers, statuts, documents, référentiels, évaluations, notes, bulletins, planning, appels, suivi éducatif, frais, paiements, annulations, clôtures, annonces, documents administratifs et exports) et écran « Journal d’audit » branché. Exports CSV serveur tracés (journal d’audit, élèves, paiements/reçus, frais/factures, présences). |
| 40 | Tests et qualité | 🟡 Partiel | Tests d’intégration `bun run test:api` (base temporaire, 8 scénarios, 178 assertions) : isolation multi-tenant/classes/élèves/documents/séances/planning, numérotation/validation et accès famille aux documents validés liés, refus d'accès croisé, contrôles de rôle, notifications d'annonce et d'absence, export serveur du journal d'audit, cahier de textes, parcours pédagogique notes→bulletins publiés avec visibilité et notification famille, parcours finance (frais, paiement partiel, reçu, annulation tracée et clôture de caisse), parcours planning (conflit bloquant, validation, publication et visibilité famille), parcours scolarité (admission, réinscription, transfert interne/externe), limitation des tentatives de connexion, exports serveur élèves/paiements/frais/présences/discipline/examens (contrôle de rôle), planification des examens/délibérations. Couverture à étendre aux autres imports/exports étendus, cas limites et scénarios de charge. |
| 41 | Critères de recette | 🟡 Partiel | Isolation, rôles, import, documents administratifs (dont accès famille aux documents validés liés), notifications, exports serveur (audit, élèves, paiements, frais, présences, discipline, examens), cahier de textes, pédagogie/bulletins, finance, planning/famille, scolarité (admissions/réinscriptions/transferts), limitation des tentatives de connexion et examens/délibérations couverts par des tests automatisés (`bun run test:api`, 8 scénarios). Autres exports/imports étendus et recette manuelle Desktop/production à ajouter. |
| 42 | Déploiement | 🟡 Partiel | Scripts locaux et procédure de sauvegarde/restauration ; préproduction, planification et rollback applicatif à formaliser. |
| 43 | Formation et documentation | 🟡 Partiel | README et registre de conformité ; guides utilisateurs à rédiger. |
| 44 | Planning par lots | 🟡 Partiel | Lots 1 à 7 réalisés et vérifiés par scénarios API ; Lot 8 en cours (portail famille, communication, notifications internes, import serveur, documents administratifs et export d’audit) ; cahier de textes réel ; Lot 9 à poursuivre. |
| 45 | Livrables | 🟡 Partiel | Code, migrations, registre. UML, tests et procédures manquants. |
| 46 | Risques | 🟡 Partiel | Risques identifiés ; mesures non toutes appliquées. |
| 47 | Évolutions futures | ⏳ Non couvert | Hors périmètre initial. |
| 48 | Décisions à valider | ⛔ À faire | Décisions métier (langue, devise, notation, périodes, abonnements) non tranchées. |

## Principes non négociables (Annexe B)

| Principe | État actuel |
| --- | --- |
| Isolation des données entre établissements | 🟡 Contrôles serveur présents ; tests croisés à ajouter. |
| Contrôles de sécurité côté serveur | ✅ Rôles et tenant vérifiés dans les procédures réelles. |
| Calculs de notes/bulletins versionnés | 🟡 Moteur de calcul réel ; versionnement des corrections à compléter. |
| Planning valide sans conflit obligatoire | ✅ Conflits classe/enseignant/salle/capacité détectés côté serveur ; validation et publication bloquées tant qu’ils subsistent. |
| Opérations financières et corrections traçables | 🟡 Frais, paiements, reçus et clôtures réels ; annulation motivée et journalisée. Export comptable et rapprochement à compléter. |
| Bulletins et données personnelles protégés | 🟡 Parent/élève filtrés ; documents restreints au personnel. |
| Sauvegardes restaurables et testées | 🟡 Sauvegarde, restauration et vérification outillées et testées localement ; planification et copie hors site à industrialiser. |

## Priorités proposées (ordre recommandé)

1. **Lot 1 — Socle SaaS**
   - tests automatisés d’isolation multi-tenant ;
   - journal d’audit global (connexion, exports, actions sensibles) ;
   - permissions granulaires et confirmation des actions sensibles ;

2. **Lot 2 — Référentiels**
   - entités réelles : années scolaires, périodes, niveaux, salles, matières ;
   - paramétrage établissement persisté.

3. **Lot 3 — Scolarité**
   - admission (candidature → décision → inscription) ;
   - réinscription annuelle ;
   - plusieurs responsables légaux ;
   - transfert inter-établissement et archivage.

4. **Lot 4 — Pédagogie** : évaluations, notes, moyennes pondérées, bulletins générés/validés/publiés (démarré).
5. **Lot 5 — Planning** : créneaux, séances, génération, conflits, validation/publication (démarré).
6. **Lot 6 — Vie scolaire** : appels, absences, retards et suivi éducatif (démarré).
7. **Lot 7 — Finance** : frais, paiements, reçus et clôtures (démarré).
8. **Lot 8 — Portails et communication** : espace famille et annonces (démarré).
9. **Lot 9** : documents, import/export, Desktop, qualité.

## Prochaine action recommandée

Le **Lot 1** est démarré (journal d’audit global, restrictions d’accès, écran d’audit branché).
Le **Lot 2** est démarré (années, périodes, matières, salles, paramètres persistés).
Le **Lot 3** est démarré (admission, réinscription, responsables multiples, transfert de classe, archivage).
Le **Lot 4** est démarré (évaluations, notes, moyennes pondérées, génération, validation et publication des bulletins, cahier de textes réel).
Le **Lot 5** est démarré (créneaux, séances, génération, conflits, validation et publication du planning).
Le **Lot 6** est démarré (appels, absences, retards et suivi éducatif réels).
Le **Lot 7** est démarré (frais, paiements, reçus, soldes et clôtures réels).
Le **Lot 8** est démarré (portail famille réel, annonces publiables, notifications internes, import serveur et documents administratifs).

Prochaines étapes :
1. **Lot 1 (suite)** : tests automatisés d'isolation multi-tenant, permissions granulaires.
2. **Lot 2 (suite)** : niveaux et groupes, affectation matière/classe/enseignant, salles liées aux classes.
3. **Lot 3 (démarré)** : admission, réinscription, responsables multiples, transfert de classe, transfert sortant et archivage réels. Reste la fiche d’inscription.
4. **Lot 4 (démarré)** : évaluations, notes, moyennes pondérées, bulletins et cahier de textes réels. Restent l’export PDF, le versionnement des corrections et les pièces jointes des séances.
5. **Lot 5 (démarré)** : emploi du temps et contrôle des conflits. Restent les disponibilités enseignants, la charge maximale et les contraintes souples.
6. **Lot 6 (démarré)** : vie scolaire (absences, retards, discipline). Notifications internes « absence signalée » et alerte « absences répétées » à la validation de l’appel. Restent e-mail/SMS et règles d’alerte paramétrables.
7. **Lot 7 (démarré)** : finance (frais, paiements, reçus, soldes, clôture). Restent les échéanciers multiples, relances et export comptable.
8. **Lot 8 (en cours)** : portail famille, communication, notifications internes, import serveur, documents administratifs et export d’audit réels. Restent les exports serveur des autres jeux de données.
9. **Lot 9** : Desktop, sauvegardes, tests, documentation et recette.

> Le cahier des charges couvre une plateforme complète : chaque lot doit être réalisé et validé avant de passer au suivant. Ce registre est la référence d’avancement.

## Données de démonstration

Un jeu de données complet et isolé est inséré dans la base locale via `bun run db:seed` (ou `bun run db:seed:reset` pour le recréer). Il couvre l’établissement **Lycée Démo Scolia** : 7 comptes de test (mot de passe `Demo1234!`), 5 élèves, 4 responsables, 3 classes, 8 matières, 10 évaluations/16 notes, 6 bulletins, planning publié, appels, discipline, 5 factures/5 paiements, annonces, notifications, documents administratifs, examens et cahier de textes. Détails et parcours de test : `docs/donnees-demo.md`.
