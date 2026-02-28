// Notes design conservées :
// - Hero banner : mettre en surbrillance dans le petit texte "autoconsommation collective" comme le mot "passait" + élargir la zone du sous-titre.
// - Card Consommer intelligemment : rajouter un troisième point.
// Packs :
//   - Mettre en valeur l'aspect économie dans les packs (actuellement peu explicite).
//   - Starter pack : maitrisez votre consommation.
//   - Family pack : Produire votre énergie / la revendre / consommer mieux.
//   - Confort pack : stockez votre production et intégrez une collectivité énergétique.
// Simulateur de projet :
//   - 75% du prix EDF.
//   - Facture ABE / EDF / combinée à préciser.
//   - Exemple : 100€/mois -> ABE 75€/mois -> 25€ économisés, dépendant de la localisation.
//   - Parler en économies annuelles plutôt que mensuelles, roi peu pertinent.
//   - Réintroduire l'idée d'économie solidaire.
// Offre : carport solaire avec batterie + prise connectée posée gratuitement, énergie à 75% du prix EDF,
// caution 875€, engagement 8 ans.

export default function ProfilePage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <section className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-neutral-900">Profil</h1>
        <p className="mt-3 text-neutral-600">
          Contenu de la page profil à définir. Les notes de conception sont
          conservées dans les commentaires du fichier pour référence.
        </p>
      </section>

      <section className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4 text-neutral-700">
        <p className="font-medium">Zone placeholder</p>
        <p className="text-sm">
          Remplacez ce contenu par la mise en page finale (hero, packs,
          simulateur, etc.).
        </p>
      </section>
    </main>
  );
}