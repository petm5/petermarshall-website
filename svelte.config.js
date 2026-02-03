import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			strict: false
		})
	},
	extensions: ['.svelte', '.md'],

	preprocess: [
		vitePreprocess({ script: true }),
		mdsvex({
			extensions: ['.md']
		})
	]
};

export default config;
