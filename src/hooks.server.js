import { minify } from 'html-minifier-terser'
import { dev } from '$app/environment'

const minification_options = {
  collapseWhitespace: true,
  collapseInlineTagWhitespace: true,
  removeComments: true,
  ignoreCustomComments: [/^#/],
  minifyCSS: true,
  minifyJS: true,
  sortAttributes: true,
  sortClassName: true
}

export async function handle({ event, resolve }) {
  if (dev) return await resolve(event, {})

  const response = await resolve(event, {
    transformPageChunk: ({ html }) => minify(html, minification_options)
  })

  return response
}
