/**
 * A way the learner can sign in to their account.
 *
 * @remarks
 * `password` is Better Auth's `credential` provider, named here for what it
 * means to a learner rather than for how it is stored.
 *
 * @category Auth
 */
export type SignInMethod = "password" | "google";

/**
 * Who the signed-in learner is to their account, as opposed to on their
 * learner card.
 *
 * @remarks
 * Plain, serializable data — it crosses the server/client boundary as a prop,
 * which is why it lives here rather than beside the server-only read that
 * produces it (`currentAccount`).
 *
 * The name is the one the account was created with — typed on the sign-up
 * form, or supplied by Google — and is only ever read. The learner card keeps
 * its own name.
 *
 * @category Auth
 */
export type LearnerAccountIdentity = {
  /** The account's name, or `""` when it carries none. */
  name: string;
  email: string;
  /** Every way this account can sign in, `password` before `google`. */
  signInMethods: ReadonlyArray<SignInMethod>;
};
