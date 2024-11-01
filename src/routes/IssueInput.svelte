<script lang="ts">
	import { Issue } from './schema.js';
  import { useCoState } from './jazz.js';

  type Props = {
    onDelete: () => void;
    issueId: Issue['id'];
  }

	let { onDelete, issueId }: Props = $props();
  const issue = useCoState(Issue, issueId);

  function updateTitle(e: Event & { currentTarget: HTMLInputElement }) {
    if (!issue.current) return;
    issue.current.title = e.currentTarget.value;
  }
</script>

{#if issue.current}
  <div>
    <input
      value={issue.current.title}
      oninput={updateTitle}
    />
    <p>{issue.current.description}</p>
    <p>{issue.current.estimate} points</p>
    <p>{issue.current.status}</p>
    <button onclick={onDelete}>Delete</button>
  </div>
{/if}