# Removed problematic ICOs from src to avoid Turbopack decode errors

This commit deletes src/app/favicon.ico and the nested copy so Vercel/Turbopack won't attempt to decode the ICO files during the build. The app now uses public/favicon.svg instead.
