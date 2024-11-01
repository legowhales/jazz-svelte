<script lang="ts">
	import { Issue } from './schema.js';
	import { useAccount } from './jazz.js';
	import IssueInput from './IssueInput.svelte';

	const app = useAccount({
		root: {
			issues: []
		}
	});

	function newIssue() {
		if (!app.me) return console.log('Not logged in');

		const newIssue = Issue.create(
			{
				title: 'Test issue',
				description: "Make sure it's big enough for 10 snails.",
				estimate: 5,
				status: 'backlog'
			},
			{ owner: app.me }
		);
		app.me.root.issues?.push(newIssue);
	}

	function deleteIssue(id: Issue['id']) {
		const found = app.me?.root.issues?.findIndex(
			(issue) => issue?.id === id
		);
		if (found !== undefined && found > -1) app.me?.root.issues?.splice(found, 1);
	}
</script>

<section>
	<button class="btn" onclick={newIssue}>New issue</button>
	<div class="list">
		{#each app.me?.root.issues._refs || [] as { id } (id)}
			<IssueInput issueId={id} onDelete={() => deleteIssue(id)} />
		{/each}
	</div>
</section>


<style>
	section {
		padding-top: 4rem;
		max-width: 480px;
		margin: 0 auto;
	}
	.list {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		margin-top: 2rem;
	}
</style>
