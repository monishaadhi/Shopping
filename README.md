# ApexStore - Full-Stack E-Commerce Web Application

A complete full-stack e-commerce storefront for browsing products, managing a cart, and checking out orders.

---

## 🚀 Setup & Run Instructions

### 1. Database Initialization
Ensure you have Python 3 installed. Run the database setup script from the root directory to create the SQLite3 database file `ecommerce.db` and populate it with sample products:
```bash
python3 database/init_db.py
```

### 2. Backend Installation & Startup
Navigate into the `backend` directory, install npm dependencies, and start the Express REST API server:
```bash
cd backend
npm install
npm start
```
The API server runs on `http://localhost:3000`.

### 3. Serving the Frontend
To avoid browser cross-origin constraints (CORS) and ensure correct token management, serve the `frontend/` folder on port `5500`.

*   **Option A: VS Code Live Server (Recommended)**
    Open the workspace in VS Code, right-click `frontend/index.html`, and select **Open with Live Server**. (It defaults to `http://127.0.0.1:5500` or `http://localhost:5500`).
*   **Option B: Python HTTP Server**
    Run a lightweight HTTP server on port 5500 directly from your terminal:
    ```bash
    cd frontend
    python3 -m http.server 5500
    ```

---

## 🛠️ Architecture & Specifications

### Folder Structure
*   `database/init_db.py`: Seeds the SQLite database file (`ecommerce.db`).
*   `backend/`: Express.js API server, SQL commands connected via `better-sqlite3` driver.
*   `frontend/`: Static assets (pages, CSS designs, and JS logic files).

### Tech Stack Details
*   **Frontend:** Standard Semantic HTML5, Vanilla CSS3 (Custom Grid system, glassmorphism shadows, keyframe animations, toasts), Vanilla ES6 JavaScript.
*   **Backend:** Node.js with Express.js REST API.
*   **Database:** SQLite (`ecommerce.db`).
*   **Database Layer:** Python built-in `sqlite3`.
*   **API Security:** JWT Authorization headers verification middleware.
*   **Data Integrity:** SQL transactions for order conversion and inventory stock adjustment to prevent overselling.
