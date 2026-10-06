import { execFileSync } from "node:child_process";
import { hashPassword } from "../src/utils/crypto.js";

const name = prompt("Admin name: ")?.trim();
const email = prompt("Admin email: ")?.trim().toLowerCase();
const password = prompt("Admin password: ");

if (!name || !email || !password) {
  console.error("Name, email and password are required.");
  process.exit(1);
}

const passwordHash = await hashPassword(password);

const escapeSql = (value) =>
  value.replaceAll("'", "''");

const sql = `
INSERT INTO users (
  name,
  email,
  password_hash,
  role
)
VALUES (
  '${escapeSql(name)}',
  '${escapeSql(email)}',
  '${escapeSql(passwordHash)}',
  'admin'
);
`;

execFileSync(
  "bunx",
  [
    "wrangler",
    "d1",
    "execute",
    "tnp-db",
    "--local",
    "--command",
    sql,
  ],
  {
    stdio: "inherit",
  }
);

console.log("Admin account created successfully.");
