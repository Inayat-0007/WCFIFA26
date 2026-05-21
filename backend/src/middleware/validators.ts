import { body, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// ─── Generic validation error handler ─────────────────────────────────────────
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({
        field: 'path' in e ? e.path : 'unknown',
        message: e.msg,
      })),
    });
    return;
  }
  next();
};

// ─── League Validators ────────────────────────────────────────────────────────
export const validateCreateLeague = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('League name must be 2-50 characters'),
  validate,
];

export const validateJoinLeague = [
  body('inviteCode')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Invite code must be exactly 6 characters'),
  validate,
];

// ─── Team Validators ─────────────────────────────────────────────────────────
export const validateSaveTeam = [
  body('matchId').notEmpty().withMessage('matchId is required'),
  body('playerIds')
    .isArray({ min: 11, max: 11 })
    .withMessage('You must select exactly 11 players'),
  body('captainId').notEmpty().withMessage('captainId is required'),
  body('viceCaptainId').notEmpty().withMessage('viceCaptainId is required'),
  validate,
];

// ─── Admin Match Score Validators ─────────────────────────────────────────────
export const validateUpdateScore = [
  param('id').notEmpty().withMessage('Match ID is required'),
  body('homeScore')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Home score must be >= 0'),
  body('awayScore')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Away score must be >= 0'),
  body('status')
    .optional()
    .isIn(['UPCOMING', 'LIVE', 'COMPLETED', 'POSTPONED'])
    .withMessage('Invalid match status'),
  validate,
];

// ─── Admin Add Event Validators ───────────────────────────────────────────────
export const validateAddEvent = [
  body('matchId').notEmpty().withMessage('matchId is required'),
  body('type')
    .isIn(['GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD', 'PENALTY_MISS', 'CLEAN_SHEET', 'SUBSTITUTION'])
    .withMessage('Invalid event type'),
  body('minute')
    .isInt({ min: 0, max: 120 })
    .withMessage('Minute must be 0-120'),
  validate,
];

// ─── Admin Update Player Validators ───────────────────────────────────────────
export const validateUpdatePlayer = [
  param('id').notEmpty().withMessage('Player ID is required'),
  body('price')
    .optional()
    .isFloat({ min: 1, max: 20 })
    .withMessage('Price must be between 1 and 20 credits'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters'),
  validate,
];
