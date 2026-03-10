# BusinessFinder

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://reactjs.org/)
[![Django](https://img.shields.io/badge/Django-5.0-green)](https://www.djangoproject.com/)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple)](https://vitejs.dev/)

BusinessFinder is an interactive web application designed to help users discover and support small, local businesses in their communities. Built with React and Django, it provides a user-friendly interface for browsing nearby businesses, reading reviews, bookmarking favorites, and accessing special deals.

## 🚀 Features

- **Interactive Map & Directory**: Browse local businesses with an integrated map view and comprehensive directory
- **Category Filtering**: Sort businesses by categories (restaurants, cafés, retail, services, etc.)
- **Reviews & Ratings**: Read Google reviews and ratings, leave your own reviews when logged in
- **Sorting Options**: Sort businesses by name, rating, or review count
- **Bookmarking**: Save favorite businesses to your personal account
- **Special Deals**: View exclusive offers and coupons from local businesses
- **User Authentication**: Secure login/signup system with role-based access (users and businesses)
- **Bot Prevention**: Verification steps for review submissions and account creation
- **Responsive Design**: Mobile-friendly interface with dark/light theme support
- **Multi-language**: English and French language support

## 🏗️ Architecture

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **State Management**: React Context API
- **Maps**: Google Maps integration
- **Accessibility**: WCAG compliant components

### Backend
- **Framework**: Django 5.0 with Django REST Framework
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: Django AllAuth with token authentication
- **APIs**: Google Places API, Gemini API, reCAPTCHA
- **Data Models**: Businesses, Reviews, Bookmarks, User Profiles

## 📋 Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Google Places API key
- Google Gemini API key (optional, for AI features)
- reCAPTCHA keys (for bot prevention)

## 🛠️ Installation

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd server/backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv env
   # On Windows:
   env\Scripts\activate
   # On macOS/Linux:
   source env/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   Create a `.env` file in `server/backend/` with:
   ```
   GOOGLE_PLACES_API_KEY=your_google_places_api_key
   GEMINI_API_KEY=your_gemini_api_key
   RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
   SECRET_KEY=your_django_secret_key
   ```

5. Run database migrations:
   ```bash
   python manage.py migrate
   ```

6. (Optional) Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

7. Start the development server:
   ```bash
   python manage.py runserver
   ```
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd client/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

## 🚀 Usage

1. **Browse Businesses**: Use the interactive map on the homepage to discover nearby businesses
2. **Filter & Search**: Use category filters and text search in the Directory
3. **Create Account**: Sign up for free to access additional features
4. **Leave Reviews**: Share your experiences with businesses
5. **Bookmark Favorites**: Save businesses for quick access later
6. **View Deals**: Check for special offers and coupons

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/registration/` - User registration
- `POST /api/auth/logout/` - User logout

### Businesses
- `GET /api/businesses/` - List businesses with filtering
- `GET /api/businesses/{id}/` - Business details
- `POST /api/businesses/{id}/reviews/` - Add review
- `POST /api/bookmarks/` - Bookmark business

### Reports
- `POST /api/generate_report/` - Generate business reports

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Places API for business data
- Google Maps for mapping functionality
- Open source community for the amazing tools and libraries

## 📞 Support

If you have any questions or issues, please open an issue on GitHub or contact the development team.
