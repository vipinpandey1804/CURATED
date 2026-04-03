# General Instructions - Nordic Commerce Development

## Documentation System

This project uses a structured documentation approach for clarity and continuity.

---

## File Types & Purpose

### `context.md`
**What**: Current project state snapshot  
**Update**: After each major feature completion  
**Contains**: Active work, completed items, next steps, tech stack

### `context_checkpoints/`
**What**: Timestamped session snapshots  
**When**: At natural breakpoints (end of session, major milestone)  
**Format**: `context_checkpoint_DD-MM-YYYY-H-MMPM.md`  
**Purpose**: Resume work in new sessions without context loss

### `plans/`
**What**: Feature specifications and implementation roadmaps  
**Update**: Rarely (planning phase only)  
**Contains**: Detailed requirements, acceptance criteria, technical specs

### `logs/`
**What**: Development activity records  
**Format**: `YYYYMMDD_HHMM_feature_name.md`  
**Contains**: What was built, decisions made, files changed, issues fixed  
**Create**: After completing each development step

### `docs/`
**What**: Feature documentation for end users  
**Update**: When features are production-ready  
**Contains**: How-to guides, API references, architecture explanations

---

## Workflow Pattern

### Starting Work
1. Read `context.md` for current state
2. If resuming, check latest checkpoint in `context_checkpoints/`
3. Review relevant plan in `plans/`

### During Work
- Focus on implementation
- Track decisions mentally or in comments

### After Completing a Step
1. **Create log**: `logs/YYYYMMDD_HHMM_description.md`
   - What was built
   - Files changed
   - Key decisions
   - Issues resolved
2. **Update context.md**: Move completed items, update "In Progress"

### End of Session
1. **Create checkpoint**: `context_checkpoints/context_checkpoint_DD-MM-YYYY-H-MMPM.md`
   - Complete state for resuming
   - Next immediate task
   - Key references
2. **Commit changes** if significant

---

## Maintenance Rules

### DO
- ✅ Keep `context.md` current (max 1 day stale)
- ✅ Create logs for meaningful work (not trivial edits)
- ✅ Use checkpoints for session breaks
- ✅ Reference plans for implementation details
- ✅ Write docs when features are user-ready

### DON'T
- ❌ Create summary markdown files after each change
- ❌ Duplicate information across multiple files
- ❌ Update docs/ until features are stable
- ❌ Edit old logs (they're historical records)
- ❌ Let context.md grow unbounded (move details to docs/)

---

## File Naming Conventions

```
logs/YYYYMMDD_HHMM_feature_description.md
  └─ Example: 20251127_1730_mock_service_layer.md

context_checkpoints/context_checkpoint_DD-MM-YYYY-H-MMPM.md
  └─ Example: context_checkpoint_27-11-2025-5-43PM.md

plans/feature-name-specification.md
  └─ Example: ui-ux-specification.md

docs/FEATURE_NAME_GUIDE.md
  └─ Example: CONNECTION_MANAGEMENT_GUIDE.md
```

---

## Communication Style

### User Preferences
- **Concise responses**: 1-3 sentences for simple tasks
- **No announcement of tools**: Just use them
- **Batch edits**: Use multi_replace when possible
- **Context in replacements**: Include 3-5 lines before/after
- **No summary files**: Unless explicitly requested

### When to Elaborate
- Complex architecture decisions
- Multiple-step workflows
- Error diagnosis
- Planning discussions

---

## Quick Reference

| Need to... | File to use |
|------------|-------------|
| See current state | `context.md` |
| Resume after break | Latest checkpoint in `context_checkpoints/` |
| Understand a feature | `plans/*.md` |
| Know what was done | `logs/*.md` |
| Learn how to use | `docs/*.md` |

---

**Updated**: December 29, 2025