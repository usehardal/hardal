# TypeScript Setup for Hardal

## Issue: Cannot find module 'hardal/react'

If you see this error in your IDE:
```
Cannot find module 'hardal/react' or its corresponding type declarations. ts(2307)
```

### Solution

The package now properly supports subpath imports. Follow these steps:

### 1. Install the Package

First, make sure you have the latest version:

```bash
npm install hardal@latest
# or
bun add hardal@latest
```

### 2. TypeScript Configuration

Ensure your `tsconfig.json` has proper module resolution:

```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

### 3. Next.js Configuration

For Next.js projects, your `tsconfig.json` should look like this:

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### 4. Import Usage

After proper setup, you can import like this:

```tsx
// ✅ Correct imports
import Hardal from 'hardal';
import { HardalProvider, useHardal } from 'hardal/react';

// Your code
<HardalProvider config={{ website: 'your-id' }}>
  <App />
</HardalProvider>
```

### 5. If TypeScript Still Complains

If you're still seeing errors after installation:

1. **Restart TypeScript Server** in your IDE:
   - VS Code: `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"
   - WebStorm: Right-click any `.ts` file → "TypeScript" → "Restart TypeScript Service"

2. **Clear node_modules and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Verify installation**:
   ```bash
   ls node_modules/hardal/dist/react/
   ```
   You should see files like `index.js`, `index.d.ts`, etc.

### 6. For Development/Local Testing

If you're testing the package locally (not from npm):

```bash
# In the hardal package directory
npm link

# In your project directory
npm link hardal
```

## Module Structure

The package exports the following subpaths:

- `hardal` - Main package (Hardal class)
- `hardal/react` - React integration (hooks, provider, HOC)

Both are properly typed with TypeScript definitions.

## Supported Environments

- ✅ Next.js (App Router & Pages Router)
- ✅ Create React App
- ✅ Vite
- ✅ Webpack
- ✅ Node.js (CommonJS)
- ✅ Modern bundlers (ESM support)

## Need Help?

If you're still having issues:

1. Check that you have React 16.8+ installed (peer dependency)
2. Make sure TypeScript version is 4.0+
3. Verify `hardal` is in your `package.json` dependencies

## Example Package.json

```json
{
  "dependencies": {
    "hardal": "^3.1.0",
    "react": "^18.0.0",
    "next": "^14.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.0.0"
  }
}
```

