# Akrielle AI Architecture

Version: 1.0

Status: Draft

---

# Overview

Akrielle's AI system analyzes a user's selfie and transforms visual facial characteristics into personalized beauty recommendations.

The AI should never judge attractiveness.

Its purpose is to understand facial features and recommend styles that naturally complement those features.

---

# AI Objectives

The AI should identify:

- Face Shape
- Skin Tone
- Skin Undertone
- Eye Shape
- Lip Shape
- Eyebrow Shape

Future versions may include:

- Skin Condition
- Hair Texture
- Hair Color
- Facial Symmetry
- Age Group Estimation
- Makeup Detection

---

# AI Pipeline

Upload Image

↓

Image Validation

↓

Face Detection

↓

Face Landmarks

↓

Face Shape Classification

↓

Skin Tone Detection

↓

Undertone Detection

↓

Eye Shape Detection

↓

Lip Shape Detection

↓

Eyebrow Analysis

↓

Beauty Profile Generation

↓

Recommendation Engine

↓

Results Page

---

# Step 1 — Image Validation

Before AI processing begins:

Check:

✔ Image uploaded

✔ One face only

✔ Face visible

✔ Good lighting

✔ Sufficient resolution

Reject images that fail validation.

---

# Step 2 — Face Detection

Purpose

Locate the face inside the image.

Technology

MediaPipe Face Detection

Output

Face Bounding Box

Face Position

Detection Confidence

---

# Step 3 — Face Landmarks

Purpose

Identify important facial landmarks.

Technology

MediaPipe Face Mesh

Output

468 facial landmarks

These landmarks are used to determine:

Face Shape

Eyes

Lips

Eyebrows

Jawline

Forehead

---

# Step 4 — Face Shape Classification

Possible Results

Oval

Round

Square

Heart

Diamond

Rectangle

Triangle

Algorithm

Use landmark distances and facial proportions.

Output

Face Shape

Confidence Score

---

# Step 5 — Skin Tone Detection

Purpose

Estimate visible skin tone.

Possible Categories

Very Fair

Fair

Light

Medium

Tan

Deep

Dark

Future

Continuous color estimation.

---

# Step 6 — Undertone Detection

Possible Results

Warm

Cool

Neutral

Olive

Method

Analyze skin color while minimizing lighting influence.

---

# Step 7 — Eye Shape Detection

Possible Results

Almond

Round

Hooded

Monolid

Upturned

Downturned

Deep Set

---

# Step 8 — Lip Shape Detection

Possible Results

Full

Thin

Wide

Heart

Balanced

---

# Step 9 — Eyebrow Analysis

Possible Results

Straight

Soft Arch

High Arch

Rounded

Flat

---

# Beauty Profile

The AI generates a structured profile.

Example

Face Shape:
Oval

Skin Tone:
Medium

Undertone:
Warm

Eye Shape:
Almond

Lip Shape:
Full

Eyebrows:
Soft Arch

---

# Recommendation Engine

The recommendation engine uses Beauty Profile information to generate suggestions.

Inputs

Face Shape

Skin Tone

Undertone

Eye Shape

Lip Shape

Outputs

Foundation

Lipstick

Blush

Eyeshadow

Contour

Highlighter

Future

Hairstyles

Hair Colors

Jewelry

Glasses

Fashion Colors

---

# Recommendation Philosophy

Recommendations should explain WHY.

Example

Recommended

Peach Blush

Reason

Peach complements warm undertones and creates a natural appearance.

Never recommend without explanation.

---

# AI Principles

The AI must never:

Rate beauty.

Compare users.

Judge attractiveness.

Create unrealistic expectations.

The AI exists to educate and guide.

---

# Future AI

Version 2

Virtual Makeup Try-On

Version 3

Skin Analysis

Version 4

Beauty Chat Assistant

Version 5

Personal Stylist

---

End of AI Architecture