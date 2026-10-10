# Currency Studio

A standalone HTML/CSS/JavaScript portfolio project by Nikita Rysiev.

Open index.html, or serve the folder with any static HTTP server. No installation or build is needed. Use ?lang=pl, ?lang=en, ?lang=de or ?lang=uk to select the interface language. All assets are included locally.

Exchange rates are fetched from https://api.frankfurter.dev/v2/rate/{base}/{quote}. Internet access is needed to obtain rates; saved rates are clearly marked when used offline. A timeout, invalid-rate handling and input validation protect calculations. History is stored in this browser and can be cleared. Rates are reference rates, excluding fees and spreads.

The portfolio back link uses the public portfolio URL, so the app also works in its own GitHub Pages repository.

## Interface

The responsive interface includes Polish, English, German and Ukrainian, a light/dark theme, local date and time, keyboard-accessible controls and reduced-motion support.

Quick amount and currency-pair buttons update the same converter. The result can be copied, and recent conversions remain in this browser. Published reference rates are not live trading quotes.
