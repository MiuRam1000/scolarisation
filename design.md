# Scolia — Design

## Direction
Prototype Web responsive de gestion scolaire multi-établissements, en français. La référence fournie inspire la palette ivoire / charbon / jaune doux, la typographie ample et les panneaux aérés. Aucun contenu de la référence n’est copié.

## Identité
Nom fictif : Scolia. Signature : Faire grandir, ensemble.
Police titres : Poppins 500–600. Corps : Manrope 400–800, fonts locales dans packages/web/public/fonts.
Fond #f7f7f2 ; panneaux #ffffff ; texte #252821 ; secondaire #77806c ; traits #e9ebe2 ; citron #e9ef8a ; jaune #f4df87 ; vert #466d58. Violet, bleu et orange seulement comme codes de matières.

## Layout
Sidebar ivoire 244px, en-tête blanc 78px, barre de démonstration discrète. Contenu centré et espacé de 34px. Dashboard asymétrique 1,75:1, bandeau jaune illustré, statistiques sobres à séparateurs. Panneaux rayon 16px, boutons rayon 7px, badges doux et avatars à initiales.

## Écrans
Dashboard ; élèves et inscriptions ; parents ; classes ; enseignants ; matières ; planning ; cahier de textes ; notes ; bulletins ; examens ; appel ; suivi éducatif ; paiements ; frais ; caisse ; communication ; documents ; bibliothèque ; transport ; paramètres ; années ; salles ; permissions ; imports ; audit ; établissements ; abonnements ; support ; services ; connexion ; portail familial.

## Parcours
Inscription avec champs obligatoires → dossier → recherche → modification locale.
Notes 0–20 → brouillon → contrôle des manquants → validation/verrouillage → correction motivée.
Bulletins → aperçu de moyenne pondérée → validation → publication simulée.
Planning → proposition fictive → publication simulée, sans moteur d’optimisation.
Paiement fictif → référence unique locale → reçu imprimable sans transaction réelle.
Annonce → brouillon → publication locale, sans e-mail ou SMS.
CSV → prévalidation → rejet des lignes incorrectes → insertion locale.

## Interaction & accessibilité
Huit profils visuels : direction, administration, enseignant, surveillant, comptable, parent, élève, plateforme SaaS. Sélecteur en haut de l’interface. Dialogues natifs, focus contenu, restauration du focus, fermeture Échap, champs libellés, confirmations des actions sensibles et exports CSV. États vides et erreurs d’import explicites.
Responsive sous 760px : menu escamotable, panneaux empilés, tables et planning défilables sans débordement de la page. Motion 160–350ms avec reduced-motion.

## Architecture
Web React dans le template Bun/Vite/Hono. Aucune API métier ni base de données modifiée. État et stockage local dans hooks/use-scolia-state.ts. Vues principales et secondaires séparées ; composants partagés dans components/scolia-ui.tsx ; fixtures dans lib/demo-data.ts. Client Desktop futur réutilisant l’interface, non livré.

## Vérification
Build, TypeScript et lint réussis. Tests Playwright sur 31 écrans desktop, 10 écrans mobile et parcours inscription, notes, bulletins, planning, paiement, communication, portail et import CSV.
