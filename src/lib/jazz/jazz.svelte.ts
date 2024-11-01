import { box, type MaybeBoxOrGetter } from 'svelte-toolbelt';
import { untrack } from 'svelte';
import {
	consumeInviteLinkFromWindowLocation,
	type BrowserContext,
	type BrowserGuestContext
} from 'jazz-browser';
import { Account, createCoValueObservable } from 'jazz-tools';
import type {
	DepthsIn,
	DeeplyLoaded,
	CoValueClass,
	CoValue,
	ID,
	AnonymousJazzAgent
} from 'jazz-tools';
import { getContext } from 'svelte';

export const JAZZ_CTX = {};

export type JazzContext<Acc extends Account> = {
	current?: BrowserContext<Acc> | BrowserGuestContext;
};

export function getJazzContext<Acc extends Account>() {
	return getContext<JazzContext<Acc>>(JAZZ_CTX);
}

export function createJazzApp<Acc extends Account>() {
	// useAccount
	function useAccount(): { me: Acc | undefined; logOut: () => void };
	function useAccount<D extends DepthsIn<Acc>>(
		depth: MaybeBoxOrGetter<D>
	): { me: DeeplyLoaded<Acc, D> | undefined; logOut: () => void };
	function useAccount<D extends DepthsIn<Acc>>(
		depth?: MaybeBoxOrGetter<D>
	): { me: Acc | DeeplyLoaded<Acc, D> | undefined; logOut: () => void } {
		const ctx = getJazzContext<Acc>();
		if (!ctx.current) {
			throw new Error('useAccount must be used within a JazzProvider');
		}
		if (!('me' in ctx.current)) {
			throw new Error(
				"useAccount can't be used in a JazzProvider with auth === 'guest' - consider using useAccountOrGuest()"
			);
		}
		const me = useCoState<Acc, D>(
			ctx.current.me.constructor as CoValueClass<Acc>,
			() => (ctx.current as BrowserContext<Acc>).me?.id,
			depth
		);
		return {
			get me() {
				if (!ctx.current || !('me' in ctx.current)) return;
				return depth === undefined ? me.current || ctx.current.me : me.current;
			},
			logOut() {
				return ctx.current?.logOut();
			}
		};
	}
	// useAccountOrGuest
	function useAccountOrGuest(): { me: Acc | AnonymousJazzAgent };
	function useAccountOrGuest<D extends DepthsIn<Acc>>(
		depth: MaybeBoxOrGetter<D>
	): { me: DeeplyLoaded<Acc, D> | undefined | AnonymousJazzAgent };
	function useAccountOrGuest<D extends DepthsIn<Acc>>(
		depth?: MaybeBoxOrGetter<D>
	): { me: Acc | DeeplyLoaded<Acc, D> | undefined | AnonymousJazzAgent } {
		const ctx = getJazzContext<Acc>();

		if (!ctx.current) {
			throw new Error('useAccountOrGuest must be used within a JazzProvider');
		}

		const contextMe = 'me' in ctx.current ? ctx.current.me : undefined;

		const me = useCoState<Acc, D>(
			contextMe?.constructor as CoValueClass<Acc>,
			contextMe?.id,
			depth
		);

		if ('me' in ctx.current) {
			return {
				get me() {
					return depth === undefined ? me.current || (ctx.current as BrowserContext<Acc>)?.me : me.current;
				}
			};
		} else {
			return { 
				get me() {
					return (ctx.current as BrowserGuestContext)?.guest;
				}
			};
		}
	}
	// UseCoState
	function useCoState<V extends CoValue, D>(
		Schema: CoValueClass<V>,
		id: MaybeBoxOrGetter<ID<V>> | undefined,
		depth: MaybeBoxOrGetter<D & DepthsIn<V>> = [] as D & DepthsIn<V>
	): {
		current?: DeeplyLoaded<V, D>;
	} {
		const ctx = getJazzContext<Acc>();
		const _id = box.from(id);
		const _depth = box.from(depth);
		let state = $state.raw<DeeplyLoaded<V, D> | undefined>();
		let observable = createCoValueObservable();

		$effect(() => {
			ctx.current;
			_id.current;
			_depth.current;
			return untrack(() => {
				if (!_id.current || !ctx.current) return;
				return observable.subscribe(
					Schema,
					_id.current,
					'me' in ctx.current ? ctx.current.me : ctx.current.guest,
					_depth.current,
					() => {
						state = observable.getCurrentValue();
					}
				);
			});
		});
		return {
			get current() {
				return state;
			}
		};
	}
	// useAcceptInvite
	function useAcceptInvite<V extends CoValue>({
		invitedObjectSchema,
		onAccept,
		forValueHint
	}: {
		invitedObjectSchema: CoValueClass<V>;
		onAccept: MaybeBoxOrGetter<(projectID: ID<V>) => void>;
		forValueHint?: string;
	}): void {
		const ctx = getJazzContext<Acc>();
		const _onAccept = box.from(onAccept);

		if (!ctx.current) {
			throw new Error('useAcceptInvite must be used within a JazzProvider');
		}

		if (!('me' in ctx.current)) {
			throw new Error("useAcceptInvite can't be used in a JazzProvider with auth === 'guest'.");
		}

		$effect(() => {
			_onAccept.current;
			untrack(() => {
				if (!ctx.current) return;

				const result = consumeInviteLinkFromWindowLocation({
					as: (ctx.current as BrowserContext<Acc>).me,
					invitedObjectSchema,
					forValueHint
				});

				result
					.then(result => result && _onAccept.current?.(result?.valueID))
					.catch(e => {
						console.error('Failed to accept invite', e);
					});
			});
		});
	}

	return {
		useAccount,
		useAccountOrGuest,
		useCoState,
		useAcceptInvite
	};
}