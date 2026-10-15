# LocalListing AI

A browser-based product listing writer for independent sellers. Built with plain HTML, CSS and JavaScript, using an open-weight FLAN-T5 model through Transformers.js.

## What it does
- Drafts a headline, description, and hashtags/keywords for a product.
- Lets the seller choose a platform, writing style, audience, and price.
- Lets users edit generated text, copy it, or save it as a `.txt` file.
- Does not require an API key or a paid text-generation API.
- Runs model inference in the browser after model files are downloaded and cached.

## Run it
Because this project uses JavaScript modules, open it through a local web server instead of double-clicking the HTML file.

### Option 1: VS Code / terminal with Python installed
1. Extract the ZIP.
2. Open a terminal in the `LocalListingAI` folder.
3. Run `python -m http.server 8000`.
4. Open `http://localhost:8000` in your browser.

### Option 2: VS Code Live Server
Open the folder in VS Code, install the Live Server extension if needed, and choose **Open with Live Server** on `index.html`.

Internet is needed on the first run to fetch the Transformers.js library and model files. The browser caches model files for later use, but exact offline behavior depends on browser cache and storage settings. Once loaded, inference happens in the browser. The app does not send product fields to a generation API.

## Open model
- Model ID: [`Xenova/flan-t5-small`](https://huggingface.co/Xenova/flan-t5-small)
- Runtime: [Transformers.js](https://github.com/xenova/transformers.js)
- Model files are fetched from the model host on first use. Review the model card and license before redistribution or commercial deployment.

## Important limitations
- This is a working prototype, not a verified commercial product.
- Small models can produce awkward copy or miss instructions. Review all claims before posting.
- Model loading and inference speed vary by browser, available memory, and hardware.
- If model loading fails, the app displays a clearly labelled basic template instead of pretending it was AI-generated.
- This version does not upload photos, manage inventory, connect to marketplaces, or process payments.

## Why open innovation matters
The prototype avoids per-request API charges and keeps entered product details in the user's browser during generation. The model can be replaced, adapted, or fine-tuned later for local sellers, regional language needs, or a particular product niche. The trade-off is that the user must download model files and their device does the inference.

## Suggested challenge demo
1. Use a real product from a local shop (with the owner's permission).
2. Generate a listing, then ask the owner what they would change.
3. Record whether they would use it again and what they'd pay, without claiming a paying user until payment actually happens.
