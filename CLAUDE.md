# Notes for Claude sessions

Read README.md first. The short version:

- Edit files in `src/`. Never edit `index.html`, `the-colony.html` or the cache line in `sw.js`
  by hand; run `python3 tools/build.py` and commit the built files with the source.
- Don't rebuild from scratch and don't remove mechanics. Make the smallest change that works.
- Saves: new fields optional, never bump `SAVE_VERSION`, never rename or drop a field.
- Bump `BUILD` in `src/js/ui/settings.js` once per build handed to Daniel or Tom.
- After any change: `python3 tools/lint.py` (0 problems) and `python3 tools/test/check.py`.
  For a pure clean-up it must be identical to the baseline. For a gameplay change, check the
  new behaviour yourself in `dev.html`, then `check.py --record` and say so in the commit.
- New balance numbers for new systems go in `src/js/core/tuning.js`.
- New `.js` files must be added to `src/js/ORDER` (the build fails otherwise). `main/boot.js` stays last.
- All files share one global scope: plain `var`/`function`, ES2017, no modules or imports.
- `main` is the live site (GitHub Pages). Work on a branch and ask before merging into `main`.
- Daniel tests on his phone: keep performance in mind (30fps cap above 200 ants, cached sprites).
