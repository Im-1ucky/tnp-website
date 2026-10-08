const COOKIE_NAME = "tnp_session";

function isSecureRequest(request) {
  const url = new URL(request.url);
  return url.protocol === "https:";
}

export function setSessionCookie(headers, token, maxAge, request) {
  const cookie = [
    `${COOKIE_NAME}=${token}`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${maxAge}`,
  ];

  if (isSecureRequest(request)) {
    cookie.push("Secure");
  }

  headers.append("Set-Cookie", cookie.join("; "));
}

export function clearSessionCookie(headers, request) {
  const cookie = [
    `${COOKIE_NAME}=`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    "Max-Age=0",
  ];

  if (isSecureRequest(request)) {
    cookie.push("Secure");
  }

  headers.append("Set-Cookie", cookie.join("; "));
}

export function getSessionToken(request) {
  const cookieHeader = request.headers.get("Cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.trim().split("=");

    if (name === COOKIE_NAME) {
      return valueParts.join("=") || null;
    }
  }

  return null;
}
