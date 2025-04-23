# Blue Whale Competitions

A dynamic competition platform where users can browse, enter, and participate in various competitions by purchasing tickets.

## Features

- User authentication
- Competition discovery and management
- Payment processing via Stripe
- Winner selection and prize claiming
- Administration dashboard for content management
- Mobile-responsive design

## Development Environment

The application is built using:
- React with TypeScript for the frontend
- Express.js for the backend
- PostgreSQL for data storage
- Drizzle ORM for database operations
- Stripe for payment processing

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Access the application at http://localhost:5000

## Environment Variables

The following environment variables are required for full functionality:

```
# Database
DATABASE_URL=postgres://username:password@host:port/database

# Authentication
SESSION_SECRET=your_session_secret

# Stripe (Payments)
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Cloudinary (Image Storage) - Optional for development, required for production
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Image Storage

The application supports two storage methods for images:

### Local Storage (Development)

In development mode, if Cloudinary credentials are not provided, the system automatically uses local file storage. Images are saved to the `/uploads` directory and served directly from the application server.

### Cloudinary Storage (Production)

For production, Cloudinary is recommended for reliable image hosting. To enable Cloudinary:

1. Create a free Cloudinary account at https://cloudinary.com/
2. Locate your cloud name, API key, and API secret from the Cloudinary dashboard
3. Add the following environment variables to your production environment:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

When Cloudinary is configured, all image uploads will automatically be stored in your Cloudinary account, and the URLs will be properly formatted to serve from Cloudinary's CDN.

## Deployment

This application is designed for deployment to platforms like Render or Heroku. The production build process is configured in the project's Docker files and deployment configurations.

### Render Deployment

1. Connect your GitHub repository to Render
2. Create a new Web Service with the following settings:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment Variables: Configure all required environment variables as listed above

## Administration

The application comes with an admin interface for managing competitions, users, and site configuration.

Default admin credentials:
- Username: admin@bluewhalecompetitions.com
- Password: Admin123!

For security, change the admin password after first login in a production environment.