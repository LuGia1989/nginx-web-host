 AI Command Center - Ready to Deploy                                                                                                                                                                                                                                                                      
                                                           
  What was built                                                                                                                                                                                                                                                                                           
                                                                                                                                                                                                                                                                                                         
  A futuristic, dark-themed web portal with sidebar navigation for your 4 AI Docker applications. Each tab shows a welcome/landing page with:                                                                                                                                                              
  - Left: Stylized AI-themed placeholder screenshot (unique SVG with neural-network patterns per app)                                                                                                                                                                                                      
  - Below: Glowing "Run Application" button                                                                                                                                                                                                                                                                
  - Right: App description, tags, version, and status metadata                                                                                                                                                                                                                                             
                                                                                                                                                                                                                                                                                                           
  Clicking "Run Application" loads the app in an iframe with a "Back to Overview" button.                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                           
  Project structure

  src/
  ├── index.html          # HTML shell
  ├── css/style.css       # Futuristic dark AI theme
  ├── js/config.js        # App config (edit this to add apps)
  ├── js/app.js           # All dashboard logic
  └── assets/favicon.svg  # Brain/circuit SVG favicon
  nginx/default.conf      # Nginx server config
  Dockerfile              # nginx:alpine image
  docker-compose.yml      # Port 8888, live config mount

  To deploy

  1. Install Docker on your server
  2. Copy the project folder
  3. Edit src/js/config.js with your real app URLs
  4. Run: docker compose up --build -d
  5. Access at: http://your-server:8888

  To add a new app later

  Just add an entry to the apps array in src/js/config.js and refresh the browser -- no rebuild needed.

  Key features

  - Config-driven (single file to edit)
  - Lazy iframe loading with caching (preserves app state)
  - AI-themed SVG placeholders auto-generated per app
  - Sidebar collapse, keyboard shortcuts (1-4 to switch tabs)
  - Responsive design (mobile sidebar overlay)
  - Glass-morphism effects, glowing accents, gradient text

