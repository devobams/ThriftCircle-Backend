import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createAdminSchema,
  adminIdParamSchema,
  updateAssignmentsSchema,
  disputeIdParamSchema,
  resolveDisputeSchema,
  analyticsQuerySchema,
  dashboardQuerySchema,
} from "./backOffice.validation.js";
import {
  createAdminAccount,
  listAdmins,
  deactivateAdminAccount,
  updateAssignments,
  listAssignedGroups,
  resolveAdminDispute,
  getAnalytics,
  listAssignedDisputes,
  getBackOfficeDashboard,
} from "./backOffice.service.js";

//POST /back-office/admins
export const handleCreateAdmin = asyncHandler(async (req, res) => {
  const data = createAdminSchema.parse(req.body);
  const result = await createAdminAccount(data, req.user.id);
  res.status(201).json(result);
});

// GET /back-office/admins
export const handleListAdmins = asyncHandler(async (req, res) => {
  const admins = await listAdmins();
  res.status(200).json(admins);
});

// PATCH /back-office/admins/:id/deactivate
export const handleDeactivateAdmin = asyncHandler(async (req, res) => {
  const { id } = adminIdParamSchema.parse(req.params);
  const result = await deactivateAdminAccount(id);
  res.status(200).json(result);
});

// PATCH /back-office/admins/:id/assignments
export const handleUpdateAssignments = asyncHandler(async (req, res) => {
  const { id } = adminIdParamSchema.parse(req.params);
  const { group_ids } = updateAssignmentsSchema.parse(req.body);
  const result = await updateAssignments(id, group_ids, req.user.id);
  res.status(200).json(result);
});

//GET /back-office/groups
export const handleAssignedGroups = asyncHandler(async (req, res) => {
  const groups = await listAssignedGroups(req.user.id, req.user.role);
  res.status(200).json(groups);
});

//GET /back-office/disputes
export const handleAssignedDisputes = asyncHandler(async (req, res) => {
  const disputes = await listAssignedDisputes(req.user.id, req.user.role);
  res.status(200).json(disputes);
});

//PATCH  /back-office/disputes/:id
export const handleResolveDispute = asyncHandler(async (req, res) => {
  const { id } = disputeIdParamSchema.parse(req.params);
  const data = resolveDisputeSchema.parse(req.body);
  const result = await resolveAdminDispute(
    id,
    data,
    req.user.id,
    req.user.role,
  );
  res.status(200).json(result);
});

//GET /back-office/analytics
export const handleAnalytics = asyncHandler(async (req, res) => {
  analyticsQuerySchema.parse(req.query);
  const analytics = await getAnalytics();
  res.status(200).json(analytics);
});

export const handleBackOfficeDashboard = asyncHandler(async (req, res) => {
  const filters = dashboardQuerySchema.parse(req.query);
  const dashboard = await getBackOfficeDashboard(req.user.id, req.user.role, filters);
  res.status(200).json({ success: true, data: dashboard });
});