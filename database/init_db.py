import sqlite3
import os

def init_db():
    # Resolve the database path relative to this script so it creates in the project root
    db_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(db_dir, 'ecommerce.db')
    print(f"Initializing database at: {db_path}")

    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON;")

    # Drop tables if they exist to start fresh
    cursor.execute("DROP TABLE IF EXISTS order_items;")
    cursor.execute("DROP TABLE IF EXISTS orders;")
    cursor.execute("DROP TABLE IF EXISTS cart_items;")
    cursor.execute("DROP TABLE IF EXISTS products;")
    cursor.execute("DROP TABLE IF EXISTS users;")

    # Create users table
    cursor.execute("""
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Create products table
    cursor.execute("""
    CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        image_url TEXT,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Create cart_items table
    cursor.execute("""
    CREATE TABLE cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    """)

    # Create orders table
    cursor.execute("""
    CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total_price REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # Create order_items table
    cursor.execute("""
    CREATE TABLE order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    """)

    # Sample products to seed
    products = [
        # Electronics
        ("Wireless Noise-Canceling Headphones", 
         "Experience immersive sound with active noise cancellation, 30-hour battery life, and comfortable over-ear design.", 
         199.99, 15, "images/headphones.png", "Electronics"),
        
        ("Smart Fitness Watch", 
         "Track workouts, heart rate, sleep patterns, and receive smartphone notifications. Water-resistant up to 50m.", 
         129.50, 25, "images/smartwatch.png", "Electronics"),
        
        ("Portable Bluetooth Speaker", 
         "Crystal clear audio with deep bass, up to 20 hours of battery life, and IPX7 waterproof rating for outdoor use.", 
         79.99, 40, "images/speaker.png", "Electronics"),

        # Clothing
        ("Classic Leather Jacket", 
         "Genuine premium leather jacket with a timeless design, soft polyester lining, and sleek metallic zippers.", 
         249.00, 10, "images/leather_jacket.png", "Clothing"),
        
        ("Ergonomic Knit Running Shoes", 
         "Breathable knit upper with dynamic cushioning for daily runs and athletic training. Lightweight and comfortable.", 
         89.95, 30, "images/running_shoes.png", "Clothing"),
        
        ("Organic Cotton Crewneck Sweatshirt", 
         "Soft, organic cotton pullover designed for casual comfort. Pre-shrunk fabric and double-stitched durability.", 
         49.99, 50, "images/crewneck.png", "Clothing"),

        # Home & Kitchen
        ("Cold Brew Coffee Maker", 
         "Durable glass carafe with a stainless steel fine-mesh filter for brewing smooth, low-acid cold brew at home.", 
         34.99, 20, "images/coffee_maker.png", "Home & Kitchen"),
        
        ("Minimalist Ceramic Dinnerware Set", 
         "16-piece modern matte finish stoneware set including plates, bowls, and mugs. Microwave and dishwasher safe.", 
         110.00, 12, "images/dinnerware_set.png", "Home & Kitchen"),
        
        ("Scented Soy Wax Candle Tri-Pack", 
         "Premium lavender, vanilla, and eucalyptus essential oil blend candles. Eco-friendly soy wax with 40-hour burn time.", 
         28.00, 60, "images/candle_set.png", "Home & Kitchen"),
        
        ("Adjustable Ergonomic Office Chair", 
         "High-back mesh chair with lumbar support, 3D adjustable armrests, and synchro-tilt mechanism for desk comfort.", 
         189.99, 8, "images/office_chair.png", "Home & Kitchen")
    ]

    cursor.executemany("""
    INSERT INTO products (name, description, price, stock, image_url, category)
    VALUES (?, ?, ?, ?, ?, ?);
    """, products)

    conn.commit()
    conn.close()
    print("Database successfully initialized and seeded with 10 products!")

if __name__ == '__main__':
    init_db()
