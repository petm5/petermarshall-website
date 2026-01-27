import { title, tagline } from '$lib/site.json'

import icon_192 from '$lib/assets/app-icon.png?w=192&format=png'
import icon_512 from '$lib/assets/app-icon.png?w=512&format=png'

export const prerender = true

export const GET = async () => {
  const body = render()
  const options = {
    headers: {
      'Content-Type': 'manifest/webmanifest'
    }
  };

  return new Response(body, options)
}

const manifest = {
  name: title,
  description: tagline,
  icons: [
    {
      src: icon_192,
      sizes: "192x192",
      type: "image/png"
    },
    {
      src: icon_512,
      sizes: "512x512",
      type: "image/png"
    }
    ],
  display: "minimal-ui"
}

const render = () => JSON.stringify(manifest)
