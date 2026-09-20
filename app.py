"""
Famous Quotes Web Application - Flask Backend
Provides REST API endpoints for fetching random quotes, searching quotes,
and retrieving available authors and categories.
"""

import json
import os
import random
from flask import Flask, jsonify, render_template, request

app = Flask(__name__, static_folder="static", template_folder="templates")

# Path to quotes.json
DATA_FILE = os.path.join(os.path.dirname(__file__), "quotes.json")

def load_quotes():
    """Load quotes from local JSON file."""
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading quotes: {e}")
        return []

QUOTES = load_quotes()

@app.route("/")
def index():
    """Serve main single-page application."""
    return render_template("index.html")

@app.route("/api/quotes/random")
def get_random_quote():
    """
    Get a single random quote.
    Optional query parameters:
      - category: filter by category
      - author: filter by author name substring
    """
    category = request.args.get("category", "").strip().lower()
    author = request.args.get("author", "").strip().lower()

    candidates = QUOTES

    if category and category != "all":
        candidates = [q for q in candidates if q.get("category", "").lower() == category]

    if author and author != "all":
        candidates = [q for q in candidates if author in q.get("author", "").lower()]

    if not candidates:
        return jsonify({"success": False, "message": "No quotes found matching criteria"}), 404

    chosen = random.choice(candidates)
    return jsonify({"success": True, "quote": chosen})

@app.route("/api/quotes")
def get_quotes():
    """
    Search and filter quotes.
    Query parameters:
      - q: search term matching quote text, author, or profession
      - category: filter by category name
      - author: filter by author name
      - limit: maximum number of quotes to return (default: 100)
    """
    query = request.args.get("q", "").strip().lower()
    category = request.args.get("category", "").strip().lower()
    author = request.args.get("author", "").strip().lower()
    
    try:
        limit = int(request.args.get("limit", 100))
    except ValueError:
        limit = 100

    results = QUOTES

    if category and category != "all":
        results = [q for q in results if q.get("category", "").lower() == category]

    if author and author != "all":
        results = [q for q in results if author in q.get("author", "").lower()]

    if query:
        results = [
            q for q in results
            if query in q.get("quote", "").lower()
            or query in q.get("author", "").lower()
            or query in q.get("profession", "").lower()
            or query in q.get("category", "").lower()
        ]

    return jsonify({
        "success": True,
        "total": len(results),
        "quotes": results[:limit]
    })

@app.route("/api/categories")
def get_categories():
    """Return all unique categories with quote counts."""
    counts = {}
    for q in QUOTES:
        cat = q.get("category", "General")
        counts[cat] = counts.get(cat, 0) + 1

    category_list = [{"name": cat, "count": count} for cat, count in sorted(counts.items())]
    return jsonify({"success": True, "categories": category_list, "total_quotes": len(QUOTES)})

@app.route("/api/authors")
def get_authors():
    """Return all unique authors with quote counts."""
    counts = {}
    for q in QUOTES:
        auth = q.get("author", "Unknown")
        counts[auth] = counts.get(auth, 0) + 1

    sorted_authors = [{"name": auth, "count": count} for auth, count in sorted(counts.items())]
    return jsonify({"success": True, "authors": sorted_authors})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
