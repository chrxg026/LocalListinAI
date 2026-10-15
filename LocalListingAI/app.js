import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

// LocalListing AI uses an open-weight FLAN-T5 model through Transformers.js.
// Model files are downloaded from the model repository on first use and cached by the browser.
env.allowLocalModels = false;
env.useBrowserCache = true;

const form = document.querySelector('#listingForm');
const productName = document.querySelector('#productName');
const details = document.querySelector('#details');
const audience = document.querySelector('#audience');
const price = document.querySelector('#price');
const platform = document.querySelector('#platform');
const tone = document.querySelector('#tone');
const generateBtn = document.querySelector('#generateBtn');
const buttonText = document.querySelector('#buttonText');
const modelStatus = document.querySelector('#modelStatus');
const emptyState = document.querySelector('#emptyState');
const loadingState = document.querySelector('#loadingState');
const loadingTitle = document.querySelector('#loadingTitle');
const loadingMessage = document.querySelector('#loadingMessage');
const progressBar = document.querySelector('#progressBar');
const resultState = document.querySelector('#resultState');
const errorBox = document.querySelector('#errorBox');
const outputTitle = document.querySelector('#outputTitle');
const outputBody = document.querySelector('#outputBody');
const outputTags = document.querySelector('#outputTags');
const copyStatus = document.querySelector('#copyStatus');
const charCount = document.querySelector('#charCount');
let generator = null;
let isLoadingModel = false;
let modelPromise = null;

// Tiny deterministic fallback ensures the tool remains usable if model download fails.
// It is clearly labelled as a template, not AI inference.
function makeTemplate(data) {
  const audienceLine = data.audience ? ` Designed for ${data.audience.toLowerCase()}.` : '';
  const priceLine = data.price ? ` Price: ${data.price}.` : '';
  const firstSentence = data.details.split(/[.!?\n]/).map(s => s.trim()).filter(Boolean)[0] || data.details;
  const title = `${data.name} — ${data.tone === 'premium and elegant' ? 'A thoughtful choice' : data.tone === 'playful and catchy' ? 'A little something special' : data.tone === 'minimal and direct' ? 'Made for everyday use' : 'Made with care'}`;
  const body = `${data.name}\n\n${firstSentence}${audienceLine}\n\n${data.details}${priceLine}\n\nInterested? Message us to ask a question or place an order.`;
  const keywords = data.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean).slice(0, 5);
  return { title, body, tags: [...new Set(['shop small', 'small business', ...keywords])].map(w => `#${w.replace(/\s+/g, '')}`).join('  ') };
}

function collectData() {
  return { name: productName.value.trim(), details: details.value.trim(), audience: audience.value.trim(), price: price.value.trim(), platform: platform.value, tone: tone.value };
}

function setView(view) {
  emptyState.classList.toggle('hidden', view !== 'empty');
  loadingState.classList.toggle('hidden', view !== 'loading');
  resultState.classList.toggle('hidden', view !== 'result');
  errorBox.classList.toggle('hidden', view !== 'error');
}

async function getGenerator() {
  if (generator) return generator;
  if (modelPromise) return modelPromise;
  isLoadingModel = true;
  modelStatus.textContent = 'Downloading model…';
  loadingTitle.textContent = 'Preparing your local AI…';
  loadingMessage.textContent = 'First run downloads the open-weight model. This can take a few minutes.';
  progressBar.style.width = '8%';
  modelPromise = pipeline('text2text-generation', 'Xenova/flan-t5-small', {
    progress_callback: (info) => {
      if (info.status === 'progress' && typeof info.progress === 'number') {
        progressBar.style.width = `${Math.max(8, Math.min(96, info.progress))}%`;
        loadingMessage.textContent = `Downloading model files… ${Math.round(info.progress)}%`;
      } else if (info.status === 'done') {
        progressBar.style.width = '100%';
      }
    }
  }).then((loaded) => {
    generator = loaded;
    modelStatus.textContent = 'Model ready';
    return generator;
  }).catch((error) => {
    modelStatus.textContent = 'Model unavailable';
    modelPromise = null;
    throw error;
  }).finally(() => {
    isLoadingModel = false;
  });
  return modelPromise;
}

async function generateText(prompt, maxNewTokens = 120) {
  const model = await getGenerator();
  const result = await model(prompt, { max_new_tokens: maxNewTokens, num_beams: 2, repetition_penalty: 1.15 });
  return (result?.[0]?.generated_text || '').trim();
}

function cleanOutput(text, fallback) {
  const cleaned = text.replace(/^\s*(headline|title|description|listing|hashtags|keywords)\s*:\s*/i, '').trim();
  return cleaned.length > 2 ? cleaned : fallback;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = collectData();
  if (!data.name || !data.details) return;
  generateBtn.disabled = true;
  buttonText.textContent = 'Writing your listing…';
  copyStatus.textContent = '';
  errorBox.textContent = '';
  setView('loading');
  try {
    const fallback = makeTemplate(data);
    const common = `Write for the platform ${data.platform}. Style: ${data.tone}. Product: ${data.name}. Verified product details: ${data.details}. Target customer: ${data.audience || 'general shoppers'}. Price: ${data.price || 'not provided'}. Do not invent specifications, certifications, discounts, delivery promises, or benefits that are not in the details.`;
    loadingTitle.textContent = 'Drafting your listing…';
    loadingMessage.textContent = 'The open-weight model is generating text in your browser.';
    progressBar.style.width = '100%';
    const [titleText, bodyText, tagsText] = await Promise.all([
      generateText(`Create one short, appealing product listing headline. No quotes. No unsupported claims. ${common}`, 40),
      generateText(`Write a useful product listing description in 3 to 5 short sentences. Include only facts provided. Add a gentle call to action. Do not repeat the prompt. ${common}`, 150),
      generateText(`Suggest 5 concise social hashtags or search keywords for this product. Return only the tags separated by spaces. Do not add claims. ${common}`, 50)
    ]);
    outputTitle.value = cleanOutput(titleText, fallback.title);
    outputBody.value = cleanOutput(bodyText, fallback.body);
    outputTags.value = cleanOutput(tagsText, fallback.tags).replace(/\s+/g, ' ');
    setView('result');
  } catch (error) {
    // If model download is blocked, still provide a usable draft and explain the fallback.
    const fallback = makeTemplate(data);
    outputTitle.value = fallback.title;
    outputBody.value = fallback.body;
    outputTags.value = fallback.tags;
    setView('result');
    errorBox.textContent = `The open model could not load (${error.message || 'network or browser limitation'}). A basic template is shown instead; this fallback is not AI-generated. Try again with internet access, or serve the project from localhost.`;
    errorBox.classList.remove('hidden');
  } finally {
    generateBtn.disabled = false;
    buttonText.textContent = 'Generate my listing';
  }
});

details.addEventListener('input', () => { charCount.textContent = `${details.value.length} / 900`; });

function getFullListing() {
  return `${outputTitle.value.trim()}\n\n${outputBody.value.trim()}\n\n${outputTags.value.trim()}`;
}

document.querySelector('#copyBtn').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(getFullListing());
    copyStatus.textContent = 'Copied — ready to paste into your shop.';
  } catch {
    const range = document.createRange();
    range.selectNodeContents(outputBody);
    const selection = window.getSelection();
    selection.removeAllRanges(); selection.addRange(range);
    copyStatus.textContent = 'Clipboard access was blocked. Select and copy the text manually.';
  }
});

document.querySelector('#downloadBtn').addEventListener('click', () => {
  const blob = new Blob([getFullListing()], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${productName.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'product-listing'}.txt`;
  document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
});
