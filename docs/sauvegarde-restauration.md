# Sauvegarde et restauration — Scolia

Cette procédure couvre le §35 du cahier des charges : sauvegardes restaurables et régulièrement testées.

## Fichiers concernés

- Base locale : `packages/web/.data/scolia.db` (ou la cible de `DATABASE_URL` lorsqu’elle utilise `file:`).
- Sauvegardes : `packages/web/backups/` par défaut, ou le dossier passé en argument.
- Scripts : `packages/web/scripts/db-backup.ts`, `db-restore.ts`, `db-verify.ts`.
- Les fichiers `.db` et le dossier `backups/` sont ignorés par Git : une sauvegarde ne doit jamais être poussée dans le dépôt.

## Créer une sauvegarde

Depuis `packages/web` :

```bash
bun run db:backup
```

Le script :

1. vérifie l’intégrité de la base source (`PRAGMA integrity_check`) ;
2. crée une copie compacte et cohérente avec `VACUUM INTO` ;
3. nomme le fichier `scolia-AAAAMMJJTHHMMSS.db`.

Le serveur peut rester démarré : `VACUUM INTO` produit un instantané cohérent.

Pour choisir un autre dossier :

```bash
bun run db:backup D:/sauvegardes/scolia
```

## Tester une sauvegarde sans risque

```bash
bun run db:verify-restore
# ou
bun run db:verify-restore backups/scolia-20261118T123222.db
```

Le script copie la sauvegarde dans un dossier temporaire, contrôle l’intégrité, vérifie la présence des tables clés (`establishments`, `users`, `students`, `classes`, `payments`, `announcements`, `administrative_documents`) et affiche quelques compteurs. La base active n’est pas modifiée.

Sous Windows, la copie temporaire peut rester verrouillée quelques secondes après le contrôle ; le message l’indique sans faire échouer la vérification.

## Restaurer une sauvegarde

> **Arrêter le serveur** (`bun run dev` ou le processus de production) avant toute restauration.

```bash
bun scripts/db-restore.ts backups/scolia-20261118T123222.db
```

Le script :

1. vérifie l’intégrité et la présence des tables obligatoires ;
2. crée automatiquement une sauvegarde de sécurité de la base actuelle dans `backups/avant-restauration-…db` ;
3. remplace la base cible et supprime les fichiers `-wal` / `-shm` résiduels ;
4. vérifie l’intégrité de la base restaurée.

Pour ignorer la sauvegarde de sécurité (uniquement sur une base de test) :

```bash
bun scripts/db-restore.ts ma-sauvegarde.db --force
```

## Procédure d’incident

1. Arrêter l’application.
2. Conserver la base défaillante (`scolia.db`, fichiers `-wal` et `-shm`) dans un dossier d’archive.
3. Restaurer la dernière sauvegarde vérifiée.
4. Démarrer l’application et exécuter `bun run db:verify-restore` sur une copie de la base restaurée.
5. Vérifier la connexion, la liste des élèves, un bulletin publié, un paiement et un document administratif.
6. Journaliser l’incident (date, cause, sauvegarde utilisée, durée) et informer la direction.

## Bonnes pratiques

- Sauvegarde quotidienne avant l’ouverture et après les opérations de masse.
- Conservation recommandée : 30 sauvegardes quotidiennes, 12 hebdomadaires, 12 mensuelles.
- Stocker au moins une copie hors de la machine de production, avec accès restreint.
- Tester une restauration au moins une fois par mois et après chaque montée de version du schéma.
- Ne jamais restaurer une sauvegarde sans avoir vérifié son intégrité ni sauvegardé la base actuelle.
- En production Turso, utiliser les sauvegardes/points de restauration fournis par la plateforme et conserver cette procédure pour les exports locaux.
