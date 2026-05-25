import { asyncHandler } from '../../utils/asyncHandler.js';

// Stub controllers — these use pg when fully implemented
export const getStatuses = asyncHandler(async (req, res) => {
  res.json({ statuses: [] });
});

export const createStatus = asyncHandler(async (req, res) => {
  res.status(201).json({ status: {} });
});

export const markStatusViewed = asyncHandler(async (req, res) => {
  res.json({ success: true });
});

export const deleteStatus = asyncHandler(async (req, res) => {
  res.json({ success: true });
});
