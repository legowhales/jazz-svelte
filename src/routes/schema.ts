import { CoMap, CoList, co, Account, Profile } from 'jazz-tools';

export class Issue extends CoMap {
	title = co.string;
	description = co.string;
	estimate = co.number;
	status = co.literal('backlog', 'in progress', 'done');
}
export class ListOfIssues extends CoList.Of(co.ref(Issue)) {}

export class IssueAccountRoot extends CoMap {
	issues = co.ref(ListOfIssues);
}

export class IssueAccount extends Account {
	profile = co.ref(Profile);
	root = co.ref(IssueAccountRoot);

	/** The account migration is run on account creation and on every log-in.
	 *  You can use it to set up the account root and any other initial CoValues you need.
	 */
	migrate(this: IssueAccount, creationProps?: { name: string }) {
		super.migrate(creationProps);
		if (!this._refs.root) {
			console.log('Creating root issues');
			this.root = IssueAccountRoot.create(
				{
					issues: ListOfIssues.create([], { owner: this })
				},
				{ owner: this }
			);
		}
	}
}