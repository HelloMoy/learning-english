import { openLocalDatabase } from "../local-database/local-database";
import { SEED_LEARNER, seedLearner } from "./seed-learner";

async function main(): Promise<void> {
  await seedLearner(openLocalDatabase());
  console.log(`Seeded ${SEED_LEARNER.email} / ${SEED_LEARNER.password}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
