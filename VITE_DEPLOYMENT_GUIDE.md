# Vite + Preact Deployment Guide

## ✅ Setup Complete!

Your workout app is now configured with:
- **Vite** - Modern build tool
- **Preact** - Lightweight React alternative (3KB)
- **Netlify** - Auto-deployment configured

---

## 📦 What Changed

### New Files Created
```
WorkoutPage/
├── package.json           # Dependencies & scripts
├── vite.config.js         # Vite configuration
├── netlify.toml           # Netlify build settings
├── .gitignore            # Ignore node_modules & dist
└── public/               # Static assets (copied at build)
    ├── manifest.json
    ├── exercises.json
    ├── sw.js
    ├── *.png, *.ico
    └── routines/
```

### Build Output
- **Source**: Your code in `src/`, `index.html`, `style.css`
- **Output**: Optimized bundle in `dist/` folder
- **Bundle Size**: ~60KB total (18.86KB gzipped) ✅

---

## 🚀 Deploying to Netlify

### Option 1: Connect to GitHub (Recommended)

1. **Push to GitHub**
   ```bash
   cd WorkoutPage
   git add .
   git commit -m "Add Vite build setup"
   git push origin master
   ```

2. **Connect Netlify to GitHub**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "New site from Git"
   - Choose GitHub
   - Select repository: `djordan25/MyWorkoutApp`
   - Netlify will auto-detect settings from `netlify.toml`:
     ```
     Build command: npm install && npm run build
     Publish directory: dist
     ```
   - Click "Deploy site"

3. **Automatic Deployments**
   - Every push to `master` = automatic deployment
   - Build time: ~30 seconds
   - You'll get a custom URL like: `your-app-name.netlify.app`

### Option 2: Manual Deploy (Drag & Drop)

1. **Build locally**
   ```bash
   cd WorkoutPage
   npm run build
   ```

2. **Drag `dist` folder to Netlify**
   - Go to [app.netlify.com/drop](https://app.netlify.com/drop)
   - Drag the `dist` folder (not WorkoutPage folder!)
   - Done! ✨

---

## 💻 Development Workflow

### Local Development
```bash
cd WorkoutPage
npm run dev
```
- Opens at `http://localhost:3000`
- Hot reload (changes appear instantly)
- No build step needed during development

### Build for Production
```bash
npm run build
```
- Creates optimized `dist/` folder
- Minified & compressed
- Ready for deployment

### Preview Production Build
```bash
npm run preview
```
- Test the production build locally
- Simulates production environment

---

## 🔧 Common Tasks

### Update Dependencies
```bash
npm update
```

### Add New Dependencies
```bash
npm install package-name
```

### Clean Build
```bash
# Windows
rmdir /s /q dist
npm run build

# Mac/Linux
rm -rf dist
npm run build
```

---

## 📊 Bundle Analysis

Current bundle breakdown:
```
dist/
├── index.html (5.09 KB)
├── assets/
│   ├── index.css (17.99 KB → 4.78 KB gzipped)
│   ├── index.js (60.42 KB → 18.86 KB gzipped)
│   └── vendor.js (0 KB - empty, can be removed)
└── public assets copied as-is
```

**Total JavaScript**: 60.42 KB → 18.86 KB gzipped ✅

---

## 🎯 Next Steps: Migrating to Preact

Your app currently uses vanilla JavaScript. To leverage Preact benefits:

### 1. Start Small - Convert One Component

Example: Convert a button to Preact component

**Before (Vanilla JS)**:
```javascript
const button = document.createElement('button');
button.className = 'btn';
button.textContent = 'Click me';
button.onclick = handleClick;
container.appendChild(button);
```

**After (Preact)**:
```javascript
import { h, render } from 'preact';
import { useState } from 'preact/hooks';

function Button() {
  const [clicked, setClicked] = useState(false);
  
  return (
    <button 
      class="btn" 
      onClick={() => setClicked(true)}
    >
      {clicked ? 'Clicked!' : 'Click me'}
    </button>
  );
}

render(<Button />, container);
```

### 2. Gradual Migration Strategy

1. **Week 1**: Convert `workoutCard.js` to Preact component
2. **Week 2**: Convert `modal.js` to Preact component
3. **Week 3**: Convert `drawer.js` to Preact component
4. **Week 4**: Convert remaining UI components

### 3. Benefits You'll Gain

- ✅ **Virtual DOM** - Better performance with large lists
- ✅ **State Management** - Simpler with hooks
- ✅ **Less Code** - 200+ lines reduced
- ✅ **Better DX** - Easier to reason about

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Netlify Deploy Fails
- Check `netlify.toml` is present
- Verify Node version: Should be 18+
- Check build logs in Netlify dashboard

### Assets Not Loading
- Ensure assets are in `public/` folder
- Vite copies `public/` to `dist/` automatically
- Check paths don't start with `/public/`

### Service Worker Issues
- Service worker is in `public/sw.js`
- Update registration path if needed
- Clear browser cache after deployment

---

## 📝 Git Workflow

### Typical Development Flow

```bash
# Make changes
git add .
git commit -m "Description of changes"
git push origin master

# Netlify auto-deploys!
# Check deployment status at app.netlify.com
```

### Branch Strategy (Optional)
```bash
# Create feature branch
git checkout -b feature/new-feature

# Work on feature
git add .
git commit -m "Add new feature"

# Push to GitHub
git push origin feature/new-feature

# Create Pull Request on GitHub
# Netlify creates preview deployment!

# Merge to master when ready
# Master deployment happens automatically
```

---

## 🎉 Success Checklist

- [x] Vite & Preact installed
- [x] Build process working (`npm run build`)
- [x] `.gitignore` configured
- [x] `netlify.toml` created
- [x] Public assets organized
- [ ] Push to GitHub
- [ ] Connect to Netlify
- [ ] Test deployment
- [ ] Verify app works in production

---

## 📚 Resources

- [Vite Documentation](https://vitejs.dev/)
- [Preact Documentation](https://preactjs.com/)
- [Netlify Documentation](https://docs.netlify.com/)
- [Preact Migration Guide](https://preactjs.com/guide/v10/switching-to-preact)

---

## 💡 Pro Tips

1. **Preview Deployments**: Every PR gets a preview URL
2. **Environment Variables**: Add in Netlify dashboard
3. **Custom Domain**: Free HTTPS with Netlify
4. **Rollbacks**: One-click rollback to previous deploy
5. **Build Plugins**: Extend functionality with Netlify plugins

---

Your app is now production-ready with modern tooling! 🚀

To deploy: Push to GitHub → Connect to Netlify → Auto-deploy! ✨
