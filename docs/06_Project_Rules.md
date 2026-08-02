# Akrielle Development Rules

Version: 1.0

---

# Purpose

This document defines the engineering standards, coding conventions, and development principles for Akrielle.

Every contributor, AI assistant, or developer working on Akrielle should follow these rules.

The objective is to maintain a clean, scalable, maintainable, and production-ready codebase.

---

# Core Philosophy

We are not building a college project.

We are building a software company.

Every line of code should be written with scalability, readability, and maintainability in mind.

---

# Product Principles

Every feature must answer YES to all three questions:

1. Does it solve a real user problem?

2. Does it improve the user experience?

3. Would users recommend Akrielle because of this feature?

If the answer is NO, do not build it.

---

# Development Principles

Always choose:

- Simplicity
- Readability
- Reusability
- Performance
- Accessibility

Avoid unnecessary complexity.

---

# Folder Structure

Every feature must be organized.

Example

src/

app/

components/

hooks/

services/

types/

utils/

config/

constants/

assets/

styles/

No random files.

No duplicate code.

---

# Components

Every UI element should become a reusable component whenever possible.

Example

Button

Card

Input

Badge

Modal

Navbar

Footer

UploadCard

RecommendationCard

BeautyProfileCard

Never duplicate component code.

---

# Naming Convention

Components

PascalCase

Example

Navbar.tsx

HeroSection.tsx

BeautyCard.tsx

RecommendationCard.tsx

---

Functions

camelCase

Example

calculateFaceShape()

detectUndertone()

getRecommendations()

---

Variables

camelCase

Example

userImage

faceShape

skinTone

beautyProfile

---

Constants

UPPER_CASE

Example

MAX_IMAGE_SIZE

SUPPORTED_FORMATS

DEFAULT_CONFIDENCE

---

# TypeScript

Use TypeScript everywhere.

Avoid "any".

Prefer explicit interfaces.

Always define types.

---

# Styling

Use Tailwind CSS.

Avoid inline styles.

Avoid hardcoded colors.

Use design tokens.

---

# Animations

Use Framer Motion.

Animations should be:

Smooth

Fast

Elegant

Minimal

Never distracting.

---

# Performance

Optimize every page.

Requirements

Lazy loading

Optimized images

Minimal JavaScript

Fast rendering

High Lighthouse score

---

# Accessibility

Keyboard navigation

Focus states

ARIA labels

Readable contrast

Semantic HTML

Screen reader friendly

---

# Responsive Design

Mobile First

Tablet

Desktop

Large Desktop

Every component must work across all screen sizes.

---

# AI Development

AI recommendations must explain WHY.

Never output unexplained recommendations.

Never rate attractiveness.

Never compare users.

Always educate.

---

# Privacy

User images belong to the user.

Never store images without permission.

Delete temporary files after processing.

Protect user privacy at every stage.

---

# Git Workflow

Every major feature should have its own commit.

Example

Add upload page

Implement AI loading animation

Create recommendation cards

Improve responsive navbar

Commit messages should clearly explain the change.

---

# Pull Request Checklist

Before merging:

Code reviewed

TypeScript passes

Lint passes

Build succeeds

Responsive

Accessible

Performance checked

---

# Error Handling

Every possible error should have a friendly message.

Examples

No face detected.

Please upload another photo.

Multiple faces detected.

Please upload an image containing only one person.

Image quality too low.

Try uploading a clearer image.

---

# User Experience

Every interaction should feel:

Fast

Elegant

Professional

Helpful

Premium

---

# Brand Identity

Akrielle should always feel:

Luxury

Minimal

Modern

Scientific

Trustworthy

Never childish.

Never cluttered.

Never overwhelming.

---

# Long-Term Goal

Every architectural decision should make future features easier to build.

Future features include:

Virtual Makeup Try-On

AI Beauty Coach

AI Skincare Advisor

Hairstyle Recommendations

Color Analysis

Outfit Recommendations

Jewelry Suggestions

Personal AI Stylist

---

# Definition of Done

A feature is complete only if:

✔ Functional

✔ Responsive

✔ Accessible

✔ Tested

✔ Documented

✔ Matches the design system

✔ Ready for production

---

# Final Principle

Code should be written as if Akrielle will serve millions of users.

Every decision should prioritize long-term quality over short-term speed.

---

End of Project Rules