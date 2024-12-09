<script lang="ts" generics="Acc extends Account">
	import { JAZZ_CTX, type JazzContext } from './jazz.svelte';
	import { untrack, setContext, type Snippet } from 'svelte';
	import { Account } from 'jazz-tools';
	import { createJazzBrowserContext } from 'jazz-browser';
	import type { AccountClass, AuthMethod } from 'jazz-tools';

	type Props = {
		children: Snippet;
		auth: AuthMethod | 'guest';
		peer: `wss://${string}` | `ws://${string}`;
		storage?: 'indexedDB' | 'singleTabOPFS';
		schema?: AccountClass<Acc>;
	};

	let {
		children,
		auth,
		peer,
		storage,
		schema = Account as unknown as AccountClass<Acc>
	}: Props = $props();

	const ctx = $state<JazzContext<Acc>>({ current: undefined });
	setContext<JazzContext<Acc>>(JAZZ_CTX, ctx);
	let sessionCount = $state(0);

	$effect(() => {
		schema;
		auth;
		peer;
		storage;
		sessionCount;
		return untrack(() => {
			if (!auth || !peer) return;

			const promiseWithDoneCallback = createJazzBrowserContext<Acc>(
				auth === 'guest'
					? {
							peer,
							storage
						}
					: {
							AccountSchema: schema,
							auth,
							peer,
							storage
						}
			).then(context => {
				ctx.current = {
					...context,
					logOut: () => {
						context.logOut();
						ctx.current = undefined;
						sessionCount = sessionCount + 1;
					}
				};
				return context.done;
			});
			return () => {
				void promiseWithDoneCallback.then(done => done());
			};
		});
	});
</script>

{#if ctx.current}
	{@render children?.()}
{/if}
