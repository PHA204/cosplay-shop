# Cosplay Shop Backend

A complete Node.js + Express + PostgreSQL backend for a cosplay shop e-commerce application.

## Features

- User authentication (register, login, profile management)
- Product catalog with categories and variants
- Shopping cart management
- Order processing with inventory management
- Product reviews and ratings
- Wishlist functionality

## Setup

1. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Setup PostgreSQL database**
   - Create a new database: `cosplay_shop`
   - Run the migration script: `scripts/01-init-database.sql`

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Update database credentials and JWT secret

4. **Start the server**
   \`\`\`bash
   npm run dev
   \`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Products
- `GET /api/products` - Get all products with filters
- `GET /api/products/:id` - Get product details with variants
- `GET /api/products/categories/all` - Get all categories

### Cart
- `GET /api/cart` - Get cart items
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/:id` - Update cart item quantity
- `DELETE /api/cart/:id` - Remove item from cart
- `DELETE /api/cart` - Clear cart

### Orders
- `POST /api/orders/create` - Create order from cart
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details

### Reviews
- `GET /api/reviews/product/:product_id` - Get product reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Wishlist
- `GET /api/wishlist` - Get wishlist
- `POST /api/wishlist/add` - Add to wishlist
- `DELETE /api/wishlist/:product_id` - Remove from wishlist

## Database Schema

See `scripts/01-init-database.sql` for complete schema with all tables and relationships.
