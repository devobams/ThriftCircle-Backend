import {asyncHandler} from "../../utils/asyncHandler.js";

import {createAdminSchema,adminIdParamSchema,updateAssignmentsSchema} from "./backOffice.validation.js";

import {createAdminAccount,deactivateAdminAccount,updateAssignments} from "./backOffice.service.js";

//POST /back-office/admins

export const handleCreateAdmin = asyncHandler(async (req, res) => {
  const data = createAdminSchema.parse(req.body);

  const result = await createAdminAccount(
    data,
    req.user.id
  );

  res.status(201).json(result);
});

// GET /back-office/admins
export const handleListAdmins = asyncHandler(async (req, res) => {
  const admins = await listAdmins();
  res.status(200).json(admins);
});

// PATCH /back-office/admins/:id/deactivate
export const handleDeactivateAdmin = asyncHandler(async (req, res) => {
  const {id} = adminIdParamSchema.parse(req.params);
  const result = await deactivateAdminAccount(id);
  res.status(200).json(result);
});

// PATCH /back-office/admins/:id/assignments
 export const handleUpdateAssignments = asyncHandler(async (req, res) => {
  const {id} = adminIdParamSchema.parse(req.params);
  const {group_ids} = updateAssignmentsSchema.parse(req.body);
  const result = await updateAssignments(id,group_ids,req.user.id);
  res.status(200).json(result);
});

