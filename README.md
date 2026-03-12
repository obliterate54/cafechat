# كورسات في البرمجة - Korsat X Parmaga
## تابعنا علي اليوتيوب - Follow us on YouTube
https://www.youtube.com/@korsatxparmaga

Follow these steps:
# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS


## MongoDB backend setup

This project now includes a MongoDB backend.

1. Install dependencies:
   npm install
2. Create a `.env` file from `.env.example`
3. Make sure MongoDB is running locally, or set `MONGODB_URI` to your Atlas connection string.
4. Start the backend:
   npm run server
5. In another terminal, start the frontend:
   npm run dev

Default local MongoDB connection:

`mongodb://127.0.0.1:27017/pos_korsat_x_parmaga`

The backend seeds sample categories, products, purchases, and sales the first time the database is empty.
