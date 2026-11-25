# CAHIER DES CHARGES

## CONCEPTION ET DÉVELOPPEMENT D'UNE

## PLATEFORME DE GESTION SCOLAIRE MULTI-

ÉTABLISSEMENTS Solution SaaS --- Application Web et Desktop Élément
Description Nature du produit Plateforme centralisée permettant à
plusieurs établissements scolaires de travailler indépendamment.
Établissements concernés Primaire, collège et lycée ; extension possible
à d'autres niveaux. Utilisateurs Équipe de la plateforme, directions,
administrations, enseignants, surveillants, comptables, parents et
élèves. Mode de livraison Application Web responsive et application
Desktop connectée à la même plateforme. Modèle SaaS multi-tenant avec
espaces, utilisateurs, données et paramètres séparés par établissement.
Version \### 2.0 --- Cahier des charges détaillé Date Novembre 2026
Porteur / organisation À compléter Responsable du projet À compléter
Document de référence pour le cadrage, la conception, le développement,
les tests, le déploiement et la réception.

## CONTRÔLE DU DOCUMENT

Rubrique Valeur Objet Définir les exigences fonctionnelles, métier,
techniques, de sécurité et de qualité. Public cible Porteur du produit,
développeurs, designer UI/UX, testeurs et établissements clients. Statut
Document de cadrage détaillé à valider avec des représentants
d'établissements pilotes. Principe fondamental L'isolation des données
entre établissements est obligatoire et doit être vérifiée à tous les
niveaux. \## SOMMAIRE \## 1. Résumé exécutif et vision du produit \## 2.
Contexte, besoins et objectifs \## 3. Périmètre et limites du projet \##
4. Concept SaaS multi-établissements et isolation des données \## 5.
Acteurs, rôles et permissions \## 6. Parcours d'inscription et cycle de
vie d'un établissement client \## 7. Paramétrage de l'établissement \##
8. Années scolaires, périodes et calendrier \## 9. Niveaux, classes,
groupes et salles \## 10. Gestion des élèves et des inscriptions \## 11.
Parents et responsables légaux \## 12. Gestion des enseignants et du
personnel \## 13. Matières, programmes et coefficients \## 14. Emploi du
temps automatique \## 15. Gestion des cours et cahier de textes \## 16.
Évaluations et saisie des notes \## 17. Calculs, moyennes et règles de
notation \## 18. Bulletins automatiques \## 19. Examens, délibérations
et passage en classe supérieure \## 20. Présences, absences et retards
\## 21. Discipline et suivi éducatif \## 22. Frais scolaires et
comptabilité des encaissements \## 23. Portail parents et élèves \## 24.
Communication et notifications \## 25. Documents et éditions
administratives \## 26. Bibliothèque et transport scolaire \## 27.
Tableau de bord et indicateurs \## 28. Gestion des abonnements et
facturation SaaS \## 29. Support, assistance et administration de la
plateforme \## 30. Importation, exportation et migration \## 31.
Exigences UX/UI et accessibilité \## 32. Architecture fonctionnelle et
technique \## 33. Modèle de données et règles d'intégrité \## 34.
Sécurité, confidentialité et conformité \## 35. Sauvegarde, continuité
et reprise \## 36. Performance, disponibilité et évolutivité \## 37.
Application Desktop et mode hors ligne \## 38. API et intégrations
externes \## 39. Journalisation, audit et traçabilité

## 40. Tests et assurance qualité

## 41. Critères de recette et acceptation

## 42. Déploiement et mise en production

## 43. Formation et documentation

## 44. Planning et lots de réalisation

## 45. Livrables

## 46. Risques et mesures de réduction

## 47. Évolutions futures

## 48. Hypothèses, décisions à valider et conclusion

## 1. Résumé exécutif et vision du produit

Le projet consiste à réaliser une plateforme numérique de gestion
scolaire accessible à plusieurs établissements indépendants. Chaque
établissement dispose de son propre espace de travail, de ses
paramètres, de ses utilisateurs et de ses données. La plateforme
mutualise le socle technique, mais aucun établissement ne doit consulter
ou modifier les données d'un autre établissement. La solution couvre la
gestion administrative, pédagogique, financière et la communication avec
les familles. Elle s'adresse aux établissements du primaire, du collège
et du lycée. Elle est accessible sur le Web et, au moyen d'une
application Desktop, sur les ordinateurs des établissements. Le produit
est conçu comme un service SaaS : l'exploitant de la plateforme crée et
administre les comptes des établissements, gère les offres et assure
l'exploitation technique. Chaque établissement gère ensuite son activité
quotidienne selon ses propres droits. \## 2. Contexte, besoins et
objectifs \### 2.1 Problèmes à résoudre - Dispersion des informations
dans les cahiers, feuilles de calcul et logiciels non connectés. -
Calcul manuel des moyennes et préparation chronophage des bulletins. -
Conflits et difficulté de mise à jour des emplois du temps. - Manque de
visibilité sur les absences, retards, paiements et résultats. -
Communication lente entre l'administration, les enseignants et les
familles. - Absence d'un historique fiable des modifications et des
décisions. \### 2.2 Objectifs généraux - Centraliser les opérations
scolaires dans un système cohérent. - Automatiser les tâches répétitives
tout en laissant les validations importantes aux personnes autorisées. -
Réduire les erreurs de saisie et de calcul grâce à des règles
paramétrables et testées. - Fournir à chaque établissement un espace
indépendant et personnalisable. - Permettre à l'éditeur de gérer
plusieurs clients sans mélanger leurs données. - Rendre les informations
pertinentes accessibles selon le rôle et le niveau d'autorisation. \###
2.3 Objectifs mesurables à confirmer Indicateur Cible initiale proposée
Méthode de vérification Isolation des établissements Aucune fuite de
données inter-établissements Tests d'accès croisés et tests automatisés.
Conflits d'emploi du temps Aucun conflit de ressource dans un planning
validé Contrôles automatiques avant publication. Calcul des bulletins
100 % des cas de test conformes aux formules validées Jeux de données de
référence. Sauvegarde Sauvegardes planifiées et restauration testée
Procès-verbal de test de restauration. Disponibilité Objectif initial à
contractualiser, par exemple 99,5 % mensuel Monitoring et rapports
d'incident. \## 3. Périmètre et limites du projet \### 3.1 Inclus dans
le périmètre - Gestion multi-établissements et abonnements SaaS. -
Gestion des utilisateurs, élèves, familles, enseignants, classes et
matières. - Emplois du temps, notes, moyennes, bulletins et examens. -
Présences, absences, retards et discipline. - Frais scolaires,
paiements, reçus et rapports d'encaissement. - Portails parents et
élèves, annonces et notifications.

-   Documents administratifs, statistiques, exports et administration
    technique. \### 3.2 Hors périmètre initial, sauf décision ultérieure
-   Paie complète et gestion avancée des ressources humaines.
-   Comptabilité générale certifiée et déclarations fiscales.
-   Plateforme complète de cours en ligne et visioconférence.
-   Application mobile native iOS/Android.
-   Paiement en ligne tant qu'un prestataire et les conditions
    contractuelles ne sont pas sélectionnés.
-   Suivi GPS des véhicules en temps réel. Toute fonction hors périmètre
    doit faire l'objet d'une demande d'évolution, d'une estimation et
    d'une validation. \## 4. Concept SaaS multi-établissements et
    isolation des données \### 4.1 Principe multi-tenant Chaque
    établissement est un tenant. Toute donnée métier doit être rattachée
    à un identifiant d'établissement (tenant_id ou mécanisme d'isolation
    équivalent). L'identifiant du tenant ne doit jamais être accepté
    aveuglément depuis le navigateur : il doit être déterminé et vérifié
    côté serveur à partir de la session, du domaine ou du contexte
    d'accès autorisé. \### 4.2 Règles obligatoires
-   Un utilisateur appartenant à l'établissement A ne peut ni lire, ni
    modifier, ni supprimer les données de l'établissement B.
-   Les recherches, listes, exports, statistiques, fichiers, pièces
    jointes, notifications et API doivent appliquer le filtre
    d'établissement.
-   Les identifiants non prévisibles ne remplacent jamais le contrôle
    d'autorisation côté serveur.
-   Les tâches planifiées, imports, traitements en arrière-plan et
    rapports doivent conserver le contexte du tenant.
-   Les sauvegardes et restaurations doivent permettre de restaurer la
    plateforme sans mélanger les données des établissements.
-   Les tests de sécurité doivent inclure des tentatives d'accès avec un
    identifiant appartenant à un autre tenant. \### 4.3 Architecture
    d'isolation Option recommandée pour une première version : base de
    données partagée avec séparation logique stricte, tenant_id
    obligatoire, contraintes, politiques d'accès et tests systématiques.
    Pour des clients exigeant une isolation renforcée, prévoir une
    évolution vers une base ou un schéma dédié par tenant. Le choix
    final doit être validé par l'architecte selon le volume, le budget,
    les obligations contractuelles et les compétences de l'équipe. \###
    4.4 Identité et domaines
-   Chaque établissement reçoit un identifiant unique et peut disposer
    d'une URL de type ecole-xyz.domaine.tld.
-   Connexion possible depuis une page commune avec sélection ou
    détection de l'établissement.
-   Logo, couleurs, coordonnées, documents et paramètres propres à
    chaque établissement.
-   Les utilisateurs peuvent avoir plusieurs affiliations uniquement si
    cette possibilité est explicitement autorisée et contrôlée. \## 5.
    Acteurs, rôles et permissions Rôle Responsabilités principales
    Limites d'accès Super administrateur plateforme Gestion globale des
    tenants, offres, incidents, configuration technique et support.
    Accès technique contrôlé, audité et limité au besoin. Administrateur
    plateforme / support Création des établissements, assistance,
    activation et suivi des abonnements. Pas d'accès libre aux notes ou
    dossiers personnels des élèves. Propriétaire / directeur
    d'établissement Paramétrage de l'école, validation, supervision et
    rapports. Uniquement son établissement. Administrateur scolaire
    Gestion des dossiers, classes, inscriptions et Selon permissions
    déléguées.

calendrier. Secrétaire Admissions, dossiers élèves et documents
administratifs. Pas d'accès financier ou pédagogique non autorisé.
Enseignant Cours, appel, évaluations, notes et appréciations de ses
classes. Uniquement ses classes et matières affectées. Surveillant
Présences, retards et incidents. Données de vie scolaire autorisées.
Comptable Frais, paiements, reçus et rapports financiers. Pas de
modification des notes. Parent / tuteur Consultation des enfants liés et
informations publiées. Uniquement les enfants rattachés. Élève
Consultation de son emploi du temps, résultats et annonces. Uniquement
son propre compte. \### 5.1 Gestion des permissions - Permissions
granulaires : consulter, créer, modifier, supprimer, valider, publier,
exporter et imprimer. - Attribution par rôle, avec possibilité de
permissions supplémentaires contrôlées. - Les autorisations doivent être
vérifiées côté serveur pour chaque action. - Les actions sensibles
exigent confirmation et journalisation. - Le changement de rôle ou
d'établissement doit invalider ou actualiser les sessions concernées.
\## 6. Parcours d'inscription et cycle de vie d'un établissement client
\## 1. L'exploitant crée une fiche établissement avec identité, contact
principal, pays, fuseau horaire et coordonnées. \## 2. Le système
attribue un identifiant unique et crée l'espace isolé de
l'établissement. \## 3. Le responsable reçoit une invitation sécurisée
pour activer son compte. \## 4. Le responsable complète les paramètres :
niveaux, année scolaire, classes, périodes, logo et règles de notation.
\## 5. Il importe ou saisit les utilisateurs et les dossiers initiaux.
\## 6. L'établissement peut tester ses paramètres dans un environnement
de préparation si cette option est disponible. \## 7. L'établissement
passe à l'état actif après validation des conditions de service et de
l'abonnement. \## 8. En cas d'expiration, suspension ou résiliation, les
règles d'accès, d'export et de conservation sont appliquées conformément
au contrat. État du tenant Comportement attendu En préparation
Configuration initiale, accès limité aux administrateurs désignés. Actif
Accès normal selon l'abonnement et les rôles. En période de grâce
Alertes et restrictions définies dans les conditions commerciales.
Suspendu Accès opérationnel bloqué ou limité ; données conservées.
Résilié / archivé Accès désactivé ; export et durée de conservation
selon contrat. Supprimé Suppression uniquement après autorisation, délai
de conservation et procédure vérifiée. \## 7. Paramétrage de
l'établissement - Nom officiel, nom d'usage, adresse, téléphone, e-mail,
logo et signature. - Langue de l'interface, devise, fuseau horaire et
formats de date. - Calendrier hebdomadaire, jours ouvrés, horaires,
vacances et jours fériés. - Niveaux autorisés : primaire, collège, lycée
; séries, options et parcours. - Règles de notation, barèmes,
coefficients, arrondis et seuils de décision. - Modèles de bulletin,
reçu, certificat, attestation et autres documents. - Coordonnées
bancaires ou références de paiement si utilisées. - Paramètres de
notifications et personnes responsables. \## 8. Années scolaires,
périodes et calendrier - Créer une année scolaire avec dates de début et
de fin et statut brouillon, active ou clôturée. - Définir des
trimestres, semestres ou périodes personnalisées.

-   Configurer les dates de saisie, verrouillage, validation et
    publication des notes.
-   Créer le calendrier des examens, réunions, vacances et événements.
-   Archiver une année sans perdre les dossiers, bulletins, paiements et
    historiques.
-   Empêcher les modifications d'une année clôturée sauf autorisation
    explicite et auditée. \## 9. Niveaux, classes, groupes et salles
-   Créer les niveaux, classes, séries, options, groupes et divisions.
-   Définir la capacité maximale d'une classe et son professeur
    principal.
-   Créer les salles avec capacité, équipements et contraintes
    d'utilisation.
-   Affecter les élèves à une classe pour une année donnée.
-   Permettre les groupes temporaires pour langues, travaux pratiques et
    options.
-   Conserver l'historique des changements de classe et de groupe.
    \## 10. Gestion des élèves et des inscriptions \### 10.1 Dossier
    élève
-   Matricule unique au sein de l'établissement, nom, prénoms, date de
    naissance et informations utiles.
-   Photo facultative, adresse et contacts autorisés.
-   Informations de santé uniquement si strictement nécessaires,
    légalement autorisées et protégées par des droits renforcés.
-   Parents/tuteurs associés, contacts d'urgence et documents
    justificatifs.
-   Statut : candidat, inscrit, actif, transféré, sorti, suspendu ou
    archivé. \### 10.2 Processus d'admission \## 9. Enregistrer une
    demande d'inscription. \## 10. Vérifier les pièces requises et
    signaler les éléments manquants. \## 11. Évaluer la demande et
    enregistrer la décision. \## 12. Créer le dossier définitif et
    attribuer un matricule. \## 13. Affecter l'élève à une année, un
    niveau et une classe. \## 14. Émettre une fiche d'inscription et, si
    applicable, les frais correspondants. \### 10.3 Opérations courantes
-   Réinscription annuelle avec reprise contrôlée des informations.
-   Transfert entre classes ou établissements avec historique.
-   Gestion du départ et de l'archivage du dossier.
-   Recherche, filtres, listes et export selon permissions.
-   Détection des doublons potentiels sans fusion automatique non
    validée. \## 11. Parents et responsables légaux
-   Créer une fiche parent/tuteur avec coordonnées et moyen de contact.
-   Associer un parent à un ou plusieurs élèves.
-   Permettre plusieurs responsables pour un élève, avec indication des
    droits de consultation si nécessaire.
-   Vérifier les invitations et empêcher qu'un parent consulte un enfant
    non associé.
-   Mettre à jour les coordonnées avec conservation de l'historique
    utile.
-   Permettre à l'administration de désactiver un accès sans supprimer
    le dossier historique.

## \## 12. Gestion des enseignants et du personnel

## Créer une fiche individuelle et un identifiant de connexion facultatif.

## Définir spécialités, matières, classes, groupes et responsabilités.

## Enregistrer les disponibilités, indisponibilités et absences professionnelles.

## Calculer la charge horaire hebdomadaire planifiée.

## Gérer remplacements, délégations et historique d'affectation.

Limiter les enseignants à la consultation et modification des données
pédagogiques qui leur sont attribuées. \## 13. Matières, programmes et
coefficients - Créer les matières par niveau, classe, série et année. -
Définir coefficient, volume horaire, barème par défaut et type
d'enseignement. - Associer une matière à un ou plusieurs enseignants. -
Paramétrer les matières obligatoires, optionnelles et non prises en
compte dans certaines moyennes. - Définir les règles particulières par
niveau et période. - Conserver une version des paramètres appliqués à
chaque année pour préserver les anciens calculs. \## 14. Emploi du temps
automatique \### 14.1 Entrées nécessaires - Jours et créneaux, durées
des cours, pauses et horaires d'ouverture. - Classes, groupes, matières,
volumes horaires et fréquences. - Enseignants, compétences,
disponibilités et charge maximale souhaitée. - Salles, capacités,
équipements et périodes d'indisponibilité. - Contraintes fixes et
préférences souples définies par la direction. \### 14.2 Contraintes
dures - Une classe ou un groupe ne peut pas suivre deux cours au même
moment. - Un enseignant ne peut pas enseigner à deux groupes
simultanément. - Une salle ne peut pas être affectée à deux cours
simultanés. - Les indisponibilités obligatoires des enseignants et
salles doivent être respectées. - Les capacités et équipements requis
des salles doivent être respectés. - Les horaires de fermeture, pauses
et jours non travaillés sont respectés. \### 14.3 Contraintes souples et
optimisation - Éviter les longues plages libres et les journées
excessivement chargées. - Répartir les matières sur la semaine selon les
préférences de l'établissement. - Éviter les cours isolés et les
changements de salle trop fréquents. - Équilibrer la charge des
enseignants sans dépasser les limites paramétrées. - Respecter les
préférences de créneaux lorsque cela ne crée pas de conflit dur. \###
14.4 Fonctionnement du générateur \## 15. L'utilisateur sélectionne
l'année, les classes, les enseignants, les salles et les contraintes à
considérer. \## 16. Le système vérifie la complétude des données et
liste les éléments manquants. \## 17. Le moteur génère une ou plusieurs
propositions avec un indicateur de qualité. \## 18. Le système affiche
les contraintes satisfaites et les conflits impossibles à résoudre. \##
19. L'administrateur ajuste manuellement certains créneaux si
nécessaire. \## 20. Une nouvelle vérification complète est exécutée
avant validation. \## 21. Le planning validé est publié aux enseignants,
élèves et parents selon les droits.

## \### 14.5 Historique et exports

## Versions brouillon, générée, modifiée, validée et publiée.

## Comparer deux versions et identifier les modifications.

## Ne jamais écraser une version publiée sans confirmation et conservation de l'ancienne version.

## Imprimer par classe, enseignant, salle ou établissement.

Exporter en PDF et tableur. Le moteur doit distinguer les contraintes
obligatoires des préférences. Il ne doit jamais annoncer un planning
valide si une contrainte obligatoire est violée. \## 15. Gestion des
cours et cahier de textes - Consulter les séances prévues et
réalisées. - Enregistrer le thème, les objectifs, le contenu traité et
les devoirs donnés. - Associer une séance à la classe, matière,
enseignant et date. - Signaler une séance non effectuée et son motif. -
Permettre à l'administration de suivre l'avancement des programmes. -
Partager les devoirs et ressources avec les élèves si le module est
activé. \## 16. Évaluations et saisie des notes - Créer des évaluations
par classe, groupe, matière et période. - Définir type, date, barème,
coefficient et date limite de saisie. - Saisir les notes
individuellement ou par grille de classe. - Importer les notes avec
contrôle des matricules et valeurs. - Utiliser des statuts distincts :
note saisie, absent, dispensé, non évalué, à compléter. - Autoriser la
correction avant verrouillage et conserver auteur, date, ancienne et
nouvelle valeur. - Fermer la saisie après validation de période, sauf
dérogation auditée. - Afficher les notes manquantes et les anomalies
avant calcul. \## 17. Calculs, moyennes et règles de notation \### 17.1
Paramètres - Barème par évaluation, coefficient de l'évaluation et
coefficient de matière. - Règle de conversion sur 20 ou autre échelle
définie. - Gestion des notes éliminatoires, bonus ou malus si
l'établissement les utilise. - Règle d'arrondi et nombre de décimales. -
Traitement des absences, dispenses et évaluations non réalisées. \###
17.2 Formule de référence à paramétrer Moyenne pondérée d'une matière =
somme(note normalisée × coefficient de l'évaluation) / somme des
coefficients pris en compte. Moyenne générale = somme(moyenne de matière
× coefficient de matière) / somme des coefficients des matières prises
en compte. Cette formule est indicative : les règles exactes doivent
être validées par chaque établissement et configurées par niveau. Le
système doit afficher les détails du calcul et éviter toute division par
zéro. \### 17.3 Contrôles - Refuser une note négative ou supérieure au
barème, sauf règle explicitement autorisée. - Ne pas assimiler
automatiquement une absence à zéro sans règle validée. - Ne pas inclure
les matières dispensées dans le dénominateur si la règle de
l'établissement l'exclut.

-   Recalculer les moyennes concernées après modification autorisée
    d'une note.
-   Conserver la version des règles utilisée pour chaque bulletin.
    \## 18. Bulletins automatiques \### 18.1 Préparation
-   Identifier les élèves et matières attendus pour la période.
-   Vérifier les notes, coefficients, appréciations et absences
    requises.
-   Calculer moyennes par matière et moyenne générale.
-   Détecter les données manquantes et produire une liste de bulletins
    incomplets. \### 18.2 Contenu configurable
-   Logo, coordonnées, année, période, identité de l'élève et classe.
-   Tableau des matières, notes, moyennes, coefficients et
    appréciations.
-   Moyenne générale, rang si activé, absences et retards.
-   Appréciation générale, décision et signatures prévues.
-   Mentions particulières et barème de lecture. \### 18.3 Workflow de
    validation \## 22. Prévisualisation des bulletins en brouillon.
    \## 23. Contrôle des bulletins incomplets et anomalies. \## 24.
    Validation par le responsable autorisé. \## 25. Verrouillage des
    résultats de la période selon les règles. \## 26. Publication aux
    parents et élèves autorisés. \## 27. Réédition contrôlée en cas de
    correction, avec conservation de la version précédente. Le bulletin
    ne devient définitif que si toutes les données obligatoires sont
    complètes et validées. La génération PDF doit être reproductible :
    les mêmes données et règles versionnées doivent produire le même
    résultat. \## 19. Examens, délibérations et passage en classe
    supérieure
-   Planifier les examens, épreuves, salles et surveillants.
-   Préparer les listes de candidats et feuilles de présence.
-   Centraliser les résultats et calculer les moyennes d'examen.
-   Définir les règles de passage, redoublement, rattrapage et décision
    exceptionnelle.
-   Préparer les délibérations avec proposition automatique explicable.
-   Permettre au conseil compétent de valider ou modifier une
    proposition avec motif.
-   Produire procès-verbaux, listes d'admis et relevés.
-   Archiver les décisions et empêcher leur modification non autorisée.
    \## 20. Présences, absences et retards
-   Effectuer l'appel par séance, demi-journée ou journée.
-   Statuts : présent, absent, retard, absence justifiée, absence non
    justifiée et dispensé.
-   Enregistrer heure, motif, justificatif et auteur de la saisie.
-   Permettre une correction avec traçabilité.
-   Calculer les durées et totaux d'absence selon la règle locale.
-   Notifier les responsables selon les paramètres et les canaux
    disponibles.
-   Déclencher des alertes en cas d'absences répétées.

## \## 21. Discipline et suivi éducatif

## Enregistrer incidents, observations, avertissements et sanctions autorisées.

## Associer l'événement à l'élève, la date, le lieu et le responsable.

## Suivre les mesures prises et leur statut.

## Limiter l'accès aux données disciplinaires.

Permettre un historique consultable par les seuls responsables
habilités. \## 22. Frais scolaires et comptabilité des encaissements
\### 22.1 Paramétrage des frais - Définir frais d'inscription,
scolarité, examens, fournitures, transport et frais divers. - Appliquer
des tarifs par année, niveau, classe ou élève. - Définir échéances,
paiements échelonnés, remises, bourses et exonérations. - Définir les
modes de paiement autorisés et les comptes de caisse. \### 22.2
Paiements - Enregistrer paiement total ou partiel avec date, montant,
mode, référence et caissier. - Générer un reçu numéroté, unique,
imprimable et vérifiable. - Calculer automatiquement montant dû, montant
payé et solde. - Traiter annulation et remboursement par opération
corrective, jamais par effacement silencieux. - Empêcher les doublons de
paiement grâce à des contrôles d'unicité et de confirmation. - Produire
journaux de caisse, états des impayés et rapports par période. \### 22.3
Contrôle financier - Accès séparé aux opérations de caisse et à leur
validation. - Clôture de caisse journalière avec total par mode de
paiement. - Historique complet des corrections et annulations. - Exports
selon droits et rapprochement manuel ou intégré si prévu. Le module
initial est un suivi des frais et encaissements scolaires. Il ne
remplace pas automatiquement un logiciel de comptabilité générale. \##
23. Portail parents et élèves Espace parent Espace élève Consulter les
enfants rattachés et leurs classes. Consulter son propre emploi du
temps. Voir les bulletins et notes publiés. Voir les notes et bulletins
publiés. Consulter les absences et retards autorisés. Consulter ses
absences selon paramétrage. Voir les frais, paiements, reçus et soldes
autorisés. Consulter devoirs, ressources et annonces. Recevoir les
annonces et notifications. Recevoir les annonces et notifications. Les
informations non publiées ou en brouillon ne sont pas visibles dans les
portails. Les liens parent-enfant sont vérifiés côté serveur à chaque
requête. \## 24. Communication et notifications - Créer annonces
générales ou ciblées par établissement, niveau, classe ou groupe. -
Envoyer notifications dans l'application pour absences, publication de
notes, bulletins et échéances. - Prévoir e-mail et SMS via des
fournisseurs externes configurés. - Enregistrer le statut d'envoi, les
erreurs et les tentatives. - Éviter les envois répétés involontaires et
respecter les préférences autorisées.

-   Ne pas exposer les coordonnées des familles à d'autres utilisateurs.
    \## 25. Documents et éditions administratives

-   Générer certificat de scolarité, attestation, carte d'élève, fiche
    d'inscription et liste de classe.

-   Générer relevé de notes, bulletin, convocation, autorisation et
    reçu.

-   Utiliser des modèles personnalisables par établissement.

-   Numéroter les documents lorsque nécessaire et vérifier leur
    authenticité.

-   Exporter PDF et tableur selon la nature du document.

-   Conserver date, auteur, version et statut du document. \## 26.
    Bibliothèque et transport scolaire \### 26.1 Bibliothèque

-   Catalogue des ouvrages, exemplaires, catégories et disponibilité.

-   Emprunts, retours, retards et historique.

-   Règles de durée d'emprunt et pénalités paramétrables. \### 26.2
    Transport

-   Lignes, arrêts, véhicules et responsables.

-   Affectation des élèves aux trajets.

-   Suivi des frais et listes par trajet. Ces modules sont optionnels et
    peuvent être activés selon le forfait ou le choix de chaque
    établissement. \## 27. Tableau de bord et indicateurs Profil
    Indicateurs et accès Direction Effectifs, répartition par classe,
    résultats, absences, progression pédagogique et synthèse financière.
    Administration Inscriptions en attente, dossiers incomplets,
    changements de classe et documents à traiter. Enseignant Classes
    affectées, évaluations à saisir, notes manquantes et prochains
    cours. Surveillant Appels à effectuer, absences du jour, retards et
    incidents ouverts. Comptable Encaissements, soldes, impayés,
    échéances et clôture de caisse. Parent / élève Informations
    personnelles utiles, résultats publiés, absences et annonces. Chaque
    tableau de bord applique le périmètre de données et les permissions
    du compte. Les statistiques inter- établissements ne sont
    accessibles qu'à l'exploitant et uniquement sous une forme
    autorisée, agrégée ou explicitement prévue. \## 28. Gestion des
    abonnements et facturation SaaS

-   Créer des offres : gratuite d'essai, standard, professionnelle ou
    personnalisée.

-   Définir prix, durée, nombre maximal d'élèves, comptes, stockage et
    modules inclus.

-   Créer, renouveler, suspendre et résilier un abonnement.

-   Enregistrer factures, paiements, échéances, remises et avoirs.

-   Notifier les responsables avant expiration et en cas de paiement en
    retard.

-   Définir les règles de période de grâce et de restriction d'accès.

-   Permettre à l'établissement d'accéder à son statut et à ses factures
    SaaS.

-   Ne jamais supprimer les données d'un établissement uniquement à
    cause d'un impayé ; appliquer les conditions contractuelles et la
    procédure de conservation/export. Les moyens de paiement, taxes,
    monnaie, facturation et obligations applicables doivent être validés
    avec les responsables commerciaux et juridiques avant lancement.
    \## 29. Support, assistance et administration de la plateforme

-   Créer et suivre les demandes d'assistance par établissement.

-   Catégoriser les incidents, demandes et priorités.

-   Enregistrer l'historique des réponses et le statut de résolution.

-   Permettre au support de diagnostiquer les problèmes sans accès
    injustifié aux données scolaires.

-   Prévoir une procédure d'accès exceptionnel, temporaire, justifié et
    journalisé si une intervention sur les données est nécessaire.

-   Suivre l'état technique des services, tâches et intégrations.
    \## 30. Importation, exportation et migration

-   Importer élèves, parents, enseignants, classes, matières, notes et
    soldes à partir de modèles CSV/XLSX.

-   Fournir des modèles téléchargeables avec noms de colonnes et
    exemples.

-   Effectuer une prévalidation avant insertion : format, doublons,
    références et valeurs obligatoires.

-   Présenter un rapport d'import : lignes acceptées, rejetées et
    raisons.

-   Permettre une simulation avant validation finale.

-   Exporter les données d'un établissement selon ses droits et les
    conditions du service.

-   Fournir une procédure de sortie permettant à un établissement de
    récupérer ses données dans un format exploitable. \## 31. Exigences
    UX/UI et accessibilité

-   Interface responsive, claire et cohérente sur ordinateur et
    tablette.

-   Navigation adaptée au rôle et au contexte de l'établissement.

-   Recherche, filtres, tri, pagination et actions groupées sur les
    listes volumineuses.

-   Formulaires avec champs obligatoires clairement identifiés et
    validation immédiate.

-   Messages d'erreur compréhensibles et suggestions de correction.

-   Confirmation des suppressions, clôtures, publications et opérations
    financières.

-   États de chargement, progression, absence de résultat et erreur
    réseau.

-   Contrastes lisibles, navigation clavier de base et libellés
    accessibles.

-   Langue initiale à définir ; prévoir une architecture permettant
    d'ajouter d'autres langues. \## 32. Architecture fonctionnelle et
    technique \### 32.1 Architecture cible indicative Couche
    Responsabilité Technologies possibles Frontend Web Interface et
    parcours utilisateurs. React + TypeScript, Vue ou équivalent.
    Desktop Application installable réutilisant le front-end. Electron
    ou Tauri. Backend Règles métier, authentification, autorisations et
    API. Laravel, NestJS ou équivalent. Base de données Stockage
    relationnel et intégrité. PostgreSQL recommandé. Stockage fichiers
    Documents, photos et exports privés. Stockage objet compatible S3 ou
    stockage sécurisé. Tâches asynchrones PDF, notifications, imports et
    génération d'emplois du temps. Queue et workers. Supervision Logs,
    métriques, alertes et disponibilité. Outils adaptés à l'hébergement
    retenu.

## \### 32.2 Principes d'architecture

## API centralisée et documentée ; logique métier non dupliquée dans les clients.

## Validation serveur de toutes les données et permissions.

## Isolation multi-tenant appliquée dans une couche centrale et vérifiable.

## Transactions pour les opérations critiques : paiement, clôture de notes et publication.

## Traitements lourds exécutés en arrière-plan avec suivi de progression.

## Versionnement de l'API et migrations contrôlées de la base.

## Environnements séparés : développement, test/préproduction et production.

Code versionné, revues de code et intégration continue. \### 32.3 Choix
technologiques Les technologies citées sont des propositions, pas des
obligations définitives. Le choix doit tenir compte des compétences de
l'équipe, du coût d'hébergement, de la maintenance, de la sécurité et de
la disponibilité des développeurs. \## 33. Modèle de données et règles
d'intégrité Domaine Entités principales Plateforme Tenant, abonnement,
offre, facture SaaS, utilisateur plateforme, ticket support. Sécurité
Utilisateur, rôle, permission, affiliation, session, journal audit.
Scolarité Établissement, année scolaire, période, niveau, classe,
groupe, élève, inscription. Famille Parent, responsable, relation
élève-responsable, invitation portail. Personnel Enseignant, personnel,
spécialité, affectation, disponibilité. Pédagogie Matière, coefficient,
programme, évaluation, note, appréciation, moyenne. Planning Salle,
créneau, contrainte, emploi du temps, séance, version planning.
Résultats Bulletin, ligne bulletin, décision, délibération, examen. Vie
scolaire Appel, présence, absence, justificatif, incident, sanction.
Finance Frais, échéance, compte caisse, paiement, reçu, remboursement.
Communication Annonce, notification, modèle, statut d'envoi. Documents
Fichier, document généré, modèle, historique de version. \### 33.1
Règles de conception - Chaque entité métier appartenant à une école
porte une référence de tenant. - Les clés étrangères doivent empêcher
les relations entre données de tenants différents. - Les matricules,
numéros de reçu et références sont uniques dans leur périmètre défini. -
Les suppressions doivent être logiques ou archivées pour les données
historiques importantes. - Les opérations critiques utilisent des
transactions. - Les dates sont stockées de manière cohérente et
affichées selon le fuseau horaire de l'établissement. - Les règles de
calcul et paramètres historiques doivent être versionnés. \## 34.
Sécurité, confidentialité et conformité - HTTPS obligatoire en
production. - Mots de passe hachés avec un algorithme adapté ; aucun mot
de passe en clair. - Protection contre les attaques courantes :
injection, XSS, CSRF, brute force et élévation de privilèges. -
Limitation des tentatives de connexion et mécanisme de récupération de
compte sécurisé. - Authentification renforcée pour les comptes
plateforme et opérations sensibles. - Permissions vérifiées côté serveur
sur chaque route, fichier, export et tâche. - Fichiers privés servis via
autorisation ou liens temporaires.

-   Collecte minimale des données personnelles et politique de
    conservation définie.

-   Accès aux informations sensibles limité et journalisé.

-   Procédure de notification et traitement des incidents de sécurité.

-   Les obligations légales applicables dans les pays d'exploitation
    doivent être examinées avant mise en production. \## 35. Sauvegarde,
    continuité et reprise

-   Définir une fréquence de sauvegarde selon le volume et la criticité
    des données.

-   Chiffrer les sauvegardes et restreindre leur accès.

-   Conserver des copies séparées de l'environnement de production.

-   Tester régulièrement la restauration complète et la restauration
    d'un tenant si l'architecture le permet.

-   Définir les objectifs RPO et RTO avec le responsable du service.

-   Documenter les procédures en cas de panne, corruption, erreur
    humaine ou incident de sécurité.

-   Surveiller l'espace disque, les files d'attente et l'état des
    services. Notion Définition à valider RPO Perte maximale de données
    acceptable exprimée en durée. RTO Durée maximale cible pour rétablir
    le service. Fréquence À définir selon les transactions et les coûts.
    Rétention Durée de conservation des sauvegardes et modalités de
    purge. \## 36. Performance, disponibilité et évolutivité

-   Pagination côté serveur pour les listes volumineuses.

-   Indexation des champs de recherche et des clés de tenant.

-   Cache uniquement lorsque la cohérence et l'isolation sont garanties.

-   Traitement asynchrone des exports, PDF et calculs lourds.

-   Suivi des temps de réponse et des erreurs.

-   Tests de charge avec plusieurs établissements et utilisateurs
    simultanés.

-   Capacité à augmenter les ressources et à séparer certains services
    si la charge augmente. Les seuils précis de performance et de
    disponibilité doivent être fixés après estimation du nombre
    d'établissements, d'élèves, de connexions simultanées et du budget
    d'hébergement. \## 37. Application Desktop et mode hors ligne

-   L'application Desktop doit offrir les fonctionnalités autorisées de
    la version Web.

-   Les mises à jour doivent être signées, contrôlées et distribuées de
    manière sécurisée.

-   Par défaut, les opérations sont synchronisées avec le serveur
    central.

-   Si un mode hors ligne est retenu, définir précisément les fonctions
    utilisables sans Internet.

-   Les données locales doivent être chiffrées et liées à l'utilisateur
    et à l'établissement.

-   Les conflits de synchronisation doivent être détectés et présentés ;
    aucune écrasement silencieux.

-   Les paiements, publications de bulletins et opérations sensibles
    peuvent être interdites hors ligne jusqu'à synchronisation. Le mode
    hors ligne avancé est une fonctionnalité distincte à estimer. Il ne
    doit pas être considéré comme acquis par la simple création d'une
    application Desktop. \## 38. API et intégrations externes

-   API documentée pour les opérations autorisées.

-   Authentification et contrôle tenant pour chaque requête.

-   Limitation de débit et journalisation des accès.

-   Intégrations possibles : e-mail, SMS, paiement, stockage et export.

-   Clés d'API gérées côté serveur, jamais exposées dans le code client.

-   Webhooks sécurisés pour notifier des événements si nécessaire.

-   Gestion des erreurs, délais d'attente et nouvelles tentatives.
    \## 39. Journalisation, audit et traçabilité

-   Journaliser connexion, échec, changement de rôle et changement
    d'affiliation.

-   Journaliser création, modification, suppression logique et export de
    données sensibles.

-   Pour les notes : conserver valeur précédente, nouvelle valeur,
    auteur, date et motif si requis.

-   Pour les paiements : conserver les opérations initiales et
    correctives sans effacement silencieux.

-   Pour les bulletins : conserver les états brouillon, validé, publié
    et remplacé.

-   Pour les actions du support : enregistrer le motif, la durée et le
    périmètre d'accès.

-   Protéger les journaux contre la modification par les utilisateurs
    ordinaires. \## 40. Tests et assurance qualité Type de test Objectif
    Tests unitaires Vérifier les fonctions isolées : calculs, règles de
    validation et permissions. Tests d'intégration Vérifier les échanges
    API, base, stockage, files et services externes. Tests multi-tenant
    Confirmer l'impossibilité d'accès croisé entre établissements. Tests
    fonctionnels Valider les parcours réels de chaque rôle. Tests
    d'interface Vérifier affichage, formulaires, responsive et
    accessibilité de base. Tests de charge Évaluer la tenue avec
    plusieurs établissements et utilisateurs simultanés. Tests de
    sécurité Contrôler authentification, autorisation, fichiers, API et
    vulnérabilités courantes. Tests de sauvegarde Restaurer les données
    et vérifier leur cohérence. Tests de non-régression Vérifier qu'une
    évolution ne casse pas les fonctions existantes. \## 41. Critères de
    recette et acceptation \## 28. Deux établissements de test peuvent
    être créés et configurés indépendamment. \## 29. Un utilisateur d'un
    établissement ne peut accéder à aucune donnée d'un autre
    établissement, même en modifiant les identifiants d'URL ou d'API.
    \## 30. Les rôles et permissions sont appliqués côté serveur.
    \## 31. Un élève peut être inscrit, réinscrit, transféré et retrouvé
    dans son historique. \## 32. Un enseignant ne peut saisir des notes
    que dans les classes et matières autorisées. \## 33. Les moyennes
    calculées correspondent aux exemples de référence validés par
    l'établissement. \## 34. Les bulletins incomplets sont bloqués ou
    clairement marqués non définitifs. \## 35. Un planning publié
    respecte toutes les contraintes obligatoires. \## 36. Les paiements
    mettent à jour les soldes et les reçus sont uniques. \## 37. Les
    parents ne voient que les enfants auxquels ils sont associés.
    \## 38. Les exports et documents respectent les permissions et le
    tenant. \## 39. Une sauvegarde peut être restaurée selon la
    procédure documentée. \## 40. Les fonctionnalités convenues sont
    testées sur Web et Desktop. La recette est prononcée après
    correction des anomalies bloquantes et majeures, validation des
    scénarios essentiels et signature d'un procès-verbal par les
    représentants désignés. \## 42. Déploiement et mise en production
    \## 41. Préparer les environnements et secrets de production.

## 42. Configurer domaine, HTTPS, base de données, stockage et sauvegardes.

## 43. Déployer une version de préproduction et effectuer les tests de recette.

## 44. Créer les premiers tenants et administrateurs.

## 45. Importer les données pilotes après nettoyage et validation.

## 46. Former les utilisateurs clés.

## 47. Mettre en production progressivement avec surveillance renforcée.

## 48. Prévoir un plan de retour arrière en cas d'échec de déploiement.

## \## 43. Formation et documentation

## Guide administrateur plateforme.

## Guide de création et paramétrage d'un établissement.

## Guide direction et administration scolaire.

## Guide enseignant : emploi du temps, appel, notes et appréciations.

## Guide comptable : frais, paiements, reçus et clôture.

## Guide parent et élève.

## Documentation technique : architecture, installation, configuration, API, migrations et sauvegardes.

Procédure de support et traitement des incidents. \## 44. Planning et
lots de réalisation Lot Contenu Dépendances / sortie attendue Lot 0 ---
Cadrage Ateliers métier, règles de calcul, maquettes, validation du
périmètre. Spécifications validées. Lot 1 --- Socle SaaS Tenants,
isolation, authentification, rôles, abonnements de base. Deux écoles
isolées testées. Lot 2 --- Référentiels Établissement, année, périodes,
niveaux, classes, matières, salles. Référentiels opérationnels. Lot 3
--- Scolarité Élèves, parents, inscriptions, enseignants et
affectations. Dossiers complets. Lot 4 --- Pédagogie Évaluations, notes,
calculs, bulletins et examens. Cycle pédagogique validé. Lot 5 ---
Planning Contraintes et génération d'emploi du temps. Planning sans
conflit obligatoire. Lot 6 --- Vie scolaire Présences, retards,
discipline et cahier de textes. Suivi quotidien. Lot 7 --- Finance
Frais, paiements, reçus, soldes et rapports. Encaissements contrôlés.
Lot 8 --- Portails Parents, élèves, annonces et notifications.
Consultation sécurisée. Lot 9 --- Desktop et qualité Packaging, tests,
sauvegarde, performance et déploiement. Version prête à réception. Le
calendrier détaillé, les charges et le budget seront établis après
estimation technique et validation des priorités. Il est recommandé de
livrer une première version utilisable avant d'ajouter les modules
optionnels. \## 45. Livrables - Cahier des charges validé et registre
des décisions. - Maquettes UI/UX et guide de design. - Diagrammes UML et
parcours utilisateurs. - Architecture technique et modèle de données. -
Code source frontend, backend et Desktop. - Scripts de base de données,
migrations et données de démonstration. - Documentation API et
documentation d'exploitation. - Tests automatisés et procès-verbaux de
recette. - Guides utilisateurs et supports de formation. - Procédures de
sauvegarde, restauration, déploiement et support.

## 46. Risques et mesures de réduction

Risque Conséquence Mesure de réduction Fuite entre établissements
Atteinte à la confidentialité et perte de confiance. Isolation conçue
dès le départ, tests automatisés et audit. Règles scolaires mal définies
Calculs et bulletins contestés. Ateliers métier et exemples de calcul
validés. Générateur d'horaires irréalisable Planning incomplet ou faux.
Distinguer contraintes dures et souples, rapport de conflits. Données
importées de mauvaise qualité Doublons et erreurs historiques.
Prévisualisation, validation et rapport d'import. Connexion Internet
instable Interruption du travail. Optimiser les échanges et cadrer le
mode hors ligne séparément. Périmètre trop large Retards et dépassement
du budget. Prioriser les lots et formaliser les demandes d'évolution.
Sauvegarde non restaurable Perte de données. Tests de restauration
réguliers. Dépendance à un fournisseur Indisponibilité d'un service
externe. Prévoir alternatives, contrats et gestion des erreurs. \## 47.
Évolutions futures - Application mobile Android et iOS. - Paiement en
ligne et rapprochement automatique. - Gestion avancée des ressources
humaines et de la paie. - Comptabilité générale et gestion budgétaire. -
Plateforme pédagogique : devoirs, cours, ressources et évaluations en
ligne. - Signature électronique et vérification des documents. -
Multi-campus au sein d'un même établissement. - Mode hors ligne avancé
avec synchronisation. - Analyses prédictives d'accompagnement scolaire,
avec transparence et validation humaine. \## 48. Hypothèses, décisions à
valider et conclusion \### 48.1 Décisions à confirmer avant le
développement Décision Choix à confirmer Pays et cadre juridique Pays
d'hébergement, règles de protection des données et obligations
applicables. Langues Français seul au lancement ou interface
multilingue, notamment malagasy. Devise et paiements Devise, moyens de
paiement, reçus et règles de caisse. Notation Barèmes, coefficients,
arrondis, absences et formules par niveau. Périodes Trimestres,
semestres ou calendrier propre à chaque établissement. Abonnements
Offres, limites, tarification, période d'essai et politique de
suspension. Hébergement Fournisseur, localisation, sauvegarde,
disponibilité et budget. Desktop Simple client connecté ou véritable
mode hors ligne. Volume cible Nombre d'établissements, élèves,
utilisateurs simultanés et stockage. Périmètre initial Modules
obligatoires pour la première version et modules différés. \### 48.2
Conclusion Ce cahier des charges constitue une base détaillée pour
développer une plateforme SaaS de gestion scolaire multi-
établissements. Le point structurant du projet est l'isolation stricte
des données de chaque école, complétée par une gestion précise des
rôles, des règles métier, des historiques et des validations. Avant le
démarrage du développement, le porteur du projet doit organiser des
ateliers avec au moins un représentant de la direction, un enseignant,
un responsable administratif et un comptable d'établissement pilote. Les
règles de notation, de bulletin, de paiement et d'emploi du temps
doivent être validées à partir de cas réels. Le présent document devra
être complété par les maquettes, diagrammes UML, schéma relationnel
détaillé et spécifications API. Ces documents constitueront le dossier
de conception technique de référence.

## ANNEXE A --- EXEMPLES DE SCÉNARIOS MÉTIER

### A.1 Création d'un établissement

## 49. L'administrateur plateforme crée l'établissement et son identifiant de tenant.

## 50. Le responsable reçoit une invitation et active son compte.

## 51. Il paramètre l'année, les niveaux, les classes et les matières.

## 52. Il crée les utilisateurs et importe les élèves.

## 53. Il vérifie le tableau de bord et ouvre l'année scolaire.

### A.2 Saisie des notes et génération d'un bulletin

## 54. L'enseignant ouvre une évaluation de sa matière et de sa classe.

## 55. Il saisit les notes et enregistre le brouillon.

## 56. Le système contrôle le barème et signale les notes manquantes.

## 57. L'enseignant valide la saisie selon ses droits.

## 58. À la clôture de la période, le système calcule les moyennes.

## 59. L'administration contrôle les bulletins incomplets, valide et publie les bulletins.

## 60. Les parents et élèves consultent uniquement les bulletins publiés.

### A.3 Génération d'emploi du temps

## 61. L'administration définit les créneaux et les contraintes.

## 62. Elle affecte enseignants, matières, classes et salles.

## 63. Le système vérifie les données et signale les éléments manquants.

## 64. Le moteur génère une proposition et affiche les conflits éventuels.

## 65. L'administration ajuste, relance les contrôles et valide.

## 66. La version validée est publiée aux personnes concernées.

### A.4 Paiement scolaire

## 67. Le comptable ouvre le dossier d'un élève.

## 68. Il sélectionne l'échéance et enregistre le montant reçu.

## 69. Le système vérifie le montant et la référence.

## 70. Une transaction est enregistrée et un reçu unique est généré.

## 71. Le solde est mis à jour et l'opération apparaît dans le journal de caisse.

## \## ANNEXE B --- PRINCIPES NON NÉGOCIABLES

## L'isolation des données entre établissements est obligatoire, non optionnelle.

## Les contrôles de sécurité sont exécutés côté serveur.

## Les calculs de notes et de bulletins reposent sur des règles validées et versionnées.

## Un planning ne peut être publié comme valide s'il viole une contrainte obligatoire.

## Les opérations financières et corrections de notes sont traçables.

## Les bulletins et informations personnelles ne sont visibles qu'aux utilisateurs autorisés.

## Les sauvegardes doivent être restaurables et testées.

Les modules optionnels et évolutions ne doivent pas compromettre la
stabilité du socle. \## ANNEXE C --- VALIDATION Partie prenante Nom et
fonction Signature Date Représentant de l'éditeur / porteur du produit
Représentant d'un établissement pilote Responsable technique Responsable
métier / pédagogique
