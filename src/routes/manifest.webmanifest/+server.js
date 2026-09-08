import { title, tagline } from '$lib/site.json'

import icon_192 from '$lib/assets/app-icon.png?w=192&format=avif&quality=90'
import icon_512 from '$lib/assets/app-icon.png?w=512&format=avif&quality=90'
import icon_maskable_192 from '$lib/assets/app-icon-maskable.png?w=192&format=avif&quality=90'
import icon_maskable_512 from '$lib/assets/app-icon-maskable.png?w=512&format=avif&quality=90'

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
  start_url: '/',
  icons: [
    {
      src: icon_192,
      purpose: "any",
      sizes: "192x192",
      type: "image/avif"
    },
    {
      src: icon_512,
      purpose: "any",
      sizes: "512x512",
      type: "image/avif"
    },
    {
      src: icon_maskable_192,
      purpose: "maskable",
      sizes: "192x192",
      type: "image/avif"
    },
    {
      src: icon_maskable_512,
      purpose: "maskable",
      sizes: "512x512",
      type: "image/avif"
    }
  ],
  display: "minimal-ui"
}

const render = () => JSON.stringify(manifest)
