# PLAN: Phase 8 - Windows Packaging & Distribution

## Objective
Package the IRIS application into a production-ready Windows installer (.exe) with optimized assets and static frontend.

## Agents Involved
| Agent | Role | Responsibility |
|-------|------|----------------|
| `frontend-specialist` | Frontend | Configure Next.js static export & trailing slashes |
| `devops-engineer` | Packaging | Setup `electron-builder`, resources, and NSIS installer |
| `test-engineer` | Verification | Validate build integrity and installer generation |

## Implementation Steps

### 1. Frontend Preparation (`frontend-specialist`)
- [ ] Modify `dashboard-ui/next.config.mjs` for `output: 'export'`
- [ ] Verify `npm run build` generates `out/` directory
- [ ] Ensure all assets use relative paths for Electron compatibility

### 2. Assets & Resources (`devops-engineer`)
- [ ] Create `resources/` directory
- [ ] Generate `resources/icon.ico` and `resources/icon.png`
- [ ] Refine `package.json` build config to include correct files

### 3. Packaging Configuration (`devops-engineer`)
- [ ] Configure NSIS for custom install location and shortcuts
- [ ] Set `appId` and `productName` consistently
- [ ] Setup production entry point logic in `electron/main.ts`

### 4. Verification (`test-engineer`)
- [ ] Run `npm run build` (Full Suite)
- [ ] Execute `npx electron-builder --windows --dir` (Dry run)
- [ ] Verify final `.exe` bundle contents
