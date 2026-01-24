# Images Directory Structure

This directory contains all images used in the Mellia POS application.

## Directory Organization

```
public/images/
├── logos/        # Company logos, brand assets
├── icons/        # Custom icons, badges (if not using Lucide)
├── products/     # Product images for menu items
└── users/        # User avatars, profile pictures
```

## Usage Guidelines

### Logos
- Company logo variations (white, colored, dark)
- Partner logos
- Format: PNG or SVG
- Recommended size: 512x512px for main logo

### Icons
- Custom icon assets
- Format: SVG preferred (scalable)
- Note: We primarily use Lucide React icons in the app

### Products
- Menu item photos
- Product catalog images
- Format: JPG or WebP for optimization
- Recommended size: 800x600px (4:3 ratio)
- Naming convention: `product-{id}-{name}.jpg`

### Users
- User profile pictures
- Staff photos
- Format: JPG or PNG
- Recommended size: 400x400px (square)
- Naming convention: `user-{id}.jpg`

## Optimization

All images should be optimized before upload:
- Use WebP format when possible
- Compress images to reduce file size
- Next.js will automatically optimize images using `next/image`

## Examples

```jsx
import Image from 'next/image';

// Logo
<Image
  src="/images/logos/mellia-logo.png"
  alt="Mellia POS"
  width={200}
  height={60}
/>

// Product
<Image
  src="/images/products/product-123-burger.jpg"
  alt="Burger"
  width={400}
  height={300}
/>

// User Avatar
<Image
  src="/images/users/user-456.jpg"
  alt="User"
  width={100}
  height={100}
  className="rounded-full"
/>
```

## Notes

- All paths are relative to `/public`
- Next.js Image component automatically optimizes images
- Use AVIF/WebP formats for best performance
- Keep original images in a separate backup folder
