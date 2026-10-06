import {
  createStaffController,
  getStaffController,
  updateStaffRoleController,
  resetStaffPasswordController,
} from "../controllers/staffController.js";

export async function handleStaffRoute(request, env) {
  const url = new URL(request.url);

  // GET /api/staff
  if (
    request.method === "GET" &&
    url.pathname === "/api/staff"
  ) {
    return getStaffController(request, env);
  }

  // POST /api/staff
  if (
    request.method === "POST" &&
    url.pathname === "/api/staff"
  ) {
    return createStaffController(request, env);
  }

  // PATCH /api/staff/:id/role
  if (
    request.method === "PATCH" &&
    url.pathname.match(/^\/api\/staff\/\d+\/role$/)
  ) {
    return updateStaffRoleController(request, env);
  }

  if (
    request.method === "POST" &&
    url.pathname.match(/^\/api\/staff\/\d+\/reset-password$/)
  ) {
    return resetStaffPasswordController(request, env);
  }

  return null;
}
