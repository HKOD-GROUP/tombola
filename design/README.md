# Visuels Tombola (sources, non déployées)

Les images affichées sur le site sont hébergées sur Supabase Storage :
`https://alrapybsfqcnraeqmyhg.supabase.co/storage/v1/object/public/HkodFiles/tombola/{packs,lots,produits}/…`.
Les URL sont enregistrées en base (`tombola_packs.image_url`, `tombola_prizes.image_url`).
Pour changer une image, passer par le back-office (Lots, Stock & packs → envoyer une image).

- `images/` : les fichiers envoyés sur Supabase, plus les photos d'origine du client (`*.jpeg`).
- `rendu/` : sources des maquettes générées.
  - `keychain.html` et `cap.html` : porte-clés et casquette, dessinés en SVG avec le logo découpé.
  - `pack.py` : génère les compositions `pack-*.html`, à partir des PNG détourés `*-trim.png`.

  Rendu avec Chrome sans interface :
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --window-size=1600,1000 --screenshot=pack-80.png file://$PWD/pack-80.html`
