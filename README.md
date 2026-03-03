# Fake Review Predictor (Chrome Extension + ML)

Fake Review Predictor is a project that helps protect consumers from being misled by detecting customer reviews that are fake or artificially generated. :contentReference[oaicite:5]{index=5}

## What we built
- A **Chrome extension** that runs a fake-review prediction workflow.
- Machine learning models trained to classify reviews as **Fake vs Real**, including:
  - Baselines: **Logistic Regression** and **Linear SVM** (TF-IDF features) :contentReference[oaicite:6]{index=6}
  - Final model: **LSTM** for sequential text patterns :contentReference[oaicite:7]{index=7}

## How to use (Chrome Extension)
1. Download the repo as a ZIP and unzip it.
2. Open Chrome and go to `chrome://extensions`
3. Toggle **Developer mode** (top-right)
4. Click **Load unpacked**
5. Select the **`chrome-extension/`** folder inside the unzipped repo

That’s it — the extension should now appear in your extensions list.

## Dataset
We trained on an evenly split dataset of **40,000 total reviews** (20,000 fake, 20,000 legitimate).
Each entry includes review text, product category, rating, and a label (Real/Fake). :contentReference[oaicite:8]{index=8}  
Source: Kaggle dataset listed in the slides. :contentReference[oaicite:9]{index=9}

## Modeling approach
**Baselines (feature-based):**
- Text → TF-IDF features
- Traditional ML classification (Logistic Regression, Linear SVM) :contentReference[oaicite:10]{index=10}

**Deep Learning (LSTM):**
- Tokenize reviews → pad/truncate → embedding → LSTM → sigmoid output :contentReference[oaicite:11]{index=11}
- Train/val/test split: 80/10/10 (stratified) :contentReference[oaicite:12]{index=12}

## Data preprocessing & features
- Baselines: lowercase + remove punctuation + lemmatization :contentReference[oaicite:13]{index=13}  
- LSTM: lowercase + minimal cleaning (keeps more info for the model) :contentReference[oaicite:14]{index=14}  
Feature ideas include TF-IDF, character n-grams, and lexical features (word count, lexical diversity, sentiment extremeness). :contentReference[oaicite:15]{index=15}

## Results (test performance)
Baseline models achieved about **0.89 accuracy**, with F1 around **0.90–0.92**. :contentReference[oaicite:16]{index=16}  
The LSTM achieved **95% overall accuracy** and was selected as the final model. :contentReference[oaicite:17]{index=17}

## Team
Maya Kusumakar, Mark Kozintsev, Amirta, Andrew Chen, Pritul Vachhani :contentReference[oaicite:18]{index=18}
