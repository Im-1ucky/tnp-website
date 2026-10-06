const COOKIE_NAME = "tnp_session";

export function setSessionCookie(headers, token, maxAge) {
  headers.append(
    "Set-Cookie",
    [
      `${COOKIE_NAME}=${token}`,
      "HttpOnly",
      "Secure",
      "SameSite=Strict",
      "Path=/",
      `Max-Age=${maxAge}`,
    ].join("; ")
  );
}

export function clearSessionCookie(headers) {
  headers.append(
    "Set-Cookie",
    [
      `${COOKIE_NAME}=`,
      "HttpOnly",
      "Secure",
      "SameSite=Strict",
      "Path=/",
      "Max-Age=0",
    ].join("; ")
  );
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
