# Site de Sam Cuisine

## Changer un prix, un plat, les horaires ou les infos

Tout se trouve dans **un seul fichier : `carte.txt`** :
- en haut, la partie `== INFOS` : message d'annonce, téléphone, villes livrées, paiement, nombre d'avis…
- au milieu, la carte ;
- en bas, les horaires.

1. Ouvrez le fichier **carte.txt** (dans la liste ci-dessus).
2. Appuyez sur le **crayon** ✏️ (en haut à droite du fichier).
3. Modifiez le texte. Par exemple, pour changer un prix :
   `Sam Vegas | 12,50 €` → `Sam Vegas | 13 €`
4. Appuyez sur **Commit changes…**, puis encore sur **Commit changes**.

Le site se met à jour tout seul en quelques minutes.

## Les règles du fichier

| Ce que vous écrivez | Ce que ça fait |
|---|---|
| `== Burgers` | un onglet de la carte |
| `-- Classic` | un bloc dans l'onglet |
| `-- Hors carte \| les nouveautés` | un bloc avec un petit texte rouge |
| `Sam Vegas \| 12,50 € \| Pain brioché… \| nouveau` | un plat : nom, prix, description, étiquette « Nouveau » |
| `Tenders maison \| x3 5 € ; x6 8 €` | un plat vendu par quantité |
| `note: Boisson +2 €.` | une petite phrase |
| `tags: Coca, Fanta, Perrier` | une liste d'étiquettes |
| `Mardi \| 11h30 – 14h30 · 18h – 22h30` | les horaires (dans la partie `== HORAIRES`) |

- Pour **retirer un plat** : supprimez sa ligne.
- Pour **ajouter un plat** : copiez une ligne existante et changez-la.
- Un jour fermé : écrivez `Lundi | Fermé`.
- Le badge « Ouvert / Fermé » du site se calcule tout seul avec les horaires.
- **Annonce** (fermeture exceptionnelle, promo…) : écrivez votre message après `annonce:`. Il s'affiche en jaune en haut du site. Pour l'enlever, effacez le texte (gardez `annonce:`).
- Dans la partie INFOS, ne changez que ce qui est **après les deux-points**.

Les photos, les couleurs et la mise en page ne se changent pas ici : demandez à Titouan.

**Ne touchez pas aux autres fichiers.** En cas de doute, demandez à Titouan.
