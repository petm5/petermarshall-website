import { fetchSortedMarkdownPosts } from '$lib/utils';
import { title, description, baseUrl } from '$lib/site.json';

export const prerender = true;

export const GET = async () => {
  const sortedPosts = await fetchSortedMarkdownPosts();

  const body = render(sortedPosts);
  const options = {
    headers: {
      'Content-Type': 'application/xml'
    }
  };

  return new Response(body, options);
}

const render = (posts) => `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${title}</title>
<description>${description}</description>
<link>${baseUrl}</link>
<atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
${posts
	.map(
		(post) => `<item>
<guid isPermaLink="true">${baseUrl}${post.path}</guid>
<title>${post.meta.title}</title>
<link>${baseUrl}${post.path}</link>
<pubDate>${new Date(post.meta.date).toUTCString()}</pubDate>
</item>`
	)
	.join('')}
</channel>
</rss>
`;
