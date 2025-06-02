<script>
	export let data;
</script>

{#if data.posts.length > 0}
<h1>Blog</h1>

<ul>
	{#each data.posts as post}
		<li>
			<h2>
				<a href={post.path}>
					{post.meta.title}
				</a>
			</h2>
			Published {post.meta.date}
		</li>
	{/each}
</ul>
{:else}
<h1>Nothing Here Yet...</h1>
<p>Looks like nothing was found. Please check back later.</p>
{/if}
