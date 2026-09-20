Walkthrough: Famous Quotes Web Application (QuoteVerse)
A responsive, modern web application built with Python Flask, Vanilla JavaScript, Vanilla CSS, and HTML5 to explore, search, and display random quotes from an archive of 100 well-known quotes.
What Was Built
1. Curated 100-Quote Dataset
quotes.json
: 100 verified quotes across 10 categories (Wisdom, Philosophy, Science, Motivation, Leadership, Life, Literature, Art, Courage, Creativity) from 47 historical figures and thinkers.
2. Python Flask Backend
app.py
:
GET /: Serves the Single-Page Application.
GET /api/quotes/random: Returns a random quote, optionally filtered by category or author.
GET /api/quotes: Full search & filtering by query text, author, and category.
GET /api/categories: Returns all categories with quote counts.
GET /api/authors: Returns list of all authors with quote counts.
3. Frontend Application
templates/index.html
: Semantic HTML structure with hero spotlight card, search input, author dropdown, category pill chips, quote gallery grid, and slide-over favorites drawer.
static/css/style.css
: Custom CSS design system with CSS custom properties, glassmorphism, responsive grid/flexbox, dark & light theme modes, and ambient background lighting.
static/js/app.js
: Vanilla JavaScript powering live search filtering, category selection, random quote generation with dice animation, Web Speech API text-to-speech, clipboard copy, Twitter/X sharing, and persistent favorites saved in localStorage.
Visual Verification & Screenshots
1. Initial Page Load (Dark Mode)
The hero spotlight quote card displays the quote, author, profession, and interactive action buttons.Initial Page Load

2. Light Theme Mode
Switching themes dynamically adapts backgrounds, cards, typography, and controls.Light Theme Mode

3. Favorites Drawer (Saved Quotes)
Users can bookmark any quote, view their saved collection in the slide-over drawer, or spotlight it.Favorites Drawer

Verification Results
Feature / Test	Status	Result
API Endpoints	✅ Passed	/api/categories, /api/quotes/random, /api/quotes, /api/authors all respond correctly with JSON.
Random Quote Generator	✅ Passed	#btn-random-quote rolls the dice icon and updates the spotlight card.
Category Pill Filtering	✅ Passed	Clicking a category pill (e.g., Science) filters the card grid and updates the count (Showing 7 of 100 quotes).
Author / Keyword Search	✅ Passed	Typing 'Einstein' instantly isolates Albert Einstein's quotes in real-time. Clear button restores full view.
Dark & Light Mode	✅ Passed	#btn-theme-toggle switches theme seamlessly with persistent preference in localStorage.
Favorites System	✅ Passed	Heart toggle saves quotes to localStorage, updates header badge, and renders in the drawer.
Copy to Clipboard	✅ Passed	Formats "{quote}" — {author} and displays a floating toast notification.
Text-to-Speech	✅ Passed	Web Speech API integration reads quotes aloud with audio pulsing state. 
Running the Application Locally
Navigate to the project directory:

bash

cd c:\Users\THINK\Documents\Kaggle\antigravity\agy-cli-projects\famous-quotes
Start the Flask server:

bash

python app.py
Open your browser:


http://127.0.0.1:5000
