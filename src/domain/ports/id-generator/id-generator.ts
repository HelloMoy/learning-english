/**
 * Port: an identity generator the domain uses to mint new ids.
 *
 * Production implementation: `UuidIdGenerator` (UUIDv4).
 * Test implementation: `SequentialIdGenerator` (deterministic counter).
 *
 * The hexágono MUST NOT call `crypto.randomUUID()` directly; doing so would
 * couple id generation to the runtime and prevent deterministic tests.
 */
export interface IdGenerator {
  next(): string;
}
