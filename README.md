# ChatApp - Real-Time MERN Chat Application

A full-stack, production-ready chat application built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.io for real-time communication. This application features a modular, scalable architecture similar to WhatsApp.

![ChatApp](https://img.shields.io/badge/MERN-Stack-green)
![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Features

### Core Features
- ✅ **User Authentication & Authorization**
  - JWT-based secure authentication
  - Password hashing with bcryptjs
  - Protected routes and API endpoints
  
- ✅ **Real-Time Messaging**
  - Instant message delivery with Socket.io
  - Typing indicators
  - Online/offline status
  - Message read receipts
  - Message delivery status

- ✅ **User Management**
  - User registration and login
  - Profile management (avatar, bio, status)
  - User search functionality
  - Contact management

- ✅ **Conversation Management**
  - One-on-one conversations
  - Group chat support (architecture ready)
  - Conversation list with last message preview
  - Delete conversations
  - Search conversations

- ✅ **Media Sharing**
  - Image uploads and sharing
  - File attachments
  - Media preview in chat

- ✅ **Modern UI/UX**
  - Responsive design (mobile-friendly)
  - Beautiful Tailwind CSS styling
  - Emoji picker integration
  - Smooth animations
  - Loading states and error handling

### 🔒 Security & Scalability Features
- **Rate Limiting**: Protection against abuse and DDoS attacks
- **Input Sanitization**: MongoDB injection and XSS prevention
- **Security Headers**: Helmet.js with CSP, HSTS, and more
- **File Upload Security**: Strict validation and path traversal prevention
- **Database Connection Pooling**: Optimized for scalability
- **Request Logging**: Comprehensive access and error logging
- **Environment Validation**: Startup validation of all configurations
- **Strong Password Policy**: Enforced password complexity requirements

### Technical Features
- **Modular Architecture**: Clean separation of concerns
- **Scalable Design**: Ready for horizontal scaling
- **Security**: Helmet.js, CORS, rate limiting ready
- **Performance**: Compression, optimized queries
- **Real-time**: WebSocket connections via Socket.io
- **State Management**: Zustand for efficient state management
- **API Design**: RESTful API with proper error handling

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** package manager

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd ChatApp
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env file with your configuration
# Update MongoDB URI, JWT Secret, etc.
```

**Configure `.env` file:**

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from root)
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env file with your configuration
```

**Configure `.env` file:**

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Database Setup

Make sure MongoDB is running on your system:

```bash
# Windows (if installed as service)
net start MongoDB

# macOS/Linux
sudo systemctl start mongod

# Or using MongoDB Compass, connect to: mongodb://localhost:27017
```

## 🚀 Running the Application

### Development Mode

You need to run both backend and frontend servers:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### Production Mode

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 📁 Project Structure

```
ChatApp/
├── backend/
│   ├── config/
│   │   └── db.js                 # Database configuration
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── conversationController.js
│   │   ├── messageController.js
│   │   └── contactController.js
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT authentication
│   │   ├── errorMiddleware.js    # Error handling
│   │   └── uploadMiddleware.js   # File upload handling
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── Conversation.js      # Conversation schema
│   │   └── Message.js           # Message schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── conversationRoutes.js
│   │   ├── messageRoutes.js
│   │   └── contactRoutes.js
│   ├── utils/
│   │   └── tokenUtils.js        # JWT utilities
│   ├── socket.js                # Socket.io configuration
│   ├── server.js                # Express server entry
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx   # Main chat interface
│   │   │   ├── Sidebar.jsx      # Conversation list
│   │   │   ├── UserProfile.jsx  # User profile modal
│   │   │   ├── SearchUsers.jsx  # User search modal
│   │   │   └── LoadingSpinner.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx        # Login page
│   │   │   ├── Register.jsx     # Registration page
│   │   │   └── Chat.jsx         # Main chat page
│   │   ├── store/
│   │   │   ├── authStore.js     # Auth state management
│   │   │   └── chatStore.js     # Chat state management
│   │   ├── lib/
│   │   │   ├── axios.js         # Axios configuration
│   │   │   └── socket.js        # Socket.io client
│   │   ├── App.jsx              # Main App component
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env.example
│
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/profile` - Update user profile (protected)
- `GET /api/auth/search?query=<term>` - Search users (protected)

### Conversations
- `GET /api/conversations` - Get all conversations (protected)
- `GET /api/conversations/:id` - Get single conversation (protected)
- `POST /api/conversations` - Create conversation (protected)
- `DELETE /api/conversations/:id` - Delete conversation (protected)

### Messages
- `POST /api/messages` - Send message (protected)
- `GET /api/messages/:conversationId` - Get messages (protected)
- `PUT /api/messages/:messageId/read` - Mark as read (protected)
- `DELETE /api/messages/:messageId` - Delete message (protected)

### Contacts
- `GET /api/contacts` - Get user contacts (protected)
- `POST /api/contacts` - Add contact (protected)
- `DELETE /api/contacts/:contactId` - Remove contact (protected)

## 🔐 Socket.io Events

### Client → Server
- `join-conversation` - Join a conversation room
- `leave-conversation` - Leave a conversation room
- `send-message` - Send a message
- `typing` - Emit typing indicator
- `message-read` - Mark message as read
- `message-delivered` - Mark message as delivered

### Server → Client
- `receive-message` - Receive new message
- `user-online` - User came online
- `user-offline` - User went offline
- `user-typing` - User is typing
- `message-read-update` - Message read status update
- `message-delivered-update` - Message delivery update

## 🎨 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File uploads
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Zustand** - State management
- **Socket.io Client** - Real-time client
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **React Icons** - Icons
- **date-fns** - Date formatting
- **React Hot Toast** - Notifications
- **Emoji Picker React** - Emoji support

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- HTTP security headers with Helmet
- CORS configuration
- Input validation
- XSS protection
- Rate limiting ready
- Secure file upload validation

## 🚀 Deployment

### Backend Deployment (Heroku/Railway/Render)

1. Create account on your preferred platform
2. Create new app
3. Add MongoDB Atlas connection string
4. Set environment variables
5. Deploy from GitHub or CLI

### Frontend Deployment (Vercel/Netlify)

1. Build the frontend: `npm run build`
2. Deploy the `dist` folder
3. Set environment variables
4. Configure redirects for SPA

### MongoDB Atlas

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster
3. Get connection string
4. Update MONGO_URI in backend .env

## 📱 Features Coming Soon

- [ ] Voice messages
- [ ] Video calls
- [ ] Screen sharing
- [ ] Message reactions
- [ ] Message forwarding
- [ ] Group chat management
- [ ] Chat themes
- [ ] Message search
- [ ] Notifications
- [ ] End-to-end encryption

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Your Name - [Your GitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- React community for amazing libraries
- Socket.io for real-time functionality
- MongoDB for the database
- Tailwind CSS for styling utilities

---

**Happy Coding! 💻🚀**

For issues and feature requests, please create an issue on GitHub.
