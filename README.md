# WhisprNet - Anonymous Social Hub with AI Moderation

A full-stack MERN application that allows users to post messages anonymously or publicly, with AI-powered content moderation to maintain a safe community environment.

## 🚀 Features

### Core Functionality
- **Anonymous Posting**: Users can post in "Whisper Mode" to hide their identity
- **AI Moderation**: Automatic content filtering using AI to detect toxic, hateful, or inappropriate content
- **Real-time Chat**: Socket.io powered messaging system between users
- **Authentication**: JWT-based auth with Google OAuth integration
- **Password Reset**: Email-based password recovery system

### User Features
- User registration and login (email/password or Google OAuth)
- Profile management with avatar and username updates
- Post creation with text, images, and tags
- Like and comment system
- Real-time notifications
- Responsive design for mobile and desktop

### Moderation Features
- AI-powered content analysis before posts are published
- Automatic blocking of toxic content with user feedback
- Manual moderation tools for administrators
- Community guidelines enforcement

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time communication
- **JWT** for authentication
- **Passport.js** for Google OAuth
- **Nodemailer** for email services
- **Axios** for external API calls
- **bcryptjs** for password hashing

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **TailwindCSS** for styling
- **React Query** for state management
- **Socket.io Client** for real-time features
- **React Hook Form** for form handling
- **React Hot Toast** for notifications
- **Google OAuth** integration

## 📁 Project Structure

```
WhisprNet/
├── server/                 # Backend application
│   ├── models/            # MongoDB models
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Comment.js
│   │   └── Message.js
│   ├── routes/            # API routes
│   │   ├── auth.js
│   │   ├── posts.js
│   │   ├── comments.js
│   │   ├── users.js
│   │   └── chat.js
│   ├── middleware/        # Custom middleware
│   │   ├── auth.js
│   │   └── moderation.js
│   ├── index.js          # Server entry point
│   ├── package.json
│   └── env.example
├── client/               # Frontend application
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── contexts/   # React contexts
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── env.example
├── .gitignore
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Google OAuth credentials (optional)
- Email service credentials (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd WhisprNet
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Set up environment variables**

   **Backend (.env in server directory):**
   ```env
   MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
   PORT=5000
   JWT_SECRET=YOUR_JWT_SECRET_KEY
   MODERATION_API_KEY=YOUR_MODERATION_API_KEY
   EMAIL_USER=YOUR_EMAIL_ADDRESS
   EMAIL_PASS=YOUR_EMAIL_PASSWORD
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173

   ```

   **Frontend (.env in client directory):**
   ```env
   VITE_API_URL=YOUR_BACKEND_URL
   ```

5. **Start the applications**

   **Terminal 1 - Backend:**
   ```bash
   cd server
   npm start
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd client
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/api/health

## 🔧 Configuration

### MongoDB Setup
The application is pre-configured to use a MongoDB Atlas cluster. The connection string is already provided in the environment file. If you want to use your own MongoDB instance:

1. Update the `MONGO_URI` in the server `.env` file
2. Ensure your MongoDB instance is running and accessible

1. **Mock Moderation:**
   - If no API key is provided, the app uses a simple keyword-based filter
   - This allows the app to run without external dependencies

## 📱 Usage

### User Registration & Login
1. Visit the homepage
2. Click "Sign Up" to create an account or "Login" to sign in
3. Use email/password or Google OAuth for authentication
4. Complete your profile setup

### Creating Posts
1. Click "Create Post" or the "+" button
2. Toggle "Whisper Mode" for anonymous posting
3. Add your content, images, and tags
4. Submit - the AI will moderate your content before publishing

### Chatting
1. Navigate to the Chat section
2. Select a conversation or start a new one
3. Send real-time messages to other users

### Profile Management
1. Click on your avatar in the navigation
2. Edit your username and avatar
3. View your post history and statistics

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents API abuse
- **CORS Protection**: Configured for specific origins
- **Input Validation**: Server-side validation for all inputs
- **Helmet.js**: Security headers for Express
- **AI Moderation**: Content filtering before publication

## 🧪 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/google` - Google OAuth initiation
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation
- `GET /api/auth/me` - Get current user

### Posts
- `GET /api/posts` - Get all posts (paginated)
- `POST /api/posts/create` - Create new post
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like/unlike post

### Comments
- `GET /api/comments/post/:postId` - Get post comments
- `POST /api/comments/create` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment
- `POST /api/comments/:id/like` - Like/unlike comment

### Chat
- `GET /api/chat/conversations` - Get user conversations
- `GET /api/chat/messages/:userId` - Get messages with user
- `POST /api/chat/send` - Send message
- `PUT /api/chat/mark-read/:roomId` - Mark messages as read

### Users
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/search/:query` - Search users

## 🚀 Deployment

### Backend Deployment (Heroku)
1. Create a Heroku app
2. Set environment variables in Heroku dashboard
3. Connect to GitHub repository
4. Enable automatic deploys

### Frontend Deployment (Vercel/Netlify)
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables

### Environment Variables for Production
Update the following for production:
- `NODE_ENV=production`
- `CLIENT_URL=https://your-frontend-domain.com`
- `MONGO_URI` (production MongoDB)
- All API keys and secrets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check your MongoDB URI
   - Ensure your IP is whitelisted (for Atlas)
   - Verify network connectivity

2. **Google OAuth Not Working**
   - Verify client ID and secret
   - Check redirect URI configuration
   - Ensure Google+ API is enabled

3. **Email Not Sending**
   - Check email credentials
   - Verify app-specific password (for Gmail)
   - Check email service configuration

4. **AI Moderation Not Working**
   - Verify API key is correct
   - Check API quota limits
   - App will fallback to mock moderation if API fails

### Development Tips

- Use `npm run dev` for backend development with nodemon
- Frontend hot-reloads automatically with Vite
- Check browser console for frontend errors
- Check server logs for backend errors
- Use Postman or similar tools to test API endpoints

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review the API documentation

---

**WhisprNet** - Building safer, more connected communities through anonymous expression and AI moderation.




