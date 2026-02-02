import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { imagetools } from 'vite-imagetools';

export default defineConfig({
	plugins: [
		sveltekit(),
		imagetools({
			defaultDirectives: (url) => {
				return new URLSearchParams({
					w: 800,
					format: 'avif',
					effort: 2,
					quality: 60
				})
			}
		})
	],
	build: {
		assetsInlineLimit: 0
	},
	define: {
		BUILD_DATE: Date.now()
	}
});
