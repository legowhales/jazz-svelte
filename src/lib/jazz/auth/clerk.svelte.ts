import { BrowserClerkAuth, type MinimalClerkClient } from 'jazz-browser-auth-clerk';
import { box, type MaybeBoxOrGetter } from 'svelte-toolbelt';

export function useJazzClerkAuth(client: MaybeBoxOrGetter<MinimalClerkClient>) {
	let state = $state<{ errors: string[] }>({ errors: [] });
	let _client = box.from(client);
	let auth = $derived.by(() => {
		if (!_client.current.user) return;
		if (!_client.current.signOut) return console.log('no signOut function found');
		return new BrowserClerkAuth(
			{
				onError: (error) => {
					void _client.current.signOut();
					state = { ...state, errors: [...state.errors, error.toString()] };
				}
			},
			_client.current
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
