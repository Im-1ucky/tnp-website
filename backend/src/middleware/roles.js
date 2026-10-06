export function requireRole(...allowedRoles) {
  return (user) => {
    if (!user) {
      return Response.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!allowedRoles.includes(user.role)) {
      return Response.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    return null;
  };
}
