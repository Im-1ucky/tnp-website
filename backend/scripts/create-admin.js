import { execFileSync } from "node:child_process";
import { hashPassword } from "../src/utils/crypto.js";

const remote = process.argv.includes("--remote");
const target = remote ? "--remote" : "--local";

console.log(
  `Creating admin in ${remote ? "PRODUCTION" : "LOCAL"} D1 database`
);

const name = prompt("Admin name: ")?.trim();
const email = prompt("Admin email: ")?.trim().toLowerCase();
const password = prompt("Admin password: ");

if (!name || !email || !password) {
  console.error("Name, email and password are required.");
  process.exit(1);
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Enter a valid email address.");
  process.exit(1);
}

if (password.length < 12) {
  console.error("Use a password with at least 12 characters.");
  process.exit(1);
}

const passwordHash = await hashPassword(password);

const sqlLiteral = (value) => `'${value.replaceAll("'", "''")}'`;

const sql = `
INSERT INTO users (name, email, password_hash, role)
VALUES (
  ${sqlLiteral(name)},
  ${sqlLiteral(email)},
  ${sqlLiteral(passwordHash)},
  'admin'
);
`;

try {
  execFileSync(
    "bunx",
    [
      "wrangler",
      "d1",
      "execute",
      "tnp-db",
      target,
      "--command",
      sql,
    ],
    { stdio: "inherit" }
  );

  console.log("Admin account created successfully.");
} catch {
  console.error("Admin creation failed. Check the database output above.");
  process.exitCode = 1;
}
