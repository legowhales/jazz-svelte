import { BrowserClerkAuth, type MinimalClerkClient } from 'jazz-browser-auth-clerk';
import { box, type MaybeBoxOrGetter } from 'svelte-toolbelt';
import { untrack } from 'svelte';

export function useJazzClerkAuth(
	client: MaybeBoxOrGetter<
		MinimalClerkClient & {
			signOut: () => Promise<unknown>;
		}
	>
) {
	let state = $state<{ errors: string[] }>({ errors: [] });
	let _client = box.from(client);

	let auth = $derived.by(() => {
		_client.current.user;

		return untrack(
			() =>
				new BrowserClerkAuth(
					{
						onError: (error) => {
							void _client.current.signOut?.();
							state = { ...state, errors: [...state.errors, error.toString()] };
						}
					},
					_client.current
				)
		);
	});

	return {
		get current() {
			return auth;
		},
		get state() {
			return state;
		}
	};
}
