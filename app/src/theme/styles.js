import { colors, spacing, borderRadius } from "./colors";

// Common style objects for reuse
export const commonStyles = {
  container: {
    height: "100vh",
    width: "100vw",
    display: "flex",
    flexDirection: "column",
    bgcolor: colors.background,
    color: colors.textPrimary,
  },
  
  panel: {
    display: "flex",
    flexDirection: "column",
    bgcolor: colors.backgroundSecondary,
  },
  
  header: {
    p: spacing.lg,
    borderBottom: `1px solid ${colors.border}`,
    bgcolor: colors.background,
  },
  
  listItem: {
    px: spacing.lg,
    py: spacing.md,
    "&:hover": {
      bgcolor: colors.hover,
    },
  },
  
  listItemSelected: {
    bgcolor: colors.selected,
    "&:hover": {
      bgcolor: colors.selectedHover,
    },
  },
  
  input: {
    "& .MuiOutlinedInput-root": {
      bgcolor: colors.inputBackground,
      color: colors.textPrimary,
      borderRadius: borderRadius.lg,
      "& fieldset": {
        borderColor: "transparent",
      },
      "&:hover fieldset": {
        borderColor: "transparent",
      },
      "&.Mui-focused fieldset": {
        borderColor: colors.primary,
      },
    },
    "& .MuiInputBase-input::placeholder": {
      color: colors.textSecondary,
    },
  },
  
  searchInput: {
    "& .MuiOutlinedInput-root": {
      bgcolor: colors.background,
      color: colors.textPrimary,
      "& fieldset": {
        borderColor: colors.border,
      },
      "&:hover fieldset": {
        borderColor: colors.borderHover,
      },
      "&.Mui-focused fieldset": {
        borderColor: colors.primary,
      },
    },
    "& .MuiInputBase-input::placeholder": {
      color: colors.textSecondary,
    },
  },
  
  iconButton: {
    color: colors.textSecondary,
    "&:hover": {
      bgcolor: colors.hover,
    },
  },
  
  iconButtonPrimary: {
    color: colors.primary,
    "&:hover": {
      bgcolor: `${colors.primary}15`,
    },
  },
  
  messageBubbleOwn: {
    bgcolor: colors.messageOwn,
    borderRadius: borderRadius.md,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: 0,
  },
  
  messageBubbleOther: {
    bgcolor: colors.messageOther,
    borderRadius: borderRadius.md,
    borderTopLeftRadius: 0,
    borderTopRightRadius: borderRadius.md,
  },
  
  footer: {
    height: "64px",
    borderTop: `1px solid ${colors.border}`,
    bgcolor: colors.background,
    display: "flex",
    width: "100%",
  },
};
