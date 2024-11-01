import { createJazzApp } from '$lib/jazz/index.js';
import { IssueAccount } from './schema.js';

const Jazz = createJazzApp<IssueAccount>();
export const { useAccount, useCoState } = Jazz;
