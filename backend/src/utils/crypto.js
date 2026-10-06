const encoder = new TextEncoder();

function toHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  return bytes;
}

async function derivePasswordHash(password, salt) {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100_000,
      hash: "SHA-256",
    },
    passwordKey,
    256
  );
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const hash = await derivePasswordHash(password, salt);

  return `${toHex(salt)}:${toHex(hash)}`;
}

export async function verifyPassword(password, storedHash) {
  const [saltHex, hashHex] = storedHash.split(":");

  if (!saltHex || !hashHex) {
    return false;
  }

  const salt = fromHex(saltHex);
  const expectedHash = fromHex(hashHex);

  const actualHash = new Uint8Array(
    await derivePasswordHash(password, salt)
  );

  if (actualHash.length !== expectedHash.length) {
    return false;
  }

  let difference = 0;

  for (let i = 0; i < actualHash.length; i++) {
    difference |= actualHash[i] ^ expectedHash[i];
  }

  return difference === 0;
}

export async function hashToken(token) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(token)
  );

  return toHex(hash);
}

export function generateToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));

  return toHex(bytes);
}
