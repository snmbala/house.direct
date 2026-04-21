import { Helmet } from 'react-helmet-async'

export default function SEOMeta({ title, description, image, jsonLd }) {
  const fullTitle = title ? `${title} — HouseNearby` : 'HouseNearby — Find Rentals Near You'
  const desc = description ?? 'Discover rental properties near you on a live map. Browse apartments, houses, PGs and villas across India. Contact landlords directly — no broker fees.'

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      {image && <meta property="og:image" content={image} />}
      {image && <meta name="twitter:image" content={image} />}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  )
}
