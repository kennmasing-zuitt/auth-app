// Creates (or updates) one Admin and one User account from env vars.
// Run: npm run seed   (inside Docker: docker compose exec server npm run seed)
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { config } from "../config";
import { User, Role } from "../models/User";

type SeedUser = { email?: string; password?: string; firstName: string; lastName: string; role: Role };

const seeds: SeedUser[] = [
  {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    firstName: process.env.ADMIN_FIRST_NAME ?? "Admin",
    lastName: process.env.ADMIN_LAST_NAME ?? "User",
    role: "admin",
  },
  {
    email: process.env.USER_EMAIL,
    password: process.env.USER_PASSWORD,
    firstName: process.env.USER_FIRST_NAME ?? "Regular",
    lastName: process.env.USER_LAST_NAME ?? "User",
    role: "user",
  },
];

async function run() {
  await mongoose.connect(config.mongoUri);
  for (const s of seeds) {
    if (!s.email || !s.password) {
      console.warn(`Skipping ${s.role}: email/password env vars not set`);
      continue;
    }
    const hash = await bcrypt.hash(s.password, config.bcryptRounds);
    await User.findOneAndUpdate(
      { email: s.email.toLowerCase() },
      { email: s.email.toLowerCase(), password: hash, firstName: s.firstName, lastName: s.lastName, role: s.role },
      { upsert: true }
    );
    console.log(`Seeded ${s.role}: ${s.email}`);
  }
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
