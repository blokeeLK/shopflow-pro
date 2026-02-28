

The issue is that the banner container forces a fixed `aspectRatio: '1920/560'` and uses `object-cover`, which crops images that don't match that exact ratio. The fix is to remove the forced aspect ratio and use `object-contain` or simply let images display at their natural proportions.

## Changes

**File: `src/components/HeroCarousel.tsx`**

1. In `SlideImage` component (line 62-70): Remove the fixed `aspectRatio` style and change `object-cover` to `object-contain` or just use `w-full` with auto height. The image will display at its natural aspect ratio without cropping.

2. In the fallback section (line 50-58): Same change — remove forced aspect ratio, let the image render naturally.

Specifically:
- Remove `style={{ maxWidth: 1920, margin: '0 auto', aspectRatio: '1920/560' }}` from the wrapper divs
- Change `className="w-full h-full object-cover"` to `className="w-full h-auto"` on the `<img>` tags
- Keep `maxWidth: 1920` and `margin: '0 auto'` on the wrapper for centering on ultra-wide screens

