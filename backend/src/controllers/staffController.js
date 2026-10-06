import {
  createStaff,
  getAllStaff,
  updateStaffRole,
  resetStaffPassword,
} from "../services/staffService.js";

import { getSessionToken } from "../utils/cookies.js";
import { getUserFromSession } from "../services/authService.js";
import { createAuditLog } from "../services/auditService.js";

export async function getStaffController(request, env) {
  const token = getSessionToken(request);

  if (!token) {
    return Response.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const user = await getUserFromSession(env, token);

  if (!user) {
    return Response.json(
      { error: "Invalid or expired session" },
      { status: 401 }
    );
  }

  if (user.role !== "admin") {
    return Response.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  try {
    const staff = await getAllStaff(env);

    return Response.json({
      staff,
    });
  } catch (error) {
    console.error("Get staff error:", error);

    return Response.json(
      { error: "Unable to retrieve staff" },
      { status: 500 }
    );
  }
}

export async function createStaffController(request, env) {
  // =========================
  // AUTHENTICATION
  // =========================

  const token = getSessionToken(request);

  if (!token) {
    return Response.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const user = await getUserFromSession(env, token);

  if (!user) {
    return Response.json(
      { error: "Invalid or expired session" },
      { status: 401 }
    );
  }

  // =========================
  // AUTHORIZATION
  // =========================

  if (user.role !== "admin") {
    return Response.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  // =========================
  // VALIDATION
  // =========================

  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!name || !email || !password) {
    return Response.json(
      {
        error: "Name, email and password are required",
      },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return Response.json(
      {
        error: "Password must be at least 8 characters",
      },
      { status: 400 }
    );
  }

  // =========================
  // CREATE STAFF
  // =========================

  try {
    const staff = await createStaff(env, {
      name,
      email,
      password,
    });

    await createAuditLog(env, {
      userId: user.id,
      action: "CREATE_STAFF",
      entityType: "user",
      entityId: staff.id,
      details: JSON.stringify({
        name: staff.name,
        email: staff.email,
        role: staff.role,
      }),
    });

    return Response.json(
      {
        message: "Staff account created successfully",
        staff,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create staff error:", error);

    if (error.message?.includes("UNIQUE")) {
      return Response.json(
        {
          error: "An account with this email already exists",
        },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "Unable to create staff account" },
      { status: 500 }
    );
  }
}

export async function updateStaffRoleController(request, env) {
  // =========================
  // AUTHENTICATION
  // =========================

  const token = getSessionToken(request);

  if (!token) {
    return Response.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const currentUser = await getUserFromSession(env, token);

  if (!currentUser) {
    return Response.json(
      { error: "Invalid or expired session" },
      { status: 401 }
    );
  }

  // =========================
  // AUTHORIZATION
  // =========================

  if (currentUser.role !== "admin") {
    return Response.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  // =========================
  // GET TARGET USER ID
  // =========================

  const url = new URL(request.url);

  const userId = Number(
    url.pathname.split("/")[3]
  );

  if (!Number.isInteger(userId) || userId <= 0) {
    return Response.json(
      { error: "Invalid staff ID" },
      { status: 400 }
    );
  }

  // =========================
  // PREVENT SELF ROLE CHANGE
  // =========================

  if (userId === currentUser.id) {
    return Response.json(
      { error: "You cannot change your own role" },
      { status: 400 }
    );
  }

  // =========================
  // VALIDATE NEW ROLE
  // =========================

  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const newRole = body.role;

  if (!["admin", "editor"].includes(newRole)) {
    return Response.json(
      {
        error: "Role must be either admin or editor",
      },
      { status: 400 }
    );
  }

  // =========================
  // UPDATE ROLE
  // =========================

  try {
    const result = await updateStaffRole(
      env,
      userId,
      newRole
    );

    if (result.error) {
      return Response.json(
        { error: result.error },
        { status: result.status }
      );
    }

    // =========================
    // AUDIT LOG
    // =========================

    if (result.changed) {
      await createAuditLog(env, {
        userId: currentUser.id,
        action: "UPDATE_STAFF_ROLE",
        entityType: "user",
        entityId: userId,
        details: JSON.stringify({
          previousRole: result.previousRole,
          newRole,
        }),
      });
    }

    return Response.json({
      message: "Staff role updated successfully",
      staff: result.staff,
    });
  } catch (error) {
    console.error(
      "Update staff role error:",
      error
    );

    return Response.json(
      { error: "Unable to update staff role" },
      { status: 500 }
    );
  }
}

export async function resetStaffPasswordController(request, env) {
  // =========================
  // AUTHENTICATION
  // =========================

  const token = getSessionToken(request);

  if (!token) {
    return Response.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const currentUser = await getUserFromSession(env, token);

  if (!currentUser) {
    return Response.json(
      { error: "Invalid or expired session" },
      { status: 401 }
    );
  }

  // =========================
  // AUTHORIZATION
  // =========================

  if (currentUser.role !== "admin") {
    return Response.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  // =========================
  // GET TARGET USER ID
  // =========================

  const url = new URL(request.url);

  const userId = Number(
    url.pathname.split("/")[3]
  );

  if (!Number.isInteger(userId) || userId <= 0) {
    return Response.json(
      { error: "Invalid staff ID" },
      { status: 400 }
    );
  }

  // =========================
  // VALIDATE PASSWORD
  // =========================

  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const newPassword = body.password;

  if (!newPassword) {
    return Response.json(
      { error: "New password is required" },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return Response.json(
      {
        error: "Password must be at least 8 characters",
      },
      { status: 400 }
    );
  }

  // =========================
  // RESET PASSWORD
  // =========================

  try {
    const result = await resetStaffPassword(
      env,
      userId,
      newPassword
    );

    if (result.error) {
      return Response.json(
        { error: result.error },
        { status: result.status }
      );
    }

    // =========================
    // AUDIT LOG
    // =========================

    await createAuditLog(env, {
      userId: currentUser.id,
      action: "RESET_STAFF_PASSWORD",
      entityType: "user",
      entityId: userId,
      details: JSON.stringify({
        staffEmail: result.staff.email,
      }),
    });

    return Response.json({
      message: "Staff password reset successfully",
      staff: result.staff,
    });
  } catch (error) {
    console.error(
      "Reset staff password error:",
      error
    );

    return Response.json(
      { error: "Unable to reset staff password" },
      { status: 500 }
    );
  }
}
