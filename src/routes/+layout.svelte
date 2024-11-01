<script lang="ts">
	import { JazzProvider } from '$lib/jazz/index.js';
	import { usePasskeyAuth } from '$lib/jazz/auth/index.js';
	import { IssueAccount } from './schema.js';
	import Login from './Login.svelte';

	let { children } = $props();

	let auth = usePasskeyAuth({ appName: 'test' });

	$inspect(auth.state)
</script>

<Login state={auth.state} />

{#if auth.current}
	<JazzProvider
		auth={auth.current}
		schema={IssueAccount}
		peer="wss://cloud.jazz.tools/?key=jazz-svelte-example@otarie.studio"
	>
		{@render children?.()}
	</JazzProvider>
{/if}