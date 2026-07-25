import { config } from 'dotenv';
import { defineConfig } from "prisma/config";

config({ override: false });

const DATABASE_URL = process.env.DATABASE_URL;
console.log(DATABASE_URL);
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: DATABASE_URL,
  },
});
