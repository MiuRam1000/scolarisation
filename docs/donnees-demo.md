# Données de démonstration

Un jeu de données complet est disponible dans la base locale `packages/web/.data/scolia.db`
sous l’établissement **Lycée Démo Scolia**. Il est isolé des autres établissements déjà présents.

## Commandes

Depuis `packages/web` :

```bash
bun run db:seed          # insère le jeu s’il n’existe pas encore
bun run db:seed:reset    # supprime puis recrée uniquement l’établissement de démo
```

Le script est idempotent : relancer `db:seed` sans `--reset` n’ajoute rien.

## Comptes de test

Tous les comptes utilisent le mot de passe **`Demo1234!`**.

| Email | Rôle | Accès principal à vérifier |
| --- | --- | --- |
| `direction@demo.scolia.local` | Direction | Tableau de bord, audit, tous les modules |
| `administration@demo.scolia.local` | Administration | Scolarité, documents, planning |
| `professeur@demo.scolia.local` | Enseignant | Classes, cahier de textes, notes, appels |
| `surveillant@demo.scolia.local` | Surveillant | Présences, discipline |
| `comptable@demo.scolia.local` | Comptable | Frais, paiements, reçus, clôture de caisse |
| `parent@demo.scolia.local` | Parent | Portail famille de Léa et Inès |
| `eleve@demo.scolia.local` | Élève | Portail élève de Léa |

## Contenu inséré

- 1 année scolaire `2026–2027`, 3 trimestres, 3 classes, 8 matières avec niveau et fichier de programme, 4 salles.
- 4 membres du personnel, 5 élèves, 4 responsables légaux et les liens famille.
- 10 évaluations, 16 notes, 5 bulletins **Publiés** et 1 bulletin **Brouillon**.
- 7 séances de planning (6 publiées, 1 validée en attente), sans conflit.
- Appels validés du jour, 3 incidents disciplinaires.
- 5 factures, 5 paiements (dont 1 annulé), 1 clôture de caisse.
- 4 annonces (dont 1 brouillon), notifications internes, 4 documents administratifs.
- 3 examens/conseils/délibérations, 6 séances de cahier de textes, 12 entrées d’audit.
- 3 pièces justificatives élèves stockées en base (petit PNG de démonstration).

## Parcours suggéré

1. Se connecter avec `direction@demo.scolia.local` / `Demo1234!`.
2. Ouvrir **Élèves** : 5 dossiers avec responsables, pièces et inscriptions.
3. Ouvrir **Matières & programmes** : chaque matière porte son niveau et un **fichier de programme** téléchargeable ; le formulaire permet d’importer ou de remplacer ce fichier (5 Mo maximum).
4. Ouvrir **Notes** et **Bulletins** : moyennes calculées, bulletins publiés imprimables.
5. Ouvrir **Planning** : emploi du temps publié et une séance en attente de publication.
6. Ouvrir **Finance** : factures, paiements, reçu annulé et clôture de caisse.
7. Se déconnecter puis se connecter avec `parent@demo.scolia.local` : portail famille limité à Léa et Inès.
8. Se connecter avec `eleve@demo.scolia.local` : bulletin publié et documents autorisés.
